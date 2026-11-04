"""
StockTradingSupervisor

Orchestrates MarketDataAgent -> TechnicalAnalysisAgent -> PredictionAgent ->
DecisionAgent -> RiskManagementAgent -> (optionally) PaperTradingEngine,
following the 10-step process from the project spec. Nothing skips the
RiskManagementAgent -- not the ML model, not a future LLM layer.
"""
import math
import logging
from ..trading.paper_trading_engine import (
    PaperTradingEngine,
    InsufficientFundsError,
    InsufficientHoldingsError,
)
from .market_data_agent import MarketDataAgent
from .technical_analysis_agent import TechnicalAnalysisAgent
from .prediction_agent import PredictionAgent
from .risk_management_agent import RiskManagementAgent
from .portfolio_agent import PortfolioAgent
from .decision_agent import DecisionAgent

logger = logging.getLogger("supervisor")


# ============ SAFE CONVERSION HELPERS ============

def _safe_float(v, default=0.0):
    """Convert value to safe float, handling NaN/Inf/None."""
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (TypeError, ValueError):
        return default


def _safe_int(v, default=0):
    """Convert value to safe int, handling NaN/Inf/None."""
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return default
        return int(f)
    except (TypeError, ValueError):
        return default


def _safe_round(v, digits=2, default=0.0):
    """Safe round that handles NaN/Inf."""
    return round(_safe_float(v, default), digits)


# ============ SUPERVISOR ============

class StockTradingSupervisor:
    def __init__(self, engine: PaperTradingEngine = None):
        self.market_data_agent = MarketDataAgent()
        self.technical_agent = TechnicalAnalysisAgent()
        self.prediction_agent = PredictionAgent()
        self.risk_agent = RiskManagementAgent()
        self.decision_agent = DecisionAgent()
        self.engine = engine or PaperTradingEngine()
        self.portfolio_agent = PortfolioAgent(self.engine)
        self.auto_trading_enabled = False
        self.kill_switch_engaged = False

    def get_market_trend_score(self, symbol: str) -> float:
        """Market-trend proxy using symbol's own momentum."""
        try:
            df = self.market_data_agent.get_history(symbol, days=120)
            recent = df["close"].iloc[-10:].mean()
            longer = df["close"].iloc[-60:].mean()
            if longer == 0 or math.isnan(longer):
                return 0.0
            score = (recent / longer - 1) * 10
            return max(min(_safe_float(score), 1.0), -1.0)
        except Exception as e:
            logger.warning(f"market_trend_score failed for {symbol}: {e}")
            return 0.0

    def analyze(self, symbol: str) -> dict:
        """Steps 1-9: analyze a symbol and produce structured recommendation."""

        # ============ STEP 1: MARKET DATA ============
        df = self.market_data_agent.get_history(symbol)
        quote = self.market_data_agent.get_quote(symbol)

        # 🔧 FIX: Ensure quote has valid price
        current_price = _safe_float(quote.price)
        if current_price <= 0:
            logger.error(f"Invalid price for {symbol}: {quote.price}")
            # Try to get from last close of history
            try:
                if df is not None and len(df) > 0:
                    current_price = _safe_float(df["close"].iloc[-1])
                    logger.info(f"Fallback price for {symbol}: {current_price}")
            except Exception:
                pass

        # If still invalid, return safe HOLD response
        if current_price <= 0:
            logger.error(f"Cannot determine price for {symbol}")
            return {
                "symbol": symbol,
                "company_name": getattr(quote, "company_name", symbol) or symbol,
                "current_price": 0.0,
                "change_pct": 0.0,
                "decision": "HOLD",
                "opportunity_score": 0.0,
                "confidence": 0.0,
                "risk_level": "MEDIUM",
                "reasons": ["Price data unavailable — cannot analyze"],
                "entry": 0.0,
                "stop_loss": 0.0,
                "target": 0.0,
                "position_size": 0,
                "risk_check": {
                    "passed": False,
                    "reasons": ["No price data"],
                },
                "prediction": {},
                "technical": {},
            }

        # ============ STEP 2: TECHNICAL INDICATORS ============
        try:
            technical = self.technical_agent.analyze(df)
        except Exception as e:
            logger.warning(f"Technical analysis failed for {symbol}: {e}")
            technical = {
                "score": 0.0,
                "volatility_20": 0.0,
                "rsi_14": None,
                "macd_hist": 0.0,
                "reasons": [],
            }

        # ============ STEP 3: ML PREDICTION ============
        try:
            prediction = self.prediction_agent.predict(symbol, df)
        except Exception as e:
            logger.warning(f"Prediction failed for {symbol}: {e}")
            prediction = None

        # ============ STEP 4-5: MARKET TREND ============
        market_trend_score = self.get_market_trend_score(symbol)

        # ============ If prediction failed → safe HOLD ============
        if prediction is None:
            return {
                "symbol": symbol,
                "company_name": getattr(quote, "company_name", symbol) or symbol,
                "current_price": _safe_round(current_price),
                "change_pct": _safe_round(quote.change_pct),
                "decision": "HOLD",
                "opportunity_score": 0.0,
                "confidence": 0.0,
                "risk_level": "MEDIUM",
                "reasons": ["ML prediction unavailable — holding"],
                "entry": _safe_round(current_price),
                "stop_loss": _safe_round(current_price * 0.95),
                "target": _safe_round(current_price * 1.05),
                "position_size": 0,
                "risk_check": {
                    "passed": False,
                    "reasons": ["No prediction"],
                },
                "prediction": {},
                "technical": technical,
            }

        # ============ STEP 8: DECISION ============
        try:
            decision = self.decision_agent.decide(
                symbol=symbol,
                ml_expected_return=_safe_float(prediction.expected_return),
                ml_confidence=_safe_float(prediction.confidence),
                technical_score=_safe_float(technical.get("score", 0)),
                market_trend_score=_safe_float(market_trend_score),
                volatility_20=_safe_float(technical.get("volatility_20", 0)),
            )
        except Exception as e:
            logger.warning(f"Decision failed for {symbol}: {e}")
            decision = {
                "decision": "HOLD",
                "opportunity_score": 0.0,
                "confidence": 0.0,
                "risk_level": "MEDIUM",
                "reasons": [f"Decision error: {str(e)[:50]}"],
            }

        # ============ STEP 6-7: RISK MANAGEMENT ============
        try:
            price_lookup = {symbol: current_price}
            portfolio_snapshot = self.portfolio_agent.snapshot(price_lookup)
            existing_symbol_value = self.engine.portfolio.symbol_exposure_value(
                symbol, current_price
            )

            risk_result = self.risk_agent.evaluate(
                symbol=symbol,
                entry_price=current_price,
                portfolio_value=_safe_float(portfolio_snapshot["total_value"]),
                cash_available=_safe_float(portfolio_snapshot["cash"]),
                current_exposure_value=_safe_float(
                    portfolio_snapshot["exposure_value"]
                ),
                open_positions_count=_safe_int(
                    portfolio_snapshot["open_positions"]
                ),
                daily_pnl_pct=0.0,
                existing_symbol_exposure_value=_safe_float(
                    existing_symbol_value
                ),
            )
        except Exception as e:
            logger.warning(f"Risk evaluate failed for {symbol}: {e}")

            class _Fallback:
                stop_loss = current_price * 0.95
                take_profit = current_price * 1.05
                position_size = 0
                passed = False
                reasons = [f"Risk error: {str(e)[:80]}"]

            risk_result = _Fallback()

        # ============ RETURN RESPONSE ============
        return {
            "symbol": symbol,
            "company_name": getattr(quote, "company_name", symbol) or symbol,
            "current_price": _safe_round(current_price),
            "change_pct": _safe_round(quote.change_pct),
            "decision": decision.get("decision", "HOLD"),
            "opportunity_score": _safe_float(
                decision.get("opportunity_score", 0)
            ),
            "confidence": _safe_float(decision.get("confidence", 0)),
            "risk_level": decision.get("risk_level", "MEDIUM"),
            "reasons": decision.get("reasons", []),
            "entry": _safe_round(current_price),
            "stop_loss": _safe_round(risk_result.stop_loss),
            "target": _safe_round(risk_result.take_profit),
            "position_size": _safe_int(risk_result.position_size),
            "risk_check": {
                "passed": bool(risk_result.passed),
                "reasons": risk_result.reasons or [],
            },
            "prediction": {
                "expected_return_pct": _safe_round(
                    prediction.expected_return * 100
                ),
                "predicted_price": _safe_round(prediction.predicted_price),
                "model_used": prediction.model_used,
                "test_directional_accuracy": (
                    _safe_round(
                        prediction.metrics.directional_accuracy * 100, 1
                    )
                    if prediction.metrics
                    else None
                ),
            },
            "technical": technical,
        }

    def execute_if_approved(self, analysis: dict) -> dict:
        """Step 10: execute simulated order if actionable and risk passed."""
        if self.kill_switch_engaged:
            return {
                "executed": False,
                "reason": "Kill switch engaged -- auto trading disabled",
            }

        if analysis["decision"] == "HOLD":
            return {
                "executed": False,
                "reason": "Decision is HOLD -- no order placed",
            }

        if not analysis["risk_check"]["passed"]:
            return {
                "executed": False,
                "reason": "Risk check failed",
                "details": analysis["risk_check"]["reasons"],
            }

        symbol = analysis["symbol"]
        price = analysis["current_price"]
        qty = analysis["position_size"]

        try:
            if analysis["decision"] == "BUY":
                if qty <= 0:
                    return {
                        "executed": False,
                        "reason": "Position size is zero",
                    }
                trade = self.engine.buy(
                    symbol, qty, price, reason="; ".join(analysis["reasons"])
                )
            else:
                holding = self.engine.portfolio.holdings.get(symbol)
                if not holding:
                    return {
                        "executed": False,
                        "reason": "No existing holding to sell",
                    }
                trade = self.engine.sell(
                    symbol,
                    holding.quantity,
                    price,
                    reason="; ".join(analysis["reasons"]),
                )

            logger.info(
                "Executed %s %s x%s @ %s",
                trade.side,
                symbol,
                trade.quantity,
                trade.price,
            )
            return {"executed": True, "trade": trade}
        except (InsufficientFundsError, InsufficientHoldingsError) as e:
            return {"executed": False, "reason": str(e)}

    def run_auto_cycle(self, symbols: list) -> list:
        """Scans a universe, analyzes each, executes approved trades."""
        results = []
        for symbol in symbols:
            try:
                analysis = self.analyze(symbol)
                execution = (
                    self.execute_if_approved(analysis)
                    if self.auto_trading_enabled
                    else {
                        "executed": False,
                        "reason": "Auto trading not enabled",
                    }
                )
                results.append({**analysis, "execution": execution})
            except Exception as e:
                logger.exception("Failed to process %s", symbol)
                results.append({"symbol": symbol, "error": str(e)})
        return results

    def scan(self, symbols: list) -> list:
        """Ranks a universe of stocks by opportunity score."""
        results = []
        for symbol in symbols:
            try:
                a = self.analyze(symbol)
                results.append(a)
            except Exception as e:
                logger.exception("Scan failed for %s", symbol)
        return sorted(
            results, key=lambda r: r.get("opportunity_score", 0), reverse=True
        )

    # --- Auto trading controls ---
    def start_auto_trading(self):
        self.kill_switch_engaged = False
        self.auto_trading_enabled = True

    def pause_auto_trading(self):
        self.auto_trading_enabled = False

    def stop_auto_trading(self):
        self.auto_trading_enabled = False

    def kill_switch(self):
        self.auto_trading_enabled = False
        self.kill_switch_engaged = True