"""TechnicalAnalysisAgent: converts raw indicators into a bounded score + human-readable reasons."""
import pandas as pd
from ..indicators.technical import build_feature_frame


class TechnicalAnalysisAgent:
    def analyze(self, df: pd.DataFrame) -> dict:
        feat = build_feature_frame(df)
        latest = feat.iloc[-1]
        reasons = []
        score = 0.0  # -1 (strong sell) .. +1 (strong buy)

        if latest["close"] > latest["sma_50"]:
            score += 0.25
            reasons.append("Price above 50-day SMA")
        else:
            score -= 0.25
            reasons.append("Price below 50-day SMA")

        if latest["rsi_14"] < 30:
            score += 0.2
            reasons.append("RSI indicates oversold (potential bounce)")
        elif latest["rsi_14"] > 70:
            score -= 0.2
            reasons.append("RSI indicates overbought")
        else:
            reasons.append("RSI in neutral range")

        if latest["macd"] > latest["macd_signal"]:
            score += 0.25
            reasons.append("MACD bullish crossover")
        else:
            score -= 0.25
            reasons.append("MACD bearish crossover")

        if latest["close"] < latest["bb_lower"]:
            score += 0.15
            reasons.append("Price near/below lower Bollinger Band")
        elif latest["close"] > latest["bb_upper"]:
            score -= 0.15
            reasons.append("Price near/above upper Bollinger Band")

        if latest["roc_10"] > 0:
            score += 0.15
            reasons.append("Positive 10-day rate of change")
        else:
            score -= 0.15
            reasons.append("Negative 10-day rate of change")

        score = max(min(score, 1.0), -1.0)

        return {
            "score": round(score, 3),
            "reasons": reasons,
            "rsi_14": round(float(latest["rsi_14"]), 2) if pd.notna(latest["rsi_14"]) else None,
            "macd_hist": round(float(latest["macd_hist"]), 4) if pd.notna(latest["macd_hist"]) else None,
            "volatility_20": round(float(latest["volatility_20"]), 4) if pd.notna(latest["volatility_20"]) else None,
        }
