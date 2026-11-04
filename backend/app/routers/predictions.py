"""
Prediction History router.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.stock import Stock
from app.models.prediction import Prediction
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/history")
def get_prediction_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get prediction history for the current user."""
    # Get all predictions (since predictions aren't user-specific in current schema,
    # we return all with stock info)
    predictions = db.query(Prediction).order_by(
        Prediction.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for pred in predictions:
        stock = db.query(Stock).filter(Stock.id == pred.stock_id).first()
        if not stock:
            continue
        
        result.append({
            "id": pred.id,
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "predicted_price": float(pred.predicted_price) if pred.predicted_price else 0,
            "actual_price": float(pred.actual_price) if pred.actual_price else None,
            "signal": pred.signal,
            "confidence_score": float(pred.confidence_score) if pred.confidence_score else 0,
            "risk_level": pred.risk_level,
            "prediction_date": str(pred.prediction_date) if pred.prediction_date else None,
            "created_at": str(pred.created_at),
            "model_name": pred.model_name,
        })
    
    return result


@router.get("/stats")
def get_prediction_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get prediction statistics."""
    predictions = db.query(Prediction).all()
    
    total = len(predictions)
    buy_count = sum(1 for p in predictions if p.signal == "BUY")
    sell_count = sum(1 for p in predictions if p.signal == "SELL")
    hold_count = sum(1 for p in predictions if p.signal == "HOLD")
    
    confidences = [float(p.confidence_score) for p in predictions if p.confidence_score]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    return {
        "total_predictions": total,
        "buy_signals": buy_count,
        "sell_signals": sell_count,
        "hold_signals": hold_count,
        "avg_confidence": round(avg_confidence, 1),
    }