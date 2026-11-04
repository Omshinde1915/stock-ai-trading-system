"""News & sentiment model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False)
    title = Column(Text)
    description = Column(Text)
    source = Column(String(100))
    url = Column(Text)
    published_at = Column(DateTime)
    sentiment = Column(String(10))  # POSITIVE / NEUTRAL / NEGATIVE
    sentiment_score = Column(Numeric(5, 2))

    # Relationships
    stock = relationship("Stock", back_populates="news")