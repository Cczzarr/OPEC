# OPEC Schedule
# Copyright (c) 2026 Cczzarr, qqsharki4
# All Rights Reserved.
#
# Authors:
# - GitHub: Cczzarr   | Telegram: t.me/cczzar
# - GitHub: qqsharki4 | Telegram: t.me/now_shark
#
# Repository: https://github.com/Cczzarr/OPEC
#
# This source code is published for viewing and reference only.
# Copying, modification, redistribution, reuse, or deployment of this code,
# in whole or in part, without explicit permission from the authors is prohibited.

import asyncio
import hashlib
import json
import time
from dataclasses import asdict
from datetime import date, datetime

import httpx
from loguru import logger
from sqlmodel import select

from src.backend.config import STATIC_SCHEDULE_PATH
from src.backend.database.db import get_session
from src.backend.database.db_models import ChangesSnapshot
from src.backend.database.models import Lesson, SubgroupInfo
from src.backend.services.parsers.googlesheet_parser import GoogleSheetChangesParser

_FAILURE_ESCALATION_THRESHOLD = 3


class ScheduleService:
    def __init__(self, http_client: httpx.AsyncClient):
        self.http_client = http_client
        self.gsheet_parser = GoogleSheetChangesParser(http_client)

        self.schedules: dict[str, dict[int, dict[int, Lesson]]] = {}
        self.changes_by_date: dict[str, dict[str, dict[int, Lesson]]] = {}
        self.last_pdf_update: float = 0
        self.last_chg_update: float = 0

        self._last_chg_hash: str | None = None

        self._pdf_failures: int = 0
        self._chg_failures: int = 0

    @staticmethod
    def _build_lesson(lesson: dict, *, strict: bool) -> Lesson:
        def _read_subgroup(key: str) -> SubgroupInfo:
            payload = lesson[key] if strict else lesson.get(key, {})
            if payload is None:
                payload = {}
            return SubgroupInfo(**payload)

        return Lesson(
            full=_read_subgroup("full"),
            sub1=_read_subgroup("sub1"),
            sub2=_read_subgroup("sub2"),
            is_cancelled=lesson.get("is_cancelled", False),
            cancel_full=lesson.get("cancel_full", False),
            cancel_sub1=lesson.get("cancel_sub1", False),
            cancel_sub2=lesson.get("cancel_sub2", False),
        )

    @classmethod
    def _build_lesson_map(
        cls, lessons: dict, *, strict: bool
    ) -> dict[int, Lesson]:
        return {
            int(lnum): cls._build_lesson(lesson, strict=strict)
            for lnum, lesson in lessons.items()
        }

    def load_data_from_db(self) -> None:
        self.load_static_schedule()
        self.load_changes_from_db()

    def load_static_schedule(self) -> None:
        if not STATIC_SCHEDULE_PATH.exists():
            logger.info("Static schedule file not found, initializing empty")
            self.schedules = {}
            return

        try:
            with open(STATIC_SCHEDULE_PATH, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            groups_data = raw_data.get("groups", {})
            reconstructed: dict[str, dict[int, dict[int, Lesson]]] = {}
            for group, days in groups_data.items():
                reconstructed[group] = {}
                for day_key, lessons in days.items():
                    reconstructed[group][int(day_key)] = self._build_lesson_map(
                        lessons, strict=False
                    )

            self.schedules = reconstructed
            self.last_pdf_update = STATIC_SCHEDULE_PATH.stat().st_mtime
            logger.info(f"Loaded static schedule: {len(reconstructed)} groups")
        except Exception:
            logger.opt(exception=True).error("Failed to load static schedule from JSON")

    def update_static_schedule(self, data: dict) -> None:
        try:
            with open(STATIC_SCHEDULE_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            self.load_static_schedule()
            logger.info("Static schedule updated and reloaded")
        except Exception:
            logger.opt(exception=True).error("Failed to update static schedule")
            raise

    def patch_static_schedule(self, group: str, day: int, lessons: dict) -> None:
        try:
            raw_data = {"groups": {}}
            if STATIC_SCHEDULE_PATH.exists():
                with open(STATIC_SCHEDULE_PATH, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)

            if "groups" not in raw_data:
                raw_data["groups"] = {}

            if group not in raw_data["groups"]:
                raw_data["groups"][group] = {}

            raw_data["groups"][group][str(day)] = lessons

            self.update_static_schedule(raw_data)
        except Exception:
            logger.opt(exception=True).error(
                f"Failed to patch schedule for {group} day {day}"
            )
            raise

    def add_group(self, group: str) -> None:
        try:
            raw_data = {"groups": {}}
            if STATIC_SCHEDULE_PATH.exists():
                with open(STATIC_SCHEDULE_PATH, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)

            if "groups" not in raw_data:
                raw_data["groups"] = {}

            if group not in raw_data["groups"]:
                raw_data["groups"][group] = {}
                self.update_static_schedule(raw_data)
        except Exception:
            logger.opt(exception=True).error(f"Failed to add group {group}")
            raise

    def load_changes_from_db(self) -> None:
        today = date.today()
        try:
            with get_session() as session:
                rows = session.exec(
                    select(ChangesSnapshot).where(
                        ChangesSnapshot.schedule_date >= today
                    )
                ).all()

            if not rows:
                logger.info("DB cold-start: no changes snapshots found")
                return

            loaded: dict[str, dict[str, dict[int, Lesson]]] = {}
            latest_hash = None
            for row in rows:
                date_str = row.schedule_date.isoformat()
                if latest_hash is None and row.hash_sha256:
                    latest_hash = row.hash_sha256
                try:
                    raw_data = json.loads(row.data)
                    loaded[date_str] = {
                        group: self._build_lesson_map(lessons, strict=True)
                        for group, lessons in raw_data.items()
                    }
                except (json.JSONDecodeError, KeyError, TypeError):
                    logger.warning(
                        f"DB cold-start: invalid data for date {date_str}, skipping"
                    )

            self.changes_by_date = loaded
            self.last_chg_update = time.time()
            self._last_chg_hash = latest_hash
            logger.info(f"DB cold-start: loaded {len(loaded)} date(s) of changes")
        except Exception:
            logger.opt(exception=True).error(
                "DB cold-start: failed to load changes snapshots"
            )

    def get_changes_dates(self) -> list[str]:
        try:
            with get_session() as session:
                db_dates = session.exec(select(ChangesSnapshot.schedule_date)).all()
                db_dates_str = {d.isoformat() for d in db_dates}
            return sorted(set(self.changes_by_date.keys()) | db_dates_str)
        except Exception:
            logger.opt(exception=True).warning("Failed to fetch changes dates from DB")
            return sorted(self.changes_by_date.keys())

    def get_non_archived_changes_dates(self, from_date: date | None = None) -> list[str]:
        lower_bound = from_date or date.today()
        mem_dates: set[str] = set()
        for d in self.changes_by_date.keys():
            try:
                if date.fromisoformat(d) >= lower_bound:
                    mem_dates.add(d)
            except ValueError:
                continue

        try:
            with get_session() as session:
                db_dates = session.exec(
                    select(ChangesSnapshot.schedule_date).where(
                        ChangesSnapshot.schedule_date >= lower_bound
                    )
                ).all()
            db_dates_str = {d.isoformat() for d in db_dates}
            return sorted(mem_dates | db_dates_str)
        except Exception:
            logger.opt(exception=True).warning(
                "Failed to fetch non-archived changes dates from DB"
            )
            return sorted(mem_dates)

    def get_changes_for_date(self, date_str: str) -> dict[str, dict[int, Lesson]]:
        if date_str in self.changes_by_date:
            return self.changes_by_date[date_str]

        try:
            parsed_date = date.fromisoformat(date_str)
            with get_session() as session:
                row = session.exec(
                    select(ChangesSnapshot).where(
                        ChangesSnapshot.schedule_date == parsed_date
                    )
                ).first()

            if not row:
                return {}

            raw_data = json.loads(row.data)
            reconstructed = {
                group: self._build_lesson_map(lessons, strict=True)
                for group, lessons in raw_data.items()
            }
            self.changes_by_date[date_str] = reconstructed
            return reconstructed
        except Exception:
            logger.opt(exception=True).warning(
                f"Failed to fetch historical changes for {date_str}"
            )
            return {}

    async def refresh_changes(self) -> bool:
        try:
            new_changes = await self.gsheet_parser.fetch_and_parse()
            if not new_changes:
                if self.changes_by_date:
                    raise ValueError("Changes parser returned 0 dates")
                return False

            current_data_json = json.dumps(
                new_changes,
                sort_keys=True,
                default=lambda o: (
                    asdict(o) if hasattr(o, "__dataclass_fields__") else str(o)
                ),
            )
            new_hash = hashlib.sha256(current_data_json.encode("utf-8")).hexdigest()

            if new_hash == self._last_chg_hash and self.changes_by_date:
                logger.debug("Changes content unchanged, skipping DB persist")
                return True

            self._log_success("Changes", self._chg_failures)
            self.changes_by_date = new_changes
            self.last_chg_update = time.time()
            self._last_chg_hash = new_hash
            self._chg_failures = 0
            logger.info(f"Changes refreshed: {len(new_changes)} dates")

            asyncio.get_event_loop().run_in_executor(
                None, self._persist_changes_to_db, new_changes, new_hash
            )
            return True
        except Exception as e:
            self._chg_failures += 1
            self._log_failure("Changes", str(e), self._chg_failures)
            return False

    def _persist_changes_to_db(self, changes: dict, data_hash: str) -> None:
        if not changes:
            return
        try:
            now = datetime.utcnow()
            with get_session() as session:
                for date_str, groups_data in changes.items():
                    try:
                        parsed_date = date.fromisoformat(date_str)
                    except ValueError:
                        continue

                    serializable = {}
                    for group, lessons in groups_data.items():
                        serializable[group] = {
                            str(lnum): asdict(lesson)
                            for lnum, lesson in lessons.items()
                        }
                    data_json = json.dumps(serializable, ensure_ascii=False)

                    existing = session.exec(
                        select(ChangesSnapshot).where(
                            ChangesSnapshot.schedule_date == parsed_date
                        )
                    ).first()

                    if existing:
                        existing.data = data_json
                        existing.saved_at = now
                        existing.hash_sha256 = data_hash
                    else:
                        session.add(
                            ChangesSnapshot(
                                schedule_date=parsed_date,
                                saved_at=now,
                                data=data_json,
                                hash_sha256=data_hash,
                            )
                        )
                session.commit()
            logger.debug(f"DB persist: {len(changes)} changes saved")
        except Exception:
            logger.opt(exception=True).warning("DB persist: failed to save changes")

    @property
    def is_ready(self) -> bool:
        return bool(self.schedules)

    @property
    def consecutive_failures(self) -> dict[str, int]:
        return {"pdf": self._pdf_failures, "changes": self._chg_failures}

    @staticmethod
    def _log_success(source: str, count: int) -> None:
        if count > 0:
            logger.info(
                f"{source} refreshed successfully after {count} failed attempts!"
            )

    @staticmethod
    def _log_failure(source: str, reason: str, count: int) -> None:
        msg = f"Failed to refresh {source}: {reason} (attempt #{count})"
        if count >= _FAILURE_ESCALATION_THRESHOLD:
            logger.error(msg)
        else:
            logger.warning(msg)
