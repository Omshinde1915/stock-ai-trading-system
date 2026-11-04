"""Agent activity logs and configuration models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AgentLog(Base):
    """Every action the auto-trading agent takes."""
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    action = Column(String(20))
    symbol = Column(String(20), nullable=True)
    quantity = Column(Integer, nullable=True)
    price = Column(Numeric(12, 2), nullable=True)
    total_amount = Column(Numeric(15, 2), nullable=True)
    
    # P&L tracking
    pnl = Column(Numeric(15, 2), nullable=True)           # P&L for this specific trade
    pnl_pct = Column(Numeric(8, 2), nullable=True)         # P&L percentage
    
    confidence = Column(Numeric(5, 2), nullable=True)
    reason = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentConfig(Base):
    """User-specific agent configuration."""
    __tablename__ = "agent_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    is_running = Column(Boolean, default=False)
    is_enabled = Column(Boolean, default=False)
    
    min_confidence = Column(Numeric(5, 2), default=65.0)
    min_opportunity_score = Column(Numeric(5, 2), default=50.0)
    max_trades_per_cycle = Column(Integer, default=3)
    max_position_pct = Column(Numeric(5, 4), default=0.10)
    max_daily_trades = Column(Integer, default=20)
    
    max_daily_loss_pct = Column(Numeric(5, 4), default=0.03)
    stop_trading_on_loss = Column(Boolean, default=True)
    allow_short_selling = Column(Boolean, default=False)
    
    interval_minutes = Column(Integer, default=15)
    market_hours_only = Column(Boolean, default=True)
    
    last_run_at = Column(DateTime, nullable=True)
    today_trades_count = Column(Integer, default=0)
    today_pnl = Column(Numeric(15, 2), default=0)
    total_trades = Column(Integer, default=0)
    total_pnl = Column(Numeric(15, 2), default=0)
    
    # Agent-specific P&L
    total_invested = Column(Numeric(15, 2), default=0)     # Total money invested by agent
    total_realized_pnl = Column(Numeric(15, 2), default=0)  # Realized P&L from sells
    winning_trades = Column(Integer, default=0)
    losing_trades = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)