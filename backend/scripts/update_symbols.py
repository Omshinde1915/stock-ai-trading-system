"""
Update stock symbols that have been renamed on NSE.
Run: python scripts/update_symbols.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.stock import Stock

# Symbol renames on NSE
RENAMES = {
    "ZOMATO": "ETERNAL",       # Zomato → Eternal Ltd (2024)
    "IDEA": "IDEA",             # No change
    "PERSISTENT": "PERSISTENT",
    "NYKAA": "NYKAA",
}

# Stocks to remove (delisted/renamed)
REMOVE_SYMBOLS = ["SPICEJET", "GMRINFRA"]  # Often have issues


def update_symbols():
    db = SessionLocal()
    try:
        # Update renamed symbols
        for old_symbol, new_symbol in RENAMES.items():
            if old_symbol == new_symbol:
                continue
            
            stock = db.query(Stock).filter(Stock.symbol == old_symbol).first()
            if stock:
                existing = db.query(Stock).filter(Stock.symbol == new_symbol).first()
                if existing:
                    print(f"SKIP: {new_symbol} already exists, deleting {old_symbol}")
                    db.delete(stock)
                else:
                    stock.symbol = new_symbol
                    print(f"RENAMED: {old_symbol} → {new_symbol}")
        
        # Remove problematic symbols
        for symbol in REMOVE_SYMBOLS:
            stock = db.query(Stock).filter(Stock.symbol == symbol).first()
            if stock:
                db.delete(stock)
                print(f"REMOVED: {symbol}")
        
        db.commit()
        print(f"\n✅ Done! Total stocks: {db.query(Stock).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    update_symbols()