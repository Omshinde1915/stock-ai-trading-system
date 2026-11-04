"""
Watchlist router - Manage user's watchlist.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.models.user import User
from app.models.stock import Stock
from app.models.watchlist import Watchlist

from app.database import get_db
from app.models.user import User
from app.models.stock import Stock
from app.models.watchlist import Watchlist
from app.routers.auth import get_current_user

router = APIRouter()

# Schemas
class WatchlistCreate(BaseModel):
    symbol: str

class WatchlistResponse(BaseModel):
    id: int
    symbol: str
    company_name: str
    sector: str
    added_at: datetime

    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[WatchlistResponse])
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    watchlist_items = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).all()
    
    result = []
    for item in watchlist_items:
        stock = db.query(Stock).filter(Stock.id == item.stock_id).first()
        if stock:
            result.append({
                "id": item.id,
                "symbol": stock.symbol,
                "company_name": stock.company_name,
                "sector": stock.sector,
                "added_at": item.created_at
            })
    
    return result

@router.post("/")
def add_to_watchlist(
    watchlist_data: WatchlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find stock
    stock = db.query(Stock).filter(Stock.symbol == watchlist_data.symbol.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Check if already in watchlist
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.stock_id == stock.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Stock already in watchlist")
    
    # Add to watchlist
    watchlist_item = Watchlist(
        user_id=current_user.id,
        stock_id=stock.id
    )
    
    try:
        db.add(watchlist_item)
        db.commit()
        db.refresh(watchlist_item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not add to watchlist: {str(e)}")
    
    return {
        "id": watchlist_item.id,
        "symbol": stock.symbol,
        "company_name": stock.company_name,
        "added_at": watchlist_item.created_at
    }

@router.delete("/{item_id}")
def remove_from_watchlist(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find watchlist item
    watchlist_item = db.query(Watchlist).filter(
        Watchlist.id == item_id,
        Watchlist.user_id == current_user.id
    ).first()
    
    if not watchlist_item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    
    try:
        db.delete(watchlist_item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not remove from watchlist: {str(e)}")
    
    return {"message": "Removed from watchlist"}