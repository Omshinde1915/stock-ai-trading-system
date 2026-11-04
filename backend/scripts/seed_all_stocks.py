"""
Seed ALL NSE stocks from EQUITY_L.csv into database.
Only inserts metadata (symbol, name, sector). Prices are fetched on-demand.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import csv
from app.database import SessionLocal, init_db
from app.models.stock import Stock

CSV_FILE = os.path.join(os.path.dirname(__file__), '..', 'nse_equity_list.csv')

def guess_sector(name: str) -> str:
    """Rough sector guess from company name."""
    name_lower = name.lower()
    sectors = {
        'Bank': ['bank', 'banking'],
        'IT': ['technolog', 'software', 'infotech', 'consultanc', 'comput'],
        'Pharma': ['pharma', 'healthcare', 'drugs', 'medic', 'hospital'],
        'Auto': ['motor', 'auto', 'vehicle', 'tyre'],
        'FMCG': ['consumer', 'foods', 'beverages', 'fmcg', 'dairy'],
        'Energy': ['oil', 'gas', 'petroleum', 'power', 'energy', 'coal'],
        'Finance': ['finance', 'financial', 'capital', 'invest', 'securit', 'nbfc'],
        'Metal': ['steel', 'metal', 'aluminium', 'copper', 'zinc', 'iron'],
        'Cement': ['cement'],
        'Telecom': ['telecom', 'communication', 'wireless'],
        'Real Estate': ['realty', 'real estate', 'propert', 'construction'],
        'Insurance': ['insurance', 'insur'],
        'Chemicals': ['chem', 'paint', 'fertiliz'],
        'Textile': ['textile', 'cotton', 'yarn', 'fabric', 'apparel'],
    }
    for sector, keywords in sectors.items():
        if any(kw in name_lower for kw in keywords):
            return sector
    return 'Others'


def main():
    if not os.path.exists(CSV_FILE):
        print(f"❌ CSV file not found: {CSV_FILE}")
        print("   Download EQUITY_L.csv from NSE first.")
        return
    
    init_db()
    db = SessionLocal()
    
    added = 0
    skipped = 0
    errors = 0
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Strip whitespace from headers
        reader.fieldnames = [h.strip() for h in reader.fieldnames]
        
        for row in reader:
            try:
                # Handle various column name formats
                symbol = (row.get('SYMBOL') or row.get('Symbol') or '').strip()
                name = (row.get('NAME OF COMPANY') or row.get('Name of Company') or '').strip()
                series = (row.get(' SERIES') or row.get('SERIES') or 'EQ').strip()
                isin = (row.get(' ISIN NUMBER') or row.get('ISIN NUMBER') or '').strip()
                
                if not symbol or not name:
                    continue
                
                # Only EQ series (equity)
                if series != 'EQ':
                    continue
                
                # Skip if already exists
                existing = db.query(Stock).filter(Stock.symbol == symbol).first()
                if existing:
                    skipped += 1
                    continue
                
                stock = Stock(
                    symbol=symbol,
                    company_name=name[:255],
                    sector=guess_sector(name),
                    exchange='NSE',
                    isin=isin[:20] if isin else None,
                    is_active=True,
                )
                db.add(stock)
                added += 1
                
                if added % 100 == 0:
                    db.commit()
                    print(f"  ✅ Added {added} stocks...")
                    
            except Exception as e:
                errors += 1
                print(f"  ⚠️  Error for {row.get('SYMBOL', '?')}: {e}")
                continue
    
    db.commit()
    total = db.query(Stock).count()
    db.close()
    
    print()
    print(f"🎉 Done!")
    print(f"   ✅ Added:   {added}")
    print(f"   ⏭️  Skipped: {skipped} (already existed)")
    print(f"   ⚠️  Errors:  {errors}")
    print(f"   📊 Total stocks in database: {total}")


if __name__ == '__main__':
    main()