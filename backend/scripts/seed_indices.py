"""
Seed market indices into the database.
Run: python scripts/seed_indices.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.stock import Stock

# Indian Market Indices
INDICES = [
    # Major Indices
    ("^NSEI", "NIFTY 50", "Index", "Broad Market", "NIFTY50"),
    ("^BSESN", "S&P BSE SENSEX", "Index", "Broad Market", "SENSEX"),
    ("^NSEBANK", "NIFTY BANK", "Index", "Banking", "BANKNIFTY"),
    ("^CNXIT", "NIFTY IT", "Index", "IT", "NIFTYIT"),
    ("^CNXAUTO", "NIFTY AUTO", "Index", "Automobile", "NIFTYAUTO"),
    ("^CNXPHARMA", "NIFTY PHARMA", "Index", "Pharma", "NIFTYPHARMA"),
    ("^CNXFMCG", "NIFTY FMCG", "Index", "FMCG", "NIFTYFMCG"),
    ("^CNXMETAL", "NIFTY METAL", "Index", "Metal", "NIFTYMETAL"),
    ("^CNXENERGY", "NIFTY ENERGY", "Index", "Energy", "NIFTYENERGY"),
    ("^CNXREALTY", "NIFTY REALTY", "Index", "Realty", "NIFTYREALTY"),
]


def seed_indices():
    """Insert indices into database."""
    db = SessionLocal()
    try:
        count = 0
        for symbol, name, sector, industry, isin in INDICES:
            existing = db.query(Stock).filter(Stock.symbol == symbol).first()
            if existing:
                print(f"SKIP: {symbol} already exists")
                continue
            
            stock = Stock(
                symbol=symbol,
                company_name=name,
                exchange="INDEX",
                sector=sector,
                industry=industry,
                isin=isin,
                is_active=True
            )
            db.add(stock)
            count += 1
            print(f"ADDED: {symbol} - {name}")
        
        db.commit()
        print(f"\nSUCCESS: Added {count} indices")
        print(f"Total stocks in DB: {db.query(Stock).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_indices()