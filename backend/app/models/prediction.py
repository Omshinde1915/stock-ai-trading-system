"""Prediction history model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    model_name = Column(String(50))
    prediction_date = Column(Date)
    predicted_price = Column(Numeric(12, 2))
    actual_price = Column(Numeric(12, 2))
    signal = Column(String(10))  # BUY / SELL / HOLD
    confidence_score = Column(Numeric(5, 2))
    risk_level = Column(String(10))  # LOW / MEDIUM / HIGH
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="predictions")