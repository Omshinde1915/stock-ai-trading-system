"""
Auto-Trading API - Control and monitor the AI trading agent.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.agent_log import AgentLog, AgentConfig
from app.agents.auto_trading_agent import auto_trading_agent
from app.routers.auth import get_current_user

router = APIRouter()


# ============ SCHEMAS ============
class AgentConfigSchema(BaseModel):
    min_confidence: float = Field(65.0, ge=0, le=100)
    min_opportunity_score: float = Field(50.0, ge=0, le=100)
    max_trades_per_cycle: int = Field(3, ge=1, le=10)
    max_position_pct: float = Field(0.10, ge=0.01, le=0.50)
    max_daily_trades: int = Field(20, ge=1, le=100)
    max_daily_loss_pct: float = Field(0.03, ge=0.005, le=0.20)
    stop_trading_on_loss: bool = True
    interval_minutes: int = Field(15, ge=5, le=120)
    market_hours_only: bool = True


class RunCycleRequest(BaseModel):
    symbols: Optional[List[str]] = None
    force: bool = False  # Force run even during market closed (testing)

# ============ STATUS ============
@router.get("/status")
def get_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current agent status & config."""
    config = auto_trading_agent.get_or_create_config(db, current_user.id)

    # Get last 5 logs
    recent_logs = db.query(AgentLog).filter(
        AgentLog.user_id == current_user.id
    ).order_by(AgentLog.created_at.desc()).limit(5).all()

    return {
        "is_running": config.is_running,
        "is_enabled": config.is_enabled,
        "kill_switch": auto_trading_agent.kill_switch_engaged,
        "config": {
            "min_confidence": float(config.min_confidence),
            "min_opportunity_score": float(config.min_opportunity_score),
            "max_trades_per_cycle": config.max_trades_per_cycle,
            "max_position_pct": float(config.max_position_pct),
            "max_daily_trades": config.max_daily_trades,
            "max_daily_loss_pct": float(config.max_daily_loss_pct),
            "stop_trading_on_loss": config.stop_trading_on_loss,
            "interval_minutes": config.interval_minutes,
            "market_hours_only": config.market_hours_only,
        },
        "stats": {
            "last_run_at": config.last_run_at.isoformat() if config.last_run_at else None,
            "today_trades_count": config.today_trades_count,
            "total_trades": config.total_trades,
            "today_pnl": float(config.today_pnl or 0),
            "total_pnl": float(config.total_pnl or 0),
        },
        "recent_activity": [
            {
                "action": log.action,
                "symbol": log.symbol,
                "reason": log.reason,
                "success": log.success,
                "created_at": log.created_at.isoformat(),
            }
            for log in recent_logs
        ],
    }


# ============ CONFIGURE ============
@router.post("/configure")
def configure_agent(
    config_data: AgentConfigSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update agent configuration."""
    config = auto_trading_agent.get_or_create_config(db, current_user.id)

    config.min_confidence = config_data.min_confidence
    config.min_opportunity_score = config_data.min_opportunity_score
    config.max_trades_per_cycle = config_data.max_trades_per_cycle
    config.max_position_pct = config_data.max_position_pct
    config.max_daily_trades = config_data.max_daily_trades
    config.max_daily_loss_pct = config_data.max_daily_loss_pct
    config.stop_trading_on_loss = config_data.stop_trading_on_loss
    config.interval_minutes = config_data.interval_minutes
    config.market_hours_only = config_data.market_hours_only

    db.commit()

    auto_trading_agent._log(db, current_user.id, "CONFIG_UPDATED",
                            reason="Configuration changed",
                            details=config_data.dict())

    return {"status": "configured", "config": config_data.dict()}


# ============ START / STOP ============
@router.post("/start")
def start_agent(
    current_user: User = Depends(get_current_user),
):
    """Start the auto-trading agent."""
    if auto_trading_agent.kill_switch_engaged:
        raise HTTPException(
            status_code=400,
            detail="Kill switch is engaged. Reset it first."
        )

    result = auto_trading_agent.start(current_user.id)
    return result


@router.post("/stop")
def stop_agent(
    current_user: User = Depends(get_current_user),
):
    """Stop the auto-trading agent gracefully."""
    result = auto_trading_agent.stop(current_user.id)
    return result


@router.post("/emergency-stop")
def emergency_stop(
    current_user: User = Depends(get_current_user),
):
    """🚨 KILL SWITCH - Stop ALL agents immediately."""
    result = auto_trading_agent.emergency_stop()
    return result


@router.post("/reset-kill-switch")
def reset_kill_switch(
    current_user: User = Depends(get_current_user),
):
    """Reset kill switch (requires explicit call)."""
    result = auto_trading_agent.reset_kill_switch(current_user.id)
    return result


# ============ MANUAL RUN ============
@router.post("/run-cycle")
def run_cycle(
    request: RunCycleRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger one trading cycle.
    Set force=True to test outside market hours.
    """
    result = auto_trading_agent.run_cycle(
        user_id=current_user.id,
        symbols=request.symbols,
        force=request.force,
    )
    return result

# ============ LOGS ============
@router.get("/logs")
def get_logs(
    limit: int = 100,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get agent activity logs."""
    query = db.query(AgentLog).filter(AgentLog.user_id == current_user.id)

    if action:
        query = query.filter(AgentLog.action == action.upper())

    logs = query.order_by(AgentLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "symbol": log.symbol,
            "quantity": log.quantity,
            "price": float(log.price) if log.price else None,
            "total_amount": float(log.total_amount) if log.total_amount else None,
            "confidence": float(log.confidence) if log.confidence else None,
            "reason": log.reason,
            "success": log.success,
            "error_message": log.error_message,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get agent performance statistics."""
    config = auto_trading_agent.get_or_create_config(db, current_user.id)

    # Count actions by type
    logs = db.query(AgentLog).filter(
        AgentLog.user_id == current_user.id
    ).all()

    buy_count = sum(1 for l in logs if l.action == "BUY")
    sell_count = sum(1 for l in logs if l.action == "SELL")
    error_count = sum(1 for l in logs if l.action == "ERROR")
    rejected_count = sum(1 for l in logs if l.action == "REJECTED")

    return {
        "total_trades": config.total_trades,
        "today_trades": config.today_trades_count,
        "total_pnl": float(config.total_pnl or 0),
        "today_pnl": float(config.today_pnl or 0),
        "buy_count": buy_count,
        "sell_count": sell_count,
        "error_count": error_count,
        "rejected_count": rejected_count,
        "last_run": config.last_run_at.isoformat() if config.last_run_at else None,
    }