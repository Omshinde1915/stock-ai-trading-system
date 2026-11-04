"""
YahooFinanceProvider - Real market data via yfinance.
Supports both NSE (.NS) and BSE (.BO) exchanges.
"""
import pandas as pd
from .base import MarketDataProvider, Quote


class YahooFinanceProvider(MarketDataProvider):
    def __init__(self):
        try:
            import yfinance as yf
            self._yf = yf
            self._ok = True
        except ImportError:
            self._yf = None
            self._ok = False

    def is_available(self) -> bool:
        return self._ok

    def _get_ticker_symbols(self, symbol: str) -> list:
        """Try NSE first, then BSE"""
        if symbol.startswith('^'):
            return [symbol]
        if '.' in symbol:
            return [symbol]
        return [f"{symbol}.NS", f"{symbol}.BO", symbol]

    def get_historical_data(self, symbol: str, days: int = 500) -> pd.DataFrame:
        if not self._ok:
            raise RuntimeError("yfinance not installed")
        
        period = "2y" if days > 365 else f"{min(days, 365)}d"
        
        for ticker_symbol in self._get_ticker_symbols(symbol):
            try:
                ticker = self._yf.Ticker(ticker_symbol)
                hist = ticker.history(period=period, interval="1d")
                
                if not hist.empty:
                    hist = hist.rename(
                        columns={"Open": "open", "High": "high", "Low": "low",
                                 "Close": "close", "Volume": "volume"}
                    )[["open", "high", "low", "close", "volume"]]
                    hist.index.name = "date"
                    return hist.sort_index()
            except Exception:
                continue
        
        raise RuntimeError(f"No data found for {symbol} on NSE or BSE")

    def get_current_price(self, symbol: str) -> Quote:
        df = self.get_historical_data(symbol, days=5)
        price = float(df["close"].iloc[-1])
        prev_close = float(df["close"].iloc[-2]) if len(df) > 1 else price
        volume = int(df["volume"].iloc[-1])
        return Quote(
            symbol=symbol,
            price=price,
            previous_close=prev_close,
            volume=volume
        )