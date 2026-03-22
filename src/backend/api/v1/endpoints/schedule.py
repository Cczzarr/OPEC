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

import re
from dataclasses import replace
from datetime import datetime
from typing import Awaitable, Callable, Iterator

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi_limiter.depends import RateLimiter
from loguru import logger

from src.backend.config import MAX_PAIRS
from src.backend.database.models import Lesson, SubgroupInfo
from src.backend.services.schedule_service import ScheduleService
from src.backend.utils.date_utils import get_week_day_key
from src.backend.utils.string_helpers import clean_name

router = APIRouter()


def _parse_iso_date(date_str: str | None) -> datetime:
    if not date_str:
        return datetime.now()
    try:
        return datetime.fromisoformat(date_str)
    except ValueError:
        return datetime.now()


async def _get_ip_identifier(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host if request.client else "unknown"


def _safe_rate_limiter(
    times: int, seconds: int
) -> Callable[[Request, Response], Awaitable[None]]:
    limiter = RateLimiter(times=times, seconds=seconds, identifier=_get_ip_identifier)

    async def dependency(request: Request, response: Response) -> None:
        redis_conn = getattr(request.app.state, "redis", None)
        if redis_conn is None:
            return
        try:
            await limiter(request, response)
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Rate limiter error: {e}")

    return dependency


def get_schedule_service(request: Request) -> ScheduleService:
    service = getattr(request.app.state, "schedule_service", None)
    if not service:
        raise HTTPException(
            status_code=500, detail="ScheduleService is not initialized"
        )
    return service


def _info_to_dict(info: SubgroupInfo) -> dict[str, str]:
    return {
        "subject": info.subject,
        "teacher": info.teacher,
        "room": info.room,
    }


def _is_fully_cancelled_lesson(lesson: Lesson) -> bool:
    return (
        not lesson.has_subgroups
        and lesson.is_cancelled
        and (lesson.cancel_full or lesson.full.is_empty)
    )


def lesson_to_dict(lesson: Lesson, is_change: bool = False) -> dict[str, object]:
    if lesson.has_subgroups:
        s1_cancelled = is_change and lesson.cancel_sub1
        s2_cancelled = is_change and lesson.cancel_sub2

        if s1_cancelled:
            s1 = None
        else:
            s1 = lesson.sub1 if not lesson.sub1.is_empty else lesson.full

        if s2_cancelled:
            s2 = None
        else:
            s2 = lesson.sub2 if not lesson.sub2.is_empty else lesson.full

        return {
            "type": "subgroups",
            "sub1": _info_to_dict(s1) if (s1 is not None and not s1.is_empty) else None,
            "sub2": _info_to_dict(s2) if (s2 is not None and not s2.is_empty) else None,
            "sub1_cancelled": s1_cancelled,
            "sub2_cancelled": s2_cancelled,
            "sub1_changed": is_change and (s1 is not None and not s1.is_empty),
            "sub2_changed": is_change and (s2 is not None and not s2.is_empty),
            "is_change": is_change,
        }

    if _is_fully_cancelled_lesson(lesson):
        return {
            "type": "cancelled",
            "is_change": is_change,
        }

    return {
        "type": "single",
        **_info_to_dict(lesson.full),
        "is_change": is_change,
    }


def _merge_override(base_lesson: Lesson | None, override_lesson: Lesson) -> Lesson:
    if base_lesson is None:
        return override_lesson

    if not override_lesson.full.is_empty:
        return override_lesson

    if override_lesson.cancel_full:
        return Lesson(
            is_cancelled=True,
            cancel_full=True,
        )

    if (
        override_lesson.is_cancelled
        and not override_lesson.cancel_sub1
        and not override_lesson.cancel_sub2
        and override_lesson.full.is_empty
        and override_lesson.sub1.is_empty
        and override_lesson.sub2.is_empty
    ):
        return Lesson(
            is_cancelled=True,
            cancel_full=True,
        )

    merged = Lesson(
        full=replace(base_lesson.full),
        sub1=replace(base_lesson.sub1),
        sub2=replace(base_lesson.sub2),
        is_cancelled=False,
    )

    if override_lesson.cancel_sub1:
        merged.sub1 = SubgroupInfo()
        merged.cancel_sub1 = True
        merged.is_cancelled = True
    elif not override_lesson.sub1.is_empty:
        merged.sub1 = replace(override_lesson.sub1)

    if override_lesson.cancel_sub2:
        merged.sub2 = SubgroupInfo()
        merged.cancel_sub2 = True
        merged.is_cancelled = True
    elif not override_lesson.sub2.is_empty:
        merged.sub2 = replace(override_lesson.sub2)

    return merged


def iter_resolved_lessons(
    service: ScheduleService,
    group: str,
    day_key: int,
    overrides: dict[int, Lesson],
) -> list[tuple[int, Lesson, bool]]:
    base = service.schedules.get(group, {}).get(day_key, {})

    items: list[tuple[int, Lesson, bool]] = []
    for num in range(1, MAX_PAIRS + 1):
        if num in overrides:
            lesson = _merge_override(base.get(num), overrides[num])
            is_change = True
        elif num in base:
            lesson = base[num]
            is_change = False
        else:
            continue

        if _is_fully_cancelled_lesson(lesson):
            continue

        items.append((num, lesson, is_change))
    return items


def build_schedule(
    service: ScheduleService,
    group: str,
    day_key: int,
    overrides: dict[int, Lesson],
) -> list[dict[str, object]]:
    schedule = []
    for num, lesson, is_change in iter_resolved_lessons(
        service, group, day_key, overrides
    ):
        entry = lesson_to_dict(lesson, is_change=is_change)
        entry["number"] = num
        schedule.append(entry)
    return schedule


def _normalized_teacher_key(text: str) -> str:
    return re.sub(r"[^А-ЯЁA-Z0-9]", "", text.upper())


def _teacher_matches(actual_teacher: str, wanted_key: str) -> bool:
    if not actual_teacher:
        return False
    return wanted_key in _normalized_teacher_key(actual_teacher)


def _iter_lesson_infos(
    lesson: Lesson, is_change: bool
) -> Iterator[tuple[int | None, SubgroupInfo]]:
    if lesson.has_subgroups:
        s1_cancelled = is_change and lesson.cancel_sub1
        s2_cancelled = is_change and lesson.cancel_sub2

        if s1_cancelled:
            s1 = None
        else:
            s1 = lesson.sub1 if not lesson.sub1.is_empty else lesson.full

        if s2_cancelled:
            s2 = None
        else:
            s2 = lesson.sub2 if not lesson.sub2.is_empty else lesson.full

        if s1 is not None and not s1.is_empty:
            yield 1, s1
        if s2 is not None and not s2.is_empty:
            yield 2, s2
        return

    if _is_fully_cancelled_lesson(lesson):
        return
    if not lesson.full.is_empty:
        yield None, lesson.full


def _collect_teacher_names(service: ScheduleService) -> list[str]:
    teachers: set[str] = set()

    def _add_from_lesson(lesson: Lesson) -> None:
        for info in (lesson.full, lesson.sub1, lesson.sub2):
            if info.teacher and info.teacher.strip():
                teachers.add(info.teacher.strip())

    for days in service.schedules.values():
        for lessons in days.values():
            for lesson in lessons.values():
                _add_from_lesson(lesson)

    for date_key in service.get_non_archived_changes_dates():
        groups = service.get_changes_for_date(date_key)
        for lessons in groups.values():
            for lesson in lessons.values():
                _add_from_lesson(lesson)

    return sorted(teachers, key=lambda x: x.upper())


def _build_teacher_day_schedule(
    service: ScheduleService, teacher_query: str, target_dt: datetime
) -> dict[str, object]:
    teacher_key = _normalized_teacher_key(teacher_query)
    day_key = get_week_day_key(target_dt)
    date_key = target_dt.strftime("%Y-%m-%d")
    overrides_map = service.get_changes_for_date(date_key)
    all_groups = sorted(set(service.schedules.keys()) | set(overrides_map.keys()))

    lessons = []
    for group in all_groups:
        overrides = overrides_map.get(group, {})
        for num, lesson, is_change in iter_resolved_lessons(
            service, group, day_key, overrides
        ):
            for subgroup, info in _iter_lesson_infos(lesson, is_change):
                if _teacher_matches(info.teacher, teacher_key):
                    lessons.append(
                        {
                            "group": group,
                            "number": num,
                            "subject": info.subject,
                            "teacher": info.teacher,
                            "room": info.room,
                            "subgroup": subgroup,
                            "is_change": is_change,
                        }
                    )

    lessons.sort(key=lambda x: (x["number"], x["group"], x["subgroup"] or 0))
    return {
        "teacher_query": teacher_query,
        "date": date_key,
        "day_of_week": target_dt.isoweekday(),
        "has_data": day_key != -1,
        "lessons": lessons,
    }


@router.get(
    "/day/all", dependencies=[Depends(_safe_rate_limiter(times=50, seconds=60))]
)
async def get_day_schedule(
    date: str | None = None,
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}

    dt = _parse_iso_date(date)

    day_key = get_week_day_key(dt)
    date_key = dt.strftime("%Y-%m-%d")
    overrides_map = service.get_changes_for_date(date_key)
    all_groups = sorted(set(service.schedules.keys()) | set(overrides_map.keys()))

    result = []
    for group in all_groups:
        overrides = overrides_map.get(group, {})
        schedule = build_schedule(service, group, day_key, overrides)
        if schedule:
            result.append(
                {"group": group, "has_changes": bool(overrides), "schedule": schedule}
            )

    return {
        "date": date_key,
        "day_of_week": dt.isoweekday(),
        "groups": result,
        "has_data": day_key != -1,
    }


@router.get(
    "/info/dates", dependencies=[Depends(_safe_rate_limiter(times=10, seconds=60))]
)
async def get_available_dates(
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}
    return {"dates": service.get_changes_dates()}


@router.get(
    "/info/groups", dependencies=[Depends(_safe_rate_limiter(times=10, seconds=60))]
)
async def get_available_groups(
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}
    return {"groups": sorted(service.schedules.keys()), "total": len(service.schedules)}


@router.get(
    "/info/teachers", dependencies=[Depends(_safe_rate_limiter(times=10, seconds=60))]
)
async def get_available_teachers(
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}
    teachers = _collect_teacher_names(service)
    return {"teachers": teachers, "total": len(teachers)}


@router.get(
    "/info/status", dependencies=[Depends(_safe_rate_limiter(times=5, seconds=60))]
)
async def get_api_status(
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    return {
        "ready": service.is_ready,
        "groups_loaded": len(service.schedules),
        "changes_dates": service.get_changes_dates(),
        "last_pdf": int(service.last_pdf_update),
        "last_changes": int(service.last_chg_update),
        "consecutive_failures": service.consecutive_failures,
    }


@router.get(
    "/teacher/day/all", dependencies=[Depends(_safe_rate_limiter(times=30, seconds=60))]
)
async def get_teacher_day_schedule_all(
    date: str | None = None,
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}

    dt = _parse_iso_date(date)

    day_key = get_week_day_key(dt)
    date_key = dt.strftime("%Y-%m-%d")
    overrides_map = service.get_changes_for_date(date_key)
    all_groups = sorted(set(service.schedules.keys()) | set(overrides_map.keys()))

    teachers_map: dict[str, list[dict[str, object]]] = {}
    for group in all_groups:
        overrides = overrides_map.get(group, {})
        for num, lesson, is_change in iter_resolved_lessons(
            service, group, day_key, overrides
        ):
            for subgroup, info in _iter_lesson_infos(lesson, is_change):
                if not info.teacher:
                    continue

                teacher_name = info.teacher.strip()
                if not teacher_name:
                    continue

                teachers_map.setdefault(teacher_name, []).append(
                    {
                        "group": group,
                        "number": num,
                        "subject": info.subject,
                        "room": info.room,
                        "subgroup": subgroup,
                        "is_change": is_change,
                    }
                )

    teachers = []
    for teacher_name in sorted(teachers_map.keys(), key=lambda x: x.upper()):
        lessons = sorted(
            teachers_map[teacher_name],
            key=lambda x: (x["number"], x["group"], x["subgroup"] or 0),
        )
        teachers.append(
            {
                "teacher": teacher_name,
                "has_changes": any(item["is_change"] for item in lessons),
                "schedule": lessons,
            }
        )

    return {
        "date": date_key,
        "day_of_week": dt.isoweekday(),
        "teachers": teachers,
        "total": len(teachers),
        "has_data": day_key != -1,
    }


@router.get(
    "/teacher/{teacher_name}",
    dependencies=[Depends(_safe_rate_limiter(times=30, seconds=60))],
)
async def get_teacher_schedule(
    teacher_name: str,
    date: str | None = None,
    all_dates: bool = False,
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}

    teacher_query = teacher_name.strip()
    if not teacher_query:
        raise HTTPException(status_code=400, detail="Teacher name is required")

    if all_dates:
        dates = sorted(service.changes_by_date.keys())
        if not dates:
            dates = [datetime.now().date().isoformat()]

        by_date = []
        for d in dates:
            try:
                dt = datetime.fromisoformat(d)
            except ValueError:
                continue
            payload = _build_teacher_day_schedule(service, teacher_query, dt)
            if payload["lessons"]:
                by_date.append(payload)

        return {
            "teacher_query": teacher_query,
            "dates": [item["date"] for item in by_date],
            "items": by_date,
            "total_dates": len(by_date),
        }

    dt = _parse_iso_date(date)

    payload = _build_teacher_day_schedule(service, teacher_query, dt)
    payload["updated"] = {
        "pdf": int(service.last_pdf_update),
        "excel": int(service.last_chg_update),
    }
    return payload


@router.get(
    "/{group_name}", dependencies=[Depends(_safe_rate_limiter(times=10, seconds=60))]
)
async def get_group_schedule(
    group_name: str,
    date: str | None = None,
    service: ScheduleService = Depends(get_schedule_service),
) -> dict[str, object]:
    if not service.is_ready:
        return {"status": "loading"}

    dt = _parse_iso_date(date)

    target = clean_name(group_name)
    day_key = get_week_day_key(dt)
    date_key = dt.strftime("%Y-%m-%d")
    overrides = service.get_changes_for_date(date_key).get(target, {})

    return {
        "group": group_name,
        "date": date_key,
        "day_of_week": dt.isoweekday(),
        "pdf_found": target in service.schedules,
        "has_changes": bool(overrides),
        "schedule": build_schedule(service, target, day_key, overrides),
        "updated": {
            "pdf": int(service.last_pdf_update),
            "excel": int(service.last_chg_update),
        },
    }
