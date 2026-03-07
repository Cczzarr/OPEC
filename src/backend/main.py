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
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from loguru import logger

from src.backend.api.v1.routers import api_router
from src.backend.config import (
    REDIS_URL,
    REFRESH_INTERVAL,
    RETRY_INTERVAL,
    setup_logging,
    API_HOST,
    API_PORT,
)
from src.backend.database.db import init_db
from src.backend.services.schedule_service import ScheduleService

setup_logging()


async def background_worker(app: FastAPI) -> None:
    logger.info("Background worker started")
    service: ScheduleService = app.state.schedule_service

    while True:
        chg_ok = await service.refresh_changes()

        if service.is_ready:
            logger.info("Schedule data is ready")

        if chg_ok:
            wait_time = REFRESH_INTERVAL
        else:
            wait_time = RETRY_INTERVAL
            logger.warning(f"Refreshes partially failed, retrying in {wait_time}s")

        await asyncio.sleep(wait_time)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.http_client = httpx.AsyncClient(
        verify=False,
        timeout=30,
        follow_redirects=True,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        },
    )

    try:
        app.state.redis = redis.from_url(
            REDIS_URL, encoding="utf-8", decode_responses=True
        )
        await FastAPILimiter.init(app.state.redis)
        logger.info("Redis connected, rate limiting enabled")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}. Rate limiting DISABLED.")
        app.state.redis = None

    init_db()

    app.state.schedule_service = ScheduleService(http_client=app.state.http_client)

    app.state.schedule_service.load_data_from_db()

    app.state.worker_task = asyncio.create_task(background_worker(app))

    yield

    if getattr(app.state, "worker_task", None):
        app.state.worker_task.cancel()
        try:
            await app.state.worker_task
        except asyncio.CancelledError:
            pass

    if getattr(app.state, "http_client", None):
        await app.state.http_client.aclose()

    redis_conn = getattr(app.state, "redis", None)
    if redis_conn is not None:
        await redis_conn.close()


app = FastAPI(title="Fast API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check() -> JSONResponse:
    return JSONResponse({"status": "ok"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.backend.main:app", host=API_HOST, port=API_PORT, reload=True)
