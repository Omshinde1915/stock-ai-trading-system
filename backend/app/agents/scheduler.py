"""
Scheduler - Runs auto-trading during market hours.
Also checks scheduled orders every minute.
"""
import logging
from datetime import datetime, time as dtime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal
from app.models.agent_log import AgentConfig
from app.agents.auto_trading_agent import auto_trading_agent

logger = logging.getLogger("scheduler")

scheduler = BackgroundScheduler()

IST = timezone(timedelta(hours=5, minutes=30))
MARKET_OPEN = dtime(9, 15)
MARKET_CLOSE = dtime(15, 30)


def is_market_hours() -> bool:
    now_ist = datetime.now(IST)
    if now_ist.weekday() >= 5:
        return False
    return MARKET_OPEN <= now_ist.time() <= MARKET_CLOSE


def run_agent_for_all_users():
    if not is_market_hours():
        logger.debug("⏰ Market closed - skipping cycle")
        return

    db = SessionLocal()
    try:
        configs = (
            db.query(AgentConfig)
            .filter(AgentConfig.is_running == True)
            .all()
        )
        if not configs:
            return

        logger.info(f"🔄 Auto-trading cycle for {len(configs)} user(s)")

        for config in configs:
            try:
                result = auto_trading_agent.run_cycle(config.user_id)
                logger.info(
                    f"User {config.user_id}: {result.get('status')} - "
                    f"{result.get('trades_executed', 0)} trades"
                )
            except Exception as e:
                logger.exception(f"Error for user {config.user_id}: {e}")
    finally:
        db.close()


def check_and_stop_on_market_close():
    if is_market_hours():
        return

    try:
        stopped_count = auto_trading_agent.auto_stop_all_for_market_close()
        if stopped_count > 0:
            logger.info(
                f"🔔 Market closed - auto-stopped {stopped_count} agent(s)"
            )
    except Exception as e:
        logger.exception(f"Error auto-stopping agents: {e}")


# ============================================================
# SCHEDULED ORDERS CHECKER
# ============================================================

def check_scheduled_orders():
    """Runs every minute during market hours."""
    if not is_market_hours():
        return

    db = SessionLocal()
    try:
        from app.models.scheduled_order import ScheduledOrder
        from app.agents.scheduled_executor import (
            execute_buy,
            execute_sell,
            check_target_stoploss,
        )

        now_ist = datetime.now(IST).replace(tzinfo=None)
        window_start = now_ist - timedelta(minutes=5)

        # PENDING BUYS
        pending_buys = (
            db.query(ScheduledOrder)
            .filter(
                ScheduledOrder.status == "PENDING_BUY",
                ScheduledOrder.buy_date <= now_ist,
                ScheduledOrder.buy_date >= window_start,
            )
            .all()
        )

        for order in pending_buys:
            logger.info(f"⏰ Executing scheduled BUY: {order.symbol}")
            try:
                execute_buy(db, order)
            except Exception as e:
                logger.exception(f"BUY failed: {e}")
                order.status = "FAILED"
                order.error_message = str(e)[:500]
                db.commit()

        # BOUGHT orders that need SELL
        bought_orders = (
            db.query(ScheduledOrder)
            .filter(
                ScheduledOrder.status == "BOUGHT",
                ScheduledOrder.sell_date <= now_ist,
                ScheduledOrder.sell_date >= window_start,
            )
            .all()
        )

        for order in bought_orders:
            logger.info(f"⏰ Executing scheduled SELL: {order.symbol}")
            try:
                execute_sell(db, order)
            except Exception as e:
                logger.exception(f"SELL failed: {e}")
                order.error_message = str(e)[:500]
                db.commit()

        # TARGET / STOP-LOSS check
        active = (
            db.query(ScheduledOrder)
            .filter(ScheduledOrder.status == "BOUGHT")
            .all()
        )
        for order in active:
            try:
                check_target_stoploss(db, order)
            except Exception as e:
                logger.exception(f"Target/SL check failed: {e}")

    except Exception as e:
        logger.exception(f"check_scheduled_orders error: {e}")
    finally:
        db.close()


# ============================================================
# START / STOP
# ============================================================

def start_scheduler():
    if scheduler.running:
        logger.info("Scheduler already running")
        return

    scheduler.add_job(
        run_agent_for_all_users,
        trigger=IntervalTrigger(minutes=5),
        id="auto_trading_cycle",
        name="Auto-Trading Cycle",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.add_job(
        check_and_stop_on_market_close,
        trigger=IntervalTrigger(minutes=2),
        id="market_close_check",
        name="Market Close Auto-Stop",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.add_job(
        check_scheduled_orders,
        trigger=IntervalTrigger(minutes=1),
        id="scheduled_orders_check",
        name="Scheduled Orders Check",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()
    logger.info(
        "✅ Scheduler started - "
        "auto-trading every 5 min, scheduled orders every 1 min"
    )


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")