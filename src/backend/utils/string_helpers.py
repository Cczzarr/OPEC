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
from typing import Any


def clean_name(text: Any) -> str:
    if text is None:
        return ""
    return re.sub(r"[^А-ЯЁA-Z0-9\-]", "", str(text).upper().strip())


def normalize_name(text: Any) -> str:
    if text is None:
        return ""
    return re.sub(r"[^А-ЯЁA-Z0-9]", "", str(text).upper())


def cell_text(cell: Any) -> str:
    if not cell:
        return ""
    return re.sub(r"\s+", " ", str(cell).strip())


def is_group_name(text: str) -> bool:
    c = normalize_name(text)
    return (
        2 <= len(c) <= 12
        and bool(re.search(r"[А-ЯЁA-Z]", c))
        and bool(re.search(r"[0-9]", c))
    )
