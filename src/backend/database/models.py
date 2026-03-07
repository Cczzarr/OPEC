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

from dataclasses import dataclass, field


@dataclass
class SubgroupInfo:
    subject: str = ""
    teacher: str = ""
    room: str = ""

    @property
    def is_empty(self) -> bool:
        return not self.subject and not self.teacher and not self.room

    def __str__(self) -> str:
        parts = [p for p in [self.subject, self.teacher, self.room] if p]
        return " | ".join(parts) if parts else ""


@dataclass
class Lesson:
    full: SubgroupInfo = field(default_factory=SubgroupInfo)
    sub1: SubgroupInfo = field(default_factory=SubgroupInfo)
    sub2: SubgroupInfo = field(default_factory=SubgroupInfo)
    is_cancelled: bool = False
    cancel_full: bool = False
    cancel_sub1: bool = False
    cancel_sub2: bool = False

    @property
    def has_subgroups(self) -> bool:
        return not self.sub1.is_empty or not self.sub2.is_empty

    @property
    def is_empty(self) -> bool:
        return self.full.is_empty and self.sub1.is_empty and self.sub2.is_empty
