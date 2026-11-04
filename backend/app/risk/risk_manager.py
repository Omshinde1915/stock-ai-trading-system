"""
Risk management: position sizing and pre-trade rule checks. Every simulated
order must pass through here before execution -- this is the one place
that can veto a trade, including vetoing the AI Agent and any LLM layer.
"""
from dataclasses import dataclass
from ..config import settings


@dataclass
class RiskCheckResult:
    passed: bool
    reasons: list[str]
    position_size: int = 0
    stop_loss: float = 0.0
    take_profit: float = 0.0


class RiskManager:
    def __init__(self, config=None):
        self.cfg = config or settings

    def position_size(self, entry_price: float, stop_loss: float, portfolio_value: float) -> int:
        risk_amount = portfolio_value * self.cfg.risk_per_trade_pct
        risk_per_share = max(entry_price - stop_loss, 0.01)
        size = int(risk_amount / risk_per_share)

        # Cap by max single-position exposure regardless of stop distance.
        max_shares_by_exposure = int((portfolio_value * self.cfg.max_position_pct) / entry_price)
        return max(min(size, max_shares_by_exposure), 0)

    def check(
        self,
        *,
        symbol: str,
        entry_price: float,
        portfolio_value: float,
        cash_available: float,
        current_exposure_value: float,
        open_positions_count: int,
        daily_pnl_pct: float,
        existing_symbol_exposure_value: float = 0.0,
    ) -> RiskCheckResult:
        reasons = []

        stop_loss = entry_price * (1 - self.cfg.stop_loss_pct)
        take_profit = entry_price * (1 + self.cfg.take_profit_pct)
        size = self.position_size(entry_price, stop_loss, portfolio_value)

        if size <= 0:
            reasons.append("Calculated position size is zero (risk budget too small for this stop distance)")

        cost_estimate = size * entry_price
        if cost_estimate > cash_available:
            reasons.append("Insufficient virtual cash for calculated position size")

        projected_exposure = current_exposure_value + cost_estimate
        if projected_exposure > portfolio_value * self.cfg.max_portfolio_exposure_pct:
            reasons.append(f"Would exceed max portfolio exposure ({self.cfg.max_portfolio_exposure_pct*100:.0f}%)")

        projected_symbol_exposure = existing_symbol_exposure_value + cost_estimate
        if projected_symbol_exposure > portfolio_value * self.cfg.max_position_pct:
            reasons.append(f"Would exceed max single-stock exposure ({self.cfg.max_position_pct*100:.0f}%)")

        if open_positions_count >= self.cfg.max_open_positions:
            reasons.append(f"Max open positions reached ({self.cfg.max_open_positions})")

        if daily_pnl_pct <= -self.cfg.max_daily_loss_pct:
            reasons.append(f"Daily loss limit breached ({self.cfg.max_daily_loss_pct*100:.0f}%) -- trading halted for today")

        passed = len(reasons) == 0
        if passed:
            reasons.append("All risk checks passed")

        return RiskCheckResult(
            passed=passed,
            reasons=reasons,
            position_size=size,
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2),
        )
