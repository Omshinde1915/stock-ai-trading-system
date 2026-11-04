# app/models/scheduled_order.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base


class ScheduledOrder(Base):
    __tablename__ = "scheduled_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)

    symbol = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)

    buy_date = Column(DateTime, nullable=False)
    buy_time = Column(String(10), nullable=False)

    sell_date = Column(DateTime, nullable=False)
    sell_time = Column(String(10), nullable=False)

    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)

    status = Column(String(20), default="PENDING_BUY", index=True)

    bought_at = Column(DateTime, nullable=True)
    bought_price = Column(Float, nullable=True)
    sold_at = Column(DateTime, nullable=True)
    sold_price = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)
    error_message = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)