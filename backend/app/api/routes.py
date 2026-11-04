"""
REST API layer.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.stock import Stock

from app.agents.supervisor import StockTradingSupervisor
from app.database import get_db
from app.models.stock import Stock
from sqlalchemy.orm import Session

router = APIRouter()

# Single in-memory supervisor
supervisor = StockTradingSupervisor()

DEFAULT_UNIVERSE = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "LT"]

class ScanRequest(BaseModel):
    symbols: list[str] = DEFAULT_UNIVERSE

class TradeRequest(BaseModel):
    symbol: str
    quantity: int

# Unique function names
@router.get("/stocks/all")
def get_all_stocks(db: Session = Depends(get_db)):
    """Get all active stocks from database."""
    stocks = db.query(Stock).filter(Stock.is_active == True).all()
    return [
        {
            "id": stock.id,
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "sector": stock.sector,
            "exchange": stock.exchange
        }
        for stock in stocks
    ]

@router.get("/stocks/detail/{symbol}")
def get_stock_detail(symbol: str, db: Session = Depends(get_db)):
    """Get stock by symbol."""
    try:
        stock = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")
        return {
            "id": stock.id,
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "sector": stock.sector,
            "exchange": stock.exchange
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stocks/history/{symbol}")
def get_stock_data_history(symbol: str, days: int = 180):
    """Get historical data for a stock."""
    try:
        df = supervisor.market_data_agent.get_history(symbol, days=days)
        records = [
            {
                "date": str(idx.date()),
                "open": round(float(row.open), 2),
                "high": round(float(row.high), 2),
                "low": round(float(row.low), 2),
                "close": round(float(row.close), 2),
                "volume": int(row.volume)
            }
            for idx, row in df.iterrows()
        ]
        return {"symbol": symbol, "history": records}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stocks/analyze/{symbol}")
def get_stock_ai_analysis(symbol: str):
    """Get full AI analysis for a stock."""
    try:
        return supervisor.analyze(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/agent/scan")
def agent_scan_stocks(req: ScanRequest):
    """Scan a universe of stocks."""
    try:
        return {"ranked": supervisor.scan(req.symbols)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/agent/analyze")
def agent_analyze_stock(symbol: str):
    """Analyze a specific stock."""
    try:
        return supervisor.analyze(symbol)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
def health_check():
    """Health check."""
    return {"status": "healthy"}