"""
DecisionAgent: combines ML prediction, technical score, market trend, and a
risk penalty into a single weighted Opportunity Score, then maps that to
BUY/SELL/HOLD with a structured, non-chain-of-thought explanation.
"""
from ..config import settings


class DecisionAgent:
    def decide(
        self,
        *,
        symbol: str,
        ml_expected_return: float,
        ml_confidence: float,
        technical_score: float,      # -1..1
        market_trend_score: float,   # -1..1
        volatility_20: float | None,
    ) -> dict:
        cfg = settings

        # Normalize ML expected return into a -1..1 score around the buy/sell thresholds.
        span = max(abs(cfg.buy_threshold), abs(cfg.sell_threshold)) * 3
        ml_score = max(min(ml_expected_return / span, 1.0), -1.0)

        # Risk score: penalize high volatility (reduces conviction, doesn't block by itself).
        vol = volatility_20 or 0.02
        risk_score = max(1 - (vol / 0.05), -1.0)  # >5% daily vol -> fully penalized
        risk_score = max(min(risk_score, 1.0), -1.0)

        opportunity_score = (
            cfg.weight_ml * ml_score
            + cfg.weight_technical * technical_score
            + cfg.weight_market_trend * market_trend_score
            + cfg.weight_risk * risk_score
        )
        # Scale -1..1 -> 0..100 for display (an "Opportunity Score")
        opportunity_100 = round((opportunity_score + 1) / 2 * 100, 1)

        if ml_expected_return >= cfg.buy_threshold and opportunity_score > 0.1:
            signal = "BUY"
        elif ml_expected_return <= cfg.sell_threshold and opportunity_score < -0.1:
            signal = "SELL"
        else:
            signal = "HOLD"

        risk_level = "LOW" if vol < 0.015 else ("MEDIUM" if vol < 0.03 else "HIGH")

        reasons = []
        reasons.append(
            f"ML model expects {ml_expected_return*100:+.2f}% return "
            f"over {cfg.prediction_horizon_days} days (confidence {ml_confidence:.0f}%)"
        )
        reasons.append(f"Technical score {technical_score:+.2f} (-1 bearish, +1 bullish)")
        reasons.append(f"Market trend score {market_trend_score:+.2f}")
        reasons.append(f"Volatility-adjusted risk score {risk_score:+.2f} ({risk_level} risk)")

        # Confidence blends ML confidence with agreement across signals.
        signals = [ml_score, technical_score, market_trend_score]
        agreement = 1 - (max(signals) - min(signals)) / 2
        confidence = round(max(min(0.6 * ml_confidence + 40 * agreement, 95), 5), 1)

        return {
            "symbol": symbol,
            "decision": signal,
            "opportunity_score": opportunity_100,
            "confidence": confidence,
            "risk_level": risk_level,
            "reasons": reasons,
        }
