"""
Stock router - Search, view, analyze stocks.
Handles NaN/Inf values safely.
"""
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.stock import Stock, StockPrice

router = APIRouter()


# ============ HELPERS ============
def safe_float(value, default=0.0):
    """Convert to float safely, handling NaN/Inf values."""
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 2)
    except (TypeError, ValueError):
        return default


def safe_int(value, default=0):
    """Convert to int safely, handling NaN/Inf."""
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return default
        return int(f)
    except (TypeError, ValueError):
        return default


def sanitize_dict(d):
    """Recursively convert NaN/Inf to 0 inside dicts and lists."""
    if isinstance(d, dict):
        return {k: sanitize_dict(v) for k, v in d.items()}
    if isinstance(d, list):
        return [sanitize_dict(i) for i in d]
    if isinstance(d, float):
        if math.isnan(d) or math.isinf(d):
            return 0
        return d
    return d


# ============ SCHEMAS ============
class StockResponse(BaseModel):
    id: int
    symbol: str
    company_name: str
    sector: Optional[str]
    industry: Optional[str]
    exchange: str

    class Config:
        from_attributes = True


# ============ SPECIFIC ROUTES FIRST ============

@router.get("/market/indices")
def get_market_indices(db: Session = Depends(get_db)):
    """Get all market indices with current prices."""
    indices = db.query(Stock).filter(Stock.exchange == "INDEX").all()

    from app.providers.factory import get_provider
    provider = get_provider()

    result = []
    for idx in indices:
        try:
            quote = provider.get_current_price(idx.symbol)
            price = safe_float(quote.price, 0.0)
            prev_close = safe_float(quote.previous_close, 0.0)

            if price <= 0 or prev_close <= 0:
                result.append({
                    "symbol": idx.symbol,
                    "name": idx.company_name,
                    "price": 0,
                    "previous_close": 0,
                    "change": 0,
                    "change_pct": 0,
                    "error": "Price unavailable"
                })
                continue

            change = price - prev_close
            change_pct = (change / prev_close * 100) if prev_close > 0 else 0

            result.append({
                "symbol": idx.symbol,
                "name": idx.company_name,
                "price": safe_float(price),
                "previous_close": safe_float(prev_close),
                "change": safe_float(change),
                "change_pct": safe_float(change_pct),
            })
        except Exception as e:
            result.append({
                "symbol": idx.symbol,
                "name": idx.company_name,
                "price": 0,
                "previous_close": 0,
                "change": 0,
                "change_pct": 0,
                "error": str(e)[:50]
            })

    return result


@router.get("/market/movers")
def get_market_movers(db: Session = Depends(get_db)):
    """Get top gainers and losers from a sample of stocks."""
    stocks = db.query(Stock).filter(
        Stock.exchange == "NSE",
        Stock.is_active == True
    ).limit(30).all()

    from app.providers.factory import get_provider
    provider = get_provider()

    movers = []
    for stock in stocks:
        try:
            quote = provider.get_current_price(stock.symbol)
            price = safe_float(quote.price, 0.0)
            prev_close = safe_float(quote.previous_close, 0.0)

            if price <= 0 or prev_close <= 0:
                continue

            change = price - prev_close
            change_pct = (change / prev_close * 100) if prev_close > 0 else 0

            if math.isnan(change_pct) or math.isinf(change_pct):
                continue

            movers.append({
                "symbol": stock.symbol,
                "company_name": stock.company_name,
                "price": safe_float(price),
                "change": safe_float(change),
                "change_pct": safe_float(change_pct),
                "volume": safe_int(quote.volume, 0),
            })
        except Exception as e:
            print(f"Error fetching {stock.symbol}: {e}")
            continue

    movers.sort(key=lambda x: x["change_pct"], reverse=True)

    gainers = movers[:5]
    losers = movers[-5:][::-1] if len(movers) >= 5 else []

    return {
        "gainers": gainers,
        "losers": losers,
    }


