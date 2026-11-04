"""
Entrypoint. Run with:
    uvicorn app.main:app --reload --port 8000
"""
import sys
import logging
import warnings

# Ensure UTF-8 output on Windows consoles so emoji prints don't raise UnicodeEncodeError
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, test_connection
from app.api.routes import router as api_router
from app.routers import (
    auth,
    stocks,
    watchlist,
    portfolio,
    trading,
    chat,
    auto_trading,
    predictions,
    news,
    scheduled,
)
from app.agents.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="StockAI Pro - AI Trading Assistant",
    description=(
        "Educational / research project. Predictions are estimates, not guarantees. "
        "All trading is simulated (paper trading) - no real money or broker is involved."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    print("🚀 Starting Stock Trading System...")
    if not test_connection():
        print("⚠️ Database connection failed!")
    init_db()
    start_scheduler()
    print("✅ Database initialized!")


@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()
    print("👋 Scheduler stopped")


# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(watchlist.router, prefix="/api/watchlist", tags=["watchlist"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(trading.router, prefix="/api/trading", tags=["trading"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(auto_trading.router, prefix="/api/auto-trading", tags=["auto-trading"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(scheduled.router, prefix="/api/scheduled", tags=["scheduled"])


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "StockAI Pro API",
        "database": "SQLite / LocalDB",
        "disclaimer": "Paper trading only. Not financial advice.",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected" if test_connection() else "disconnected",
    }
