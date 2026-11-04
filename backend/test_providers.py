"""
Test NSE, BSE, and Index data providers
Run: python test_providers.py
"""
from app.providers.yahoo_provider import YahooFinanceProvider

p = YahooFinanceProvider()

print("Testing NSE stocks:")
print("=" * 50)

tests = [
    ("NSE Stocks", ["RELIANCE", "TCS", "INFY", "HDFCBANK"]),
    ("BSE Stocks", ["RELIANCE.BO", "TCS.BO"]),
    ("Indices", ["^NSEI", "^BSESN", "^NSEBANK"]),
]

for category, symbols in tests:
    print(f"\n{category}:")
    for symbol in symbols:
        try:
            q = p.get_current_price(symbol)
            print(f"  {symbol:15s} -> Rs.{q.price:>10.2f}  ({q.change_pct:+.2f}%)")
        except Exception as e:
            print(f"  {symbol:15s} -> ERROR: {str(e)[:50]}")

print("\n" + "=" * 50)
print("Test complete!")