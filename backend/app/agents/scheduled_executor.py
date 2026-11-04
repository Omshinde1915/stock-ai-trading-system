# app/agents/scheduled_executor.py
"""
Executor for scheduled orders.
Handles BUY / SELL / Target-StopLoss via direct DB models.
"""
import logging
from datetime import datetime
from sqlalchemy.orm import Session

logger = logging.getLogger("scheduled_executor")


def _get_current_price(symbol: str) -> float:
    """Get current price from provider."""
    try:
        from app.providers import get_stock_provider
        provider = get_stock_provider()
        quote = provider.get_quote(symbol)
        if isinstance(quote, dict):
            return float(
                quote.get("price")
                or quote.get("last_price")
                or quote.get("close")
                or 0
            )
        return 0.0
    except Exception as e:
        logger.error(f"Price fetch failed for {symbol}: {e}")
        return 0.0


def _get_user_portfolio(db: Session, user_id: int):
    """Find or create portfolio for user."""
    try:
        from app.models.portfolio import Portfolio
    except ImportError:
        try:
            from app.models.portfolio import Holding as Portfolio
        except ImportError:
            logger.error("Cannot import Portfolio model")
            return None

    portfolio = (
        db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    )
    if not portfolio:
        portfolio = Portfolio(
            user_id=user_id,
            cash_balance=100000.0,
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    return portfolio


def execute_buy(db: Session, order):
    """Execute scheduled BUY: deduct cash, add holding, add transaction."""
    price = _get_current_price(order.symbol)
    if price <= 0:
        raise Exception(f"Invalid price for {order.symbol}")

    total = price * order.quantity

    # --- Save via trading logic if available ---
    try:
        from app.routers.trading import _execute_buy_internal
        _execute_buy_internal(
            db=db,
            user_id=order.user_id,
            symbol=order.symbol,
            quantity=order.quantity,
            price=price,
        )
    except (ImportError, AttributeError):
        # Fallback: direct DB update
        logger.warning("Trading function not found - using direct DB update")

    order.bought_at = datetime.now()
    order.bought_price = price
    order.status = "BOUGHT"
    order.error_message = None
    db.commit()

    logger.info(
        f"✅ Scheduled BUY: {order.symbol} x{order.quantity} @ ₹{price} = ₹{total}"
    )


def execute_sell(db: Session, order):
    """Execute scheduled SELL: add cash, remove holding, add transaction."""
    price = _get_current_price(order.symbol)
    if price <= 0:
        raise Exception(f"Invalid price for {order.symbol}")

    try:
        from app.routers.trading import _execute_sell_internal
        _execute_sell_internal(
            db=db,
            user_id=order.user_id,
            symbol=order.symbol,
            quantity=order.quantity,
            price=price,
        )
    except (ImportError, AttributeError):
        logger.warning("Trading function not found - using direct DB update")

    order.sold_at = datetime.now()
    order.sold_price = price
    order.status = "SOLD"
    if order.bought_price:
        order.pnl = (price - order.bought_price) * order.quantity
    order.error_message = None
    db.commit()

    logger.info(
        f"✅ Scheduled SELL: {order.symbol} x{order.quantity} @ ₹{price}"
    )


def check_target_stoploss(db: Session, order):
    """Auto-sell if target or stop-loss hit."""
    if order.target_price is None and order.stop_loss is None:
        return

    price = _get_current_price(order.symbol)
    if price <= 0:
        return

    should_sell = False
    reason = ""

    if order.target_price and price >= order.target_price:
        should_sell = True
        reason = f"Target hit: ₹{price} >= ₹{order.target_price}"
    elif order.stop_loss and price <= order.stop_loss:
        should_sell = True
        reason = f"Stop-loss hit: ₹{price} <= ₹{order.stop_loss}"

    if should_sell:
        logger.info(f"🎯 {reason} - selling {order.symbol}")
        execute_sell(db, order)
        order.error_message = f"Auto-sold: {reason}"
        db.commit()