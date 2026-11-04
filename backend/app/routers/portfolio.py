"""
Portfolio router - View portfolio, holdings, P&L.
Handles NaN values safely.
"""
import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.stock import Stock
from app.models.portfolio import PaperAccount, Holding, Transaction
from app.routers.auth import get_current_user

router = APIRouter()


def safe_float(value, default=0.0):
    """Convert to float safely, handling NaN/Inf."""
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 2)
    except (TypeError, ValueError):
        return default


def get_current_price(symbol: str) -> float:
    """Get current price safely."""
    try:
        from app.agents.supervisor import StockTradingSupervisor
        supervisor = StockTradingSupervisor()
        quote = supervisor.market_data_agent.get_quote(symbol)
        price = safe_float(quote.price, 0.0)
        if price <= 0 or math.isnan(price):
            return 0.0
        return price
    except Exception as e:
        print(f"Error getting price for {symbol}: {e}")
        return 0.0


@router.get("/")
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio summary."""
    
    # Get or create paper account
    account = db.query(PaperAccount).filter(
        PaperAccount.user_id == current_user.id
    ).first()
    
    if not account:
        account = PaperAccount(
            user_id=current_user.id,
            virtual_balance=1000000.00
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    
    # Get holdings
    holdings = db.query(Holding).filter(
        Holding.user_id == current_user.id,
        Holding.quantity > 0
    ).all()
    
    total_holdings_value = 0.0
    total_investment = 0.0
    holdings_data = []
    
    for holding in holdings:
        stock = db.query(Stock).filter(Stock.id == holding.stock_id).first()
        if not stock:
            continue
        
        current_price = get_current_price(stock.symbol)
        avg_price = safe_float(holding.average_price, 0.0)
        
        # Fallback if price fetch fails
        if current_price <= 0:
            current_price = avg_price
        
        qty = int(holding.quantity)
        
        current_value = current_price * qty
        investment = avg_price * qty
        pnl = current_value - investment
        pnl_pct = (pnl / investment * 100) if investment > 0 else 0
        
        total_holdings_value += current_value
        total_investment += investment
        
        holdings_data.append({
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "quantity": qty,
            "average_price": safe_float(avg_price),
            "current_price": safe_float(current_price),
            "current_value": safe_float(current_value),
            "pnl": safe_float(pnl),
            "pnl_pct": safe_float(pnl_pct),
        })
    
    cash_balance = safe_float(account.virtual_balance, 0.0)
    total_value = cash_balance + total_holdings_value
    starting_balance = 1000000.00
    total_pnl = total_value - starting_balance
    total_pnl_pct = (total_pnl / starting_balance * 100) if starting_balance > 0 else 0
    
    return {
        "total_value": safe_float(total_value),
        "cash_balance": safe_float(cash_balance),
        "total_investment": safe_float(total_investment),
        "total_pnl": safe_float(total_pnl),
        "total_pnl_pct": safe_float(total_pnl_pct),
        "holdings_count": len(holdings_data),
        "holdings": holdings_data,
    }


@router.get("/transactions")
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history."""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc()).limit(100).all()
    
    result = []
    for t in transactions:
        stock = db.query(Stock).filter(Stock.id == t.stock_id).first()
        result.append({
            "id": t.id,
            "symbol": stock.symbol if stock else "UNKNOWN",
            "type": t.transaction_type,
            "quantity": int(t.quantity),
            "price": safe_float(t.price),
            "total_amount": safe_float(t.total_amount),
            "date": str(t.transaction_date),
        })
    
    return result