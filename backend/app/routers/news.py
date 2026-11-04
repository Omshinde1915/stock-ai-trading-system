# backend/app/routers/news.py

from fastapi import APIRouter
from typing import Optional
from news_data import NEWS_DATA

router = APIRouter()


@router.get("/")
def get_news(symbol: Optional[str] = None, limit: int = 20):
    """
    Get market news.
    If symbol provided, filter news for that specific stock.
    """
    if symbol:
        symbol = symbol.upper()
        filtered = [
            n for n in NEWS_DATA
            if symbol in [s.upper() for s in n.get("symbols", [])]
        ]
        return filtered[:limit]
    return NEWS_DATA[:limit]