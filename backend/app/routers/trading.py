"""
Trading router - Paper trading buy/sell.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.stock import Stock
from app.models.portfolio import PaperAccount, Holding, Transaction
from app.routers.auth import get_current_user

router = APIRouter()


class TradeRequest(BaseModel):
    symbol: str
    quantity: int


def get_current_price(symbol: str) -> float:
    try:
        from app.agents.supervisor import StockTradingSupervisor
        supervisor = StockTradingSupervisor()
        quote = supervisor.market_data_agent.get_quote(symbol)
        return float(quote.price)
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        return 0.0


@router.post("/buy")
def buy_stock(
    trade: TradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find stock
    stock = db.query(Stock).filter(Stock.symbol == trade.symbol.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Get current price
    current_price = get_current_price(stock.symbol)
    if current_price <= 0:
        raise HTTPException(status_code=400, detail="Could not fetch current price")
    
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
    
    # Calculate total cost
    total_cost = current_price * trade.quantity
    account_balance = float(account.virtual_balance)
    
    # Check sufficient balance
    if total_cost > account_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Need Rs.{total_cost:.2f} but have Rs.{account_balance:.2f}"
        )
    
    # Update account balance
    account.virtual_balance = account_balance - total_cost
    
    # Update or create holding
    holding = db.query(Holding).filter(
        Holding.user_id == current_user.id,
        Holding.stock_id == stock.id
    ).first()
    
    if holding:
        # Convert to float to avoid Decimal + float error
        existing_avg = float(holding.average_price) if holding.average_price else 0.0
        existing_qty = int(holding.quantity)
        new_quantity = existing_qty + trade.quantity
        new_avg_price = ((existing_avg * existing_qty) + total_cost) / new_quantity
        holding.quantity = new_quantity
        holding.average_price = new_avg_price
    else:
        holding = Holding(
            user_id=current_user.id,
            stock_id=stock.id,
            quantity=trade.quantity,
            average_price=current_price
        )
        db.add(holding)
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        stock_id=stock.id,
        transaction_type="BUY",
        quantity=trade.quantity,
        price=current_price,
        total_amount=total_cost
    )
    db.add(transaction)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not execute trade: {str(e)}")
    
    return {
        "status": "success",
        "message": f"Bought {trade.quantity} shares of {stock.symbol} at Rs.{current_price:.2f}",
        "trade_details": {
            "symbol": stock.symbol,
            "quantity": trade.quantity,
            "price": current_price,
            "total_cost": round(total_cost, 2),
            "remaining_balance": round(float(account.virtual_balance), 2)
        }
    }


@router.post("/sell")
def sell_stock(
    trade: TradeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find stock
    stock = db.query(Stock).filter(Stock.symbol == trade.symbol.upper()).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Get current price
    current_price = get_current_price(stock.symbol)
    if current_price <= 0:
        raise HTTPException(status_code=400, detail="Could not fetch current price")
    
    # Find holding
    holding = db.query(Holding).filter(
        Holding.user_id == current_user.id,
        Holding.stock_id == stock.id
    ).first()
    
    if not holding or holding.quantity < trade.quantity:
        available = holding.quantity if holding else 0
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient holdings. You have {available} shares"
        )
    
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
    
    # Calculate total proceeds
    total_proceeds = current_price * trade.quantity
    
    # Update account balance (convert Decimal to float)
    account.virtual_balance = float(account.virtual_balance) + total_proceeds
    
    # Update holding
    holding.quantity = int(holding.quantity) - trade.quantity
    if holding.quantity <= 0:
        db.delete(holding)
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        stock_id=stock.id,
        transaction_type="SELL",
        quantity=trade.quantity,
        price=current_price,
        total_amount=total_proceeds
    )
    db.add(transaction)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not execute trade: {str(e)}")
    
    return {
        "status": "success",
        "message": f"Sold {trade.quantity} shares of {stock.symbol} at Rs.{current_price:.2f}",
        "trade_details": {
            "symbol": stock.symbol,
            "quantity": trade.quantity,
            "price": current_price,
            "total_proceeds": round(total_proceeds, 2),
            "remaining_balance": round(float(account.virtual_balance), 2)
        }
    }