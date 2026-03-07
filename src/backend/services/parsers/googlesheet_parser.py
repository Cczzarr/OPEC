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

import csv
import re
from datetime import datetime

import httpx
from bs4 import BeautifulSoup
from loguru import logger

from src.backend.config import CHANGES_PAGE_URL, MAX_PAIRS
from src.backend.database.models import Lesson, SubgroupInfo
from src.backend.utils.date_utils import parse_date_dmy
from src.backend.utils.string_helpers import clean_name, is_group_name

_MIN_CSV_COLUMNS = 2


class GoogleSheetChangesParser:
    def __init__(self, http_client: httpx.AsyncClient):
        self.http_client = http_client

    def _parse_changes_rows(self, rows: list[list[str]]) -> dict:
        result: dict[str, dict[int, Lesson]] = {}
        current_group = ""
        pair_state: dict[tuple[str, int], dict[str, object]] = {}

        if not rows:
            logger.debug("Empty rows list passed to _parse_changes_rows")
            return result

        for row_idx, cells in enumerate(rows):
            if len(cells) < _MIN_CSV_COLUMNS:
                continue

            cells = [c.strip() for c in cells]

            if cells[0] and is_group_name(cells[0]):
                current_group = clean_name(cells[0])

            if not current_group:
                continue

            pair_num_match = re.fullmatch(rf"([1-{MAX_PAIRS}])", cells[1])
            if not pair_num_match:
                continue
            pair_num = int(pair_num_match.group(1))

            asgn_sub = cells[6] if len(cells) > 6 else ""
            asgn_disc = cells[7] if len(cells) > 7 else ""
            asgn_teach = cells[8] if len(cells) > 8 else ""
            asgn_aud = cells[9] if len(cells) > 9 else ""

            rem_sub = cells[2] if len(cells) > 2 else ""
            rem_disc = cells[3] if len(cells) > 3 else ""
            rem_teach = cells[4] if len(cells) > 4 else ""
            rem_aud = cells[5] if len(cells) > 5 else ""

            has_asgn = bool(asgn_disc or asgn_teach or asgn_aud)
            has_rem = bool(rem_disc or rem_teach or rem_aud)
            if not has_asgn and not has_rem:
                continue

            if current_group not in result:
                result[current_group] = {}
            if pair_num not in result[current_group]:
                result[current_group][pair_num] = Lesson()

            target = result[current_group][pair_num]
            state_key = (current_group, pair_num)
            if state_key not in pair_state:
                pair_state[state_key] = {
                    "saw_remove_full": False,
                    "assigned_subs": set(),
                }
            state = pair_state[state_key]

            rem_sub_num = int(rem_sub) if rem_sub in ("1", "2") else 0
            asgn_sub_num = int(asgn_sub) if asgn_sub in ("1", "2") else 0

            if has_rem:
                if rem_sub_num == 1:
                    target.sub1 = SubgroupInfo()
                    target.cancel_sub1 = True
                elif rem_sub_num == 2:
                    target.sub2 = SubgroupInfo()
                    target.cancel_sub2 = True
                else:
                    target.full = SubgroupInfo()
                    target.cancel_full = True
                    state["saw_remove_full"] = True
                    target.sub1 = SubgroupInfo()
                    target.sub2 = SubgroupInfo()
                    target.cancel_sub1 = False
                    target.cancel_sub2 = False

            if has_asgn:
                info = SubgroupInfo(
                    subject=asgn_disc, teacher=asgn_teach, room=asgn_aud
                )
                if asgn_sub_num == 1:
                    target.sub1 = info
                    target.cancel_sub1 = False
                    target.cancel_full = False
                    state["assigned_subs"].add(1)
                elif asgn_sub_num == 2:
                    target.sub2 = info
                    target.cancel_sub2 = False
                    target.cancel_full = False
                    state["assigned_subs"].add(2)
                else:
                    target.full = info
                    target.cancel_full = False
                    target.cancel_sub1 = False
                    target.cancel_sub2 = False

            target.is_cancelled = (
                target.cancel_full or target.cancel_sub1 or target.cancel_sub2
            )

        for (group, pair_num), state in pair_state.items():
            if not state["saw_remove_full"]:
                continue
            assigned_subs = state["assigned_subs"]
            lesson = result[group][pair_num]
            if assigned_subs == {1}:
                lesson.sub2 = SubgroupInfo()
                lesson.cancel_sub2 = True
                lesson.cancel_sub1 = False
                lesson.cancel_full = False
            elif assigned_subs == {2}:
                lesson.sub1 = SubgroupInfo()
                lesson.cancel_sub1 = True
                lesson.cancel_sub2 = False
                lesson.cancel_full = False
            lesson.is_cancelled = (
                lesson.cancel_full or lesson.cancel_sub1 or lesson.cancel_sub2
            )

        return result

    async def _fetch_page(self, url: str, label: str = "") -> httpx.Response | None:
        ctx = f" ({label})" if label else ""
        try:
            resp = await self.http_client.get(url)
            resp.raise_for_status()
            return resp
        except httpx.TimeoutException:
            logger.warning(f"Timeout fetching{ctx}: {url}")
        except httpx.ConnectError as e:
            logger.warning(f"Connection error fetching{ctx}: {e}")
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP {e.response.status_code} fetching{ctx}: {url}")
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching{ctx}: {e}")
        return None

    def _parse_csv_text(self, csv_text: str, label: str = "") -> list[list[str]]:
        if not csv_text or not csv_text.strip():
            logger.debug(f"Empty CSV response for {label}")
            return []

        try:
            rows = list(csv.reader(csv_text.splitlines()))
        except csv.Error as e:
            logger.warning(f"Malformed CSV for {label}: {e}")
            return []

        rows = [r for r in rows if any(cell.strip() for cell in r)]

        if not rows:
            logger.debug(f"CSV for {label} has no non-empty rows")

        return rows

    async def fetch_and_parse(self) -> dict:
        result = {}

        resp = await self._fetch_page(CHANGES_PAGE_URL, "changes page")
        if not resp:
            return {}

        soup = BeautifulSoup(resp.text, "html.parser")
        iframe = soup.find("iframe", class_="timetable-alterations")
        if not iframe:
            iframe = next(
                (
                    fr
                    for fr in soup.find_all("iframe")
                    if "docs.google.com/spreadsheet" in fr.get("src", "")
                ),
                None,
            )

        if not iframe:
            logger.error("Changes iframe not found on page")
            return {}

        iframe_url = iframe.get("src", "")
        if not iframe_url:
            logger.error("Iframe element has no src attribute")
            return {}

        resp_html = await self._fetch_page(iframe_url, "pubhtml")
        if not resp_html:
            return {}

        sheet_tabs = re.findall(
            r'name:\s*["\'](\d{1,2}\.\d{1,2}\.\d{4})["\'].*?gid:\s*["\'](\d+)["\']',
            resp_html.text,
        )

        base_url = re.sub(r"/pubhtml.*$", "", iframe_url.split("?")[0])

        if not sheet_tabs:
            logger.warning("No sheet tabs found in pubhtml, trying fallback CSV")
            r = await self._fetch_page(f"{base_url}/pub?output=csv", "fallback CSV")
            if r:
                rows = self._parse_csv_text(r.text, "fallback")
                parsed = self._parse_changes_rows(rows)
                if parsed:
                    result[datetime.now().strftime("%Y-%m-%d")] = parsed
            return result

        logger.info(f"Found {len(sheet_tabs)} sheet tabs")

        errors = 0
        for label, gid in sheet_tabs:
            date_key = parse_date_dmy(label)
            if not date_key:
                logger.debug(f"Skipping tab with unparseable date: {label}")
                continue

            csv_url = f"{base_url}/pub?gid={gid}&output=csv"
            r = await self._fetch_page(csv_url, f"sheet {label}")
            if not r:
                errors += 1
                continue

            rows = self._parse_csv_text(r.text, label)
            if not rows:
                continue

            parsed = self._parse_changes_rows(rows)
            if parsed:
                result[date_key] = parsed
                logger.info(f"Parsed {len(parsed)} groups for {date_key}")

        if errors > 0:
            logger.warning(f"Failed to fetch {errors}/{len(sheet_tabs)} sheet tabs")

        return result
