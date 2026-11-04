"""MarketDataAgent: the only agent allowed to touch the data provider layer."""
import math
import logging
import pandas as pd
from ..providers.factory import get_provider
from ..config import settings

logger = logging.getLogger("market_data_agent")


class MarketDataAgent:
    def __init__(self):
        self.provider = get_provider()

    def get_history(self, symbol: str, days: int = None) -> pd.DataFrame:
        return self.provider.get_historical_data(
            symbol, days or settings.min_history_days + 60
        )

    def get_quote(self, symbol: str):
        """
        Get quote from provider.
        If price is invalid (0, NaN, None), fall back to last close from history.
        """
        quote = self.provider.get_current_price(symbol)

        # Check if price is invalid
        price_invalid = (
            quote.price is None
            or (isinstance(quote.price, float) and math.isnan(quote.price))
            or (isinstance(quote.price, float) and math.isinf(quote.price))
            or quote.price <= 0
        )

        if price_invalid:
            logger.warning(
                f"Invalid price for {symbol} ({quote.price}), using history fallback"
            )
            try:
                df = self.get_history(symbol, days=10)

                if df is None or len(df) == 0:
                    logger.error(f"No history for {symbol}")
                    return quote

                last_close = float(df["close"].iloc[-1])

                if math.isnan(last_close) or math.isinf(last_close) or last_close <= 0:
                    logger.error(f"Last close invalid for {symbol}: {last_close}")
                    return quote

                prev_close = (
                    float(df["close"].iloc[-2])
                    if len(df) > 1
                    else last_close
                )

                if math.isnan(prev_close) or math.isinf(prev_close):
                    prev_close = last_close

                volume = 0
                if "volume" in df.columns:
                    try:
                        volume = int(df["volume"].iloc[-1])
                        if math.isnan(volume) or math.isinf(volume):
                            volume = 0
                    except (ValueError, TypeError):
                        volume = 0

                quote.price = last_close
                quote.previous_close = prev_close
                quote.volume = volume

                logger.info(
                    f"Fixed quote for {symbol}: price={last_close}, prev={prev_close}"
                )

            except Exception as e:
                logger.exception(f"Failed to fix quote for {symbol}: {e}")

        return quote