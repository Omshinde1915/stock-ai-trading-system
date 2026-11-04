# Import all models to ensure relationships are properly registered
from app.models.user import User
from app.models.stock import Stock, StockPrice
from app.models.watchlist import Watchlist
from app.models.portfolio import PaperAccount, Holding, Transaction
from app.models.prediction import Prediction
from app.models.chat import ChatSession, ChatMessage
from app.models.news import NewsArticle

# Re-export all models
__all__ = [
    'User',
    'Stock',
    'StockPrice',
    'Watchlist',
    'PaperAccount',
    'Holding',
    'Transaction',
    'Prediction',
    'ChatSession',
    'ChatMessage',
    'NewsArticle',
]

# app/routers/__init__.py
# This file makes the routers directory a Python package