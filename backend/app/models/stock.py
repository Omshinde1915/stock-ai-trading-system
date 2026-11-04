"""Stock and price models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Numeric, BigInteger, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    company_name = Column(String(255))
    exchange = Column(String(10), default="NSE")
    sector = Column(String(100))
    industry = Column(String(100))
    isin = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    prices = relationship("StockPrice", back_populates="stock")
    predictions = relationship("Prediction", back_populates="stock")
    news = relationship("NewsArticle", back_populates="stock")


class StockPrice(Base):
    __tablename__ = "stock_prices"
    __table_args__ = (
        UniqueConstraint("stock_id", "date", name="uq_stock_date"),
        Index("ix_stock_prices_stock_date", "stock_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    date = Column(Date, nullable=False)
    open = Column(Numeric(12, 2))
    high = Column(Numeric(12, 2))
    low = Column(Numeric(12, 2))
    close = Column(Numeric(12, 2))
    adjusted_close = Column(Numeric(12, 2))
    volume = Column(BigInteger)

    # Relationships
    stock = relationship("Stock", back_populates="prices")