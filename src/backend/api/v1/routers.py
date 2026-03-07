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

from fastapi import APIRouter

from src.backend.api.v1.endpoints import schedule

api_router = APIRouter()
api_router.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
