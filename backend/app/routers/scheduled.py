# app/routers/scheduled.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.scheduled_order import ScheduledOrder
from app.schemas.scheduled_order import (
    ScheduledOrderCreate,
    ScheduledOrderResponse,
)
from app.routers.auth import get_current_user

router = APIRouter()


def _parse_datetime(date_str: str, time_str: str) -> datetime:
    try:
        dt_str = f"{date_str} {time_str}"
        return datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date/time: {date_str} {time_str}. Use YYYY-MM-DD and HH:MM",
        )


@router.post("/", response_model=ScheduledOrderResponse)
def create_scheduled_order(
    payload: ScheduledOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    buy_dt = _parse_datetime(payload.buy_date, payload.buy_time)
    sell_dt = _parse_datetime(payload.sell_date, payload.sell_time)

    now = datetime.now()
    if buy_dt < now:
        raise HTTPException(
            status_code=400, detail="Buy time cannot be in the past"
        )
    if sell_dt <= buy_dt:
        raise HTTPException(
            status_code=400, detail="Sell time must be after buy time"
        )
    if payload.quantity < 1:
        raise HTTPException(
            status_code=400, detail="Quantity must be at least 1"
        )

    order = ScheduledOrder(
        user_id=current_user.id,
        symbol=payload.symbol.upper(),
        quantity=payload.quantity,
        buy_date=buy_dt,
        buy_time=payload.buy_time,
        sell_date=sell_dt,
        sell_time=payload.sell_time,
        target_price=payload.target_price,
        stop_loss=payload.stop_loss,
        status="PENDING_BUY",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=List[ScheduledOrderResponse])
def list_scheduled_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(ScheduledOrder)
        .filter(ScheduledOrder.user_id == current_user.id)
        .order_by(ScheduledOrder.created_at.desc())
        .all()
    )


@router.delete("/{order_id}")
def cancel_scheduled_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = (
        db.query(ScheduledOrder)
        .filter(
            ScheduledOrder.id == order_id,
            ScheduledOrder.user_id == current_user.id,
        )
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "PENDING_BUY":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order in status {order.status}",
        )

    order.status = "CANCELLED"
    db.commit()
    return {"message": "Order cancelled", "id": order_id}