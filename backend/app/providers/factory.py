"""
Provider factory: tries a real provider first, transparently falls back to
MockMarketDataProvider on any failure. Nothing downstream needs to know
which provider actually served the data.
"""
import logging
from .base import MarketDataProvider
from .yahoo_provider import YahooFinanceProvider
from .mock_provider import MockMarketDataProvider

logger = logging.getLogger("providers")

_mock = MockMarketDataProvider()
_yahoo = YahooFinanceProvider()


class FallbackMarketDataProvider(MarketDataProvider):
    """Wraps a preferred provider and falls back to mock on any error."""

    def __init__(self, preferred: MarketDataProvider, fallback: MarketDataProvider):
        self.preferred = preferred
        self.fallback = fallback

    def is_available(self) -> bool:
        return True  # fallback guarantees availability

    def get_current_price(self, symbol: str):
        if self.preferred.is_available():
            try:
                return self.preferred.get_current_price(symbol)
            except Exception as e:
                logger.warning("Preferred provider failed for %s (%s); using mock", symbol, e)
        return self.fallback.get_current_price(symbol)

    def get_historical_data(self, symbol: str, days: int = 500):
        if self.preferred.is_available():
            try:
                return self.preferred.get_historical_data(symbol, days)
            except Exception as e:
                logger.warning("Preferred provider failed for %s (%s); using mock", symbol, e)
        return self.fallback.get_historical_data(symbol, days)


def get_provider() -> MarketDataProvider:
    """Single entry point the rest of the app should use."""
    return FallbackMarketDataProvider(preferred=_yahoo, fallback=_mock)
