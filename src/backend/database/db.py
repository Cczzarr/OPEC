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
from pathlib import Path

from sqlmodel import SQLModel, create_engine, Session
from loguru import logger


_PROJECT_ROOT = Path(__file__).resolve().parents[3]
_DB_PATH = os.environ.get("DB_PATH", str(_PROJECT_ROOT / "opec.db"))

DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    from src.backend.database import db_models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    logger.info(f"Database initialised at {_DB_PATH}")


def get_session() -> Session:
    return Session(engine)
