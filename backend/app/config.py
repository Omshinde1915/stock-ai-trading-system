"""
Central configuration for the Stock AI Trading System.
"""
from pydantic import BaseModel
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Config(BaseModel):
    # --- Database ---
    use_sqlite: bool = os.getenv("USE_SQLITE", "true").lower() == "true"
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./stock_trading.db"
    )

    # --- JWT Authentication ---
    jwt_secret: str = os.getenv("JWT_SECRET", "stockai-default-jwt-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # --- Capital ---
    starting_cash: float = 1_000_000.0  # ₹10,00,000 default virtual balance

    # --- Signal thresholds ---
    buy_threshold: float = 0.015
    sell_threshold: float = -0.015

    # --- Ensemble weights ---
    weight_ml: float = 0.45
    weight_technical: float = 0.25
    weight_market_trend: float = 0.20
    weight_risk: float = 0.10

    # --- Risk management ---
    risk_per_trade_pct: float = 0.01
    max_position_pct: float = 0.20
    max_portfolio_exposure_pct: float = 0.80
    max_open_positions: int = 10
    max_daily_loss_pct: float = 0.03
    stop_loss_pct: float = 0.03
    take_profit_pct: float = 0.06

    # --- Simulated execution costs ---
    brokerage_pct: float = 0.0005
    slippage_pct: float = 0.0005
    tax_pct: float = 0.0010

    # --- ML ---
    prediction_horizon_days: int = 5
    min_history_days: int = 250

    # --- Chatbot ---
    chatbot_model: str = "gemini-pro"  # or "gpt-3.5-turbo", "huggingface"
    chatbot_api_key: str = os.getenv("CHATBOT_API_KEY", "")


settings = Config()
