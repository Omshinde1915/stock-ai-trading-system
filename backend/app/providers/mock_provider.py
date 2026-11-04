"""
MockMarketDataProvider

Generates deterministic, realistic-looking OHLCV data for any symbol using
a seeded random walk. This is what powers Demo Mode: the whole system must
run end-to-end even with zero external API keys.
"""
import hashlib
import numpy as np
import pandas as pd

from .base import MarketDataProvider, Quote


class MockMarketDataProvider(MarketDataProvider):
    def is_available(self) -> bool:
        return True

    def _seed_for(self, symbol: str) -> int:
        return int(hashlib.md5(symbol.encode()).hexdigest(), 16) % (2**32)

    def get_historical_data(self, symbol: str, days: int = 500) -> pd.DataFrame:
        rng = np.random.default_rng(self._seed_for(symbol))

        # pandas bdate_range with `periods=N` can return N-1 entries in some
        # versions/edge cases -- build the date index first and size every
        # array off its actual length so they always line up.
        dates = pd.bdate_range(end=pd.Timestamp.today().normalize(), periods=days)
        n = len(dates)

        base_price = 100 + (self._seed_for(symbol) % 4000) / 10  # spread symbols out
        drift = rng.normal(0.0004, 0.0002)   # slight per-symbol upward/downward bias
        vol = rng.uniform(0.012, 0.028)      # daily volatility

        daily_returns = rng.normal(drift, vol, size=n)
        close = base_price * np.exp(np.cumsum(daily_returns))

        # Build OHLC around the close with plausible intraday range
        high = close * (1 + np.abs(rng.normal(0.004, 0.003, size=n)))
        low = close * (1 - np.abs(rng.normal(0.004, 0.003, size=n)))
        open_ = low + (high - low) * rng.uniform(0.2, 0.8, size=n)
        volume = rng.integers(200_000, 5_000_000, size=n)

        df = pd.DataFrame(
            {
                "open": open_,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
            },
            index=dates,
        )
        df.index.name = "date"
        return df

    def get_current_price(self, symbol: str) -> Quote:
        df = self.get_historical_data(symbol, days=5)
        price = float(df["close"].iloc[-1])
        prev_close = float(df["close"].iloc[-2])
        volume = int(df["volume"].iloc[-1])
        return Quote(symbol=symbol, price=price, previous_close=prev_close, volume=volume)
