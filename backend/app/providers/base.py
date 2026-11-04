"""
MarketDataProvider interface.

The rest of the system must depend only on this interface, never on a
concrete provider, so data sources can be swapped without touching
agents, ML code, or the API layer.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
import pandas as pd


@dataclass
class Quote:
    symbol: str
    price: float
    previous_close: float
    volume: int

    @property
    def change_pct(self) -> float:
        if self.previous_close == 0:
            return 0.0
        return (self.price - self.previous_close) / self.previous_close * 100


class MarketDataProvider(ABC):
    """Abstract interface every market data source must implement."""

    @abstractmethod
    def get_current_price(self, symbol: str) -> Quote:
        ...

    @abstractmethod
    def get_historical_data(self, symbol: str, days: int = 500) -> pd.DataFrame:
        """
        Returns a DataFrame indexed by date with columns:
        ['open', 'high', 'low', 'close', 'volume']
        sorted ascending by date (oldest first). No shuffling — this is
        time-series data.
        """
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Whether this provider can currently be reached (used for fallback)."""
        ...
