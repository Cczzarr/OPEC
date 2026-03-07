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
from datetime import datetime

from src.backend.config import SEMESTER_START


def parse_date_dmy(s: str) -> str | None:
    m = re.fullmatch(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", s.strip())
    if m:
        return f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}"
    return None


def get_week_day_key(dt: datetime) -> int:
    day = dt.isoweekday()
    if day == 7:
        return -1
    delta = (
        dt.replace(hour=0, minute=0, second=0, microsecond=0)
        - SEMESTER_START.replace(hour=0, minute=0, second=0, microsecond=0)
    ).days // 7
    return day if delta % 2 == 0 else day + 7