@router.get("/search")
def search_stocks(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Search stocks by symbol or name."""
    query = db.query(Stock).filter(
        (Stock.symbol.contains(q.upper())) |
        (Stock.company_name.contains(q))
    ).limit(20).all()

    return [
        {
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "sector": stock.sector
        }
        for stock in query
    ]


@router.get("/", response_model=List[StockResponse])
def list_stocks(
    db: Session = Depends(get_db),
    sector: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 5000
):
    """Get all active stocks from database."""
    query = db.query(Stock).filter(Stock.is_active == True)

    if sector:
        query = query.filter(Stock.sector == sector)

    if search:
        query = query.filter(
            (Stock.symbol.contains(search.upper())) |
            (Stock.company_name.contains(search))
        )

    stocks = query.limit(limit).all()
    return stocks


# ============ ANALYZE ROUTE (MUST be before /{symbol}) ============

@router.get("/analyze/{symbol}")
def analyze_stock(symbol: str):
    """Get full AI analysis for a stock."""
    try:
        from app.agents.supervisor import StockTradingSupervisor
        supervisor = StockTradingSupervisor()
        analysis = supervisor.analyze(symbol)

        return {
            "symbol": analysis.get("symbol", symbol),
            "company_name": analysis.get("company_name", symbol),
            "current_price": safe_float(analysis.get("current_price", 0)),
            "change_pct": safe_float(analysis.get("change_pct", 0)),
            "decision": analysis.get("decision", "HOLD"),
            "opportunity_score": safe_float(
                analysis.get("opportunity_score", 0)
            ),
            "confidence": safe_float(analysis.get("confidence", 0)),
            "risk_level": analysis.get("risk_level", "MEDIUM"),
            "reasons": analysis.get("reasons", []),
            "entry": safe_float(analysis.get("entry", 0)),
            "stop_loss": safe_float(analysis.get("stop_loss", 0)),
            "target": safe_float(analysis.get("target", 0)),
            "position_size": safe_int(analysis.get("position_size", 0)),
            "risk_check": sanitize_dict(analysis.get("risk_check", {})),
            "prediction": sanitize_dict(analysis.get("prediction", {})),
            "technical": sanitize_dict(analysis.get("technical", {})),
        }
    except Exception as e:
        print(f"❌ Analyze error for {symbol}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


# ============ INFO ROUTE ============

@router.get("/{symbol}/info")
def get_stock_info(symbol: str):
    """Get detailed company information using yfinance."""
    try:
        import yfinance as yf

        ticker = yf.Ticker(f"{symbol.upper()}.NS")
        info = ticker.info

        if not info or info.get("regularMarketPrice") is None:
            ticker = yf.Ticker(f"{symbol.upper()}.BO")
            info = ticker.info

        if not info:
            return {"error": "Stock not found"}

        return {
            "symbol": symbol.upper(),
            "company_name": info.get("longName") or info.get("shortName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "country": info.get("country"),
            "website": info.get("website"),
            "description": info.get("longBusinessSummary"),
            "employees": info.get("fullTimeEmployees"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "ps_ratio": info.get("priceToSalesTrailing12Months"),
            "eps": info.get("trailingEps"),
            "book_value": info.get("bookValue"),
            "dividend_yield": info.get("dividendYield"),
            "revenue": info.get("totalRevenue"),
            "profit_margin": info.get("profitMargins"),
            "operating_margin": info.get("operatingMargins"),
            "roe": info.get("returnOnEquity"),
            "roa": info.get("returnOnAssets"),
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "open": info.get("regularMarketOpen"),
            "day_high": info.get("regularMarketDayHigh"),
            "day_low": info.get("regularMarketDayLow"),
            "prev_close": info.get("regularMarketPreviousClose"),
            "volume": info.get("regularMarketVolume"),
            "avg_volume": info.get("averageVolume"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "day_50_avg": info.get("fiftyDayAverage"),
            "day_200_avg": info.get("twoHundredDayAverage"),
            "beta": info.get("beta"),
        }

    except Exception as e:
        print(f"❌ Failed to fetch info for {symbol}: {e}")
        return {"error": str(e)}


# ============ DYNAMIC ROUTES LAST ============

@router.get("/{symbol}", response_model=StockResponse)
def get_stock_by_symbol(symbol: str, db: Session = Depends(get_db)):
    """Get stock by symbol."""
    stock = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@router.get("/{symbol}/history")
def get_stock_price_history(
    symbol: str,
    days: int = Query(180, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get historical price data for a stock."""
    stock = db.query(Stock).filter(Stock.symbol == symbol.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    prices = db.query(StockPrice).filter(
        StockPrice.stock_id == stock.id
    ).order_by(StockPrice.date.desc()).limit(days).all()

    if prices:
        result = []
        for p in reversed(prices):
            result.append({
                "date": str(p.date),
                "open": safe_float(p.open),
                "high": safe_float(p.high),
                "low": safe_float(p.low),
                "close": safe_float(p.close),
                "volume": safe_int(p.volume, 0),
            })
        return result

    try:
        from app.agents.supervisor import StockTradingSupervisor
        supervisor = StockTradingSupervisor()
        df = supervisor.market_data_agent.get_history(symbol, days=days)

        result = []
        for idx, row in df.iterrows():
            result.append({
                "date": str(idx.date()),
                "open": safe_float(row.open),
                "high": safe_float(row.high),
                "low": safe_float(row.low),
                "close": safe_float(row.close),
                "volume": safe_int(row.volume, 0),
            })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch data: {str(e)}"
        )