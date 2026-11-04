"""
Reusable technical-indicator / feature-engineering module.
Every function takes a DataFrame with columns ['open','high','low','close','volume']
sorted ascending by date, and returns a Series or adds columns -- never mutates
row order, never shuffles (this is time-series data).
"""
import numpy as np
import pandas as pd


def sma(close: pd.Series, window: int) -> pd.Series:
    return close.rolling(window).mean()


def ema(close: pd.Series, span: int) -> pd.Series:
    return close.ewm(span=span, adjust=False).mean()


def rsi(close: pd.Series, window: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window).mean()
    avg_loss = loss.rolling(window).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = ema(close, fast)
    ema_slow = ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def bollinger_bands(close: pd.Series, window: int = 20, num_std: float = 2.0):
    mid = sma(close, window)
    std = close.rolling(window).std()
    upper = mid + num_std * std
    lower = mid - num_std * std
    return upper, mid, lower


def atr(df: pd.DataFrame, window: int = 14) -> pd.Series:
    high, low, close = df["high"], df["low"], df["close"]
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr.rolling(window).mean()


def roc(close: pd.Series, window: int = 10) -> pd.Series:
    return (close / close.shift(window) - 1) * 100


def obv(df: pd.DataFrame) -> pd.Series:
    direction = np.sign(df["close"].diff()).fillna(0)
    return (direction * df["volume"]).cumsum()


def stochastic_oscillator(df: pd.DataFrame, window: int = 14):
    low_min = df["low"].rolling(window).min()
    high_max = df["high"].rolling(window).max()
    k = 100 * (df["close"] - low_min) / (high_max - low_min).replace(0, np.nan)
    d = k.rolling(3).mean()
    return k, d


def build_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds the full feature set used by the ML pipeline and the
    TechnicalAnalysisAgent onto a copy of the OHLCV frame.
    """
    out = df.copy()
    out["daily_return"] = out["close"].pct_change()
    out["log_return"] = np.log(out["close"]).diff()

    for w in (5, 10, 20, 50, 100, 200):
        out[f"sma_{w}"] = sma(out["close"], w)
    for w in (9, 20, 50):
        out[f"ema_{w}"] = ema(out["close"], w)

    out["rsi_14"] = rsi(out["close"])
    macd_line, signal_line, hist = macd(out["close"])
    out["macd"] = macd_line
    out["macd_signal"] = signal_line
    out["macd_hist"] = hist

    upper, mid, lower = bollinger_bands(out["close"])
    out["bb_upper"] = upper
    out["bb_mid"] = mid
    out["bb_lower"] = lower

    out["atr_14"] = atr(out)
    out["roc_10"] = roc(out["close"])
    out["obv"] = obv(out)
    k, d = stochastic_oscillator(out)
    out["stoch_k"] = k
    out["stoch_d"] = d
    out["volatility_20"] = out["daily_return"].rolling(20).std()

    return out
