"""User model for authentication."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    watchlist = relationship("Watchlist", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    paper_account = relationship("PaperAccount", back_populates="user", uselist=False)
    holdings = relationship("Holding", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")