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

import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# Network
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# URLs
CHANGES_PAGE_URL = os.getenv(
    "CHANGES_PAGE_URL",
    "https://www.ompec.ru/student/uchebnaya-deyatelnost/izmeneniya-v-raspisanii.php",
)

# Intervals & Limits
REFRESH_INTERVAL = int(os.getenv("REFRESH_INTERVAL", 1800))
RETRY_INTERVAL = int(os.getenv("RETRY_INTERVAL", 60))
MAX_PAIRS = 6

# Storage
DATA_DIR = Path(os.getenv("DATA_DIR", "src/backend/data"))
STATIC_SCHEDULE_PATH = DATA_DIR / "static_schedule.json"

# Date format
SEMESTER_START_STR = os.getenv("SEMESTER_START", "2026-01-12")
SEMESTER_START = datetime.strptime(SEMESTER_START_STR, "%Y-%m-%d")

# Database & Redis
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./database.db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_ROTATION = os.getenv("LOG_ROTATION", "10 MB")
LOG_RETENTION = os.getenv("LOG_RETENTION", "10 days")


def setup_logging() -> None:
    logger.remove()
    logger.add(sys.stderr, level=LOG_LEVEL)
    logger.add(
        "logs/opec_{time}.log",
        rotation=LOG_ROTATION,
        retention=LOG_RETENTION,
        level=LOG_LEVEL,
        enqueue=True,
    )
