# app/schemas/scheduled_order.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScheduledOrderCreate(BaseModel):
    symbol: str
    quantity: int
    buy_date: str      # "2026-10-15"
    buy_time: str      # "09:30"
    sell_date: str     # "2026-10-22"
    sell_time: str     # "14:30"
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None


class ScheduledOrderResponse(BaseModel):
    id: int
    symbol: str
    quantity: int
    buy_date: datetime
    buy_time: str
    sell_date: datetime
    sell_time: str
    target_price: Optional[float]
    stop_loss: Optional[float]
    status: str
    bought_at: Optional[datetime]
    bought_price: Optional[float]
    sold_at: Optional[datetime]
    sold_price: Optional[float]
    pnl: Optional[float]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True