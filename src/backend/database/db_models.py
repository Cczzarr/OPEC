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

from datetime import datetime, date
from typing import Optional

from sqlmodel import Field, SQLModel


class ChangesSnapshot(SQLModel, table=True):

    __tablename__ = "changes_snapshot"

    id: Optional[int] = Field(default=None, primary_key=True)
    schedule_date: date = Field(index=True, unique=True)
    saved_at: datetime = Field(default_factory=datetime.utcnow)
    hash_sha256: Optional[str] = Field(default=None)
    data: str
