"""
Paper Trading Engine.

Simulated execution only. This never touches real money or a real broker.
Includes configurable brokerage/slippage/tax so P&L reflects realistic
frictions rather than a frictionless toy simulation.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from ..config import settings


@dataclass
class Holding:
    symbol: str
    quantity: int
    avg_buy_price: float


@dataclass
class Trade:
    timestamp: str
    symbol: str
    side: str          # BUY / SELL
    quantity: int
    price: float
    fees: float
    reason: str = ""


class InsufficientFundsError(Exception):
    pass


class InsufficientHoldingsError(Exception):
    pass


class Portfolio:
    def __init__(self, starting_cash: float = None):
        self.cash = starting_cash if starting_cash is not None else settings.starting_cash
        self.starting_cash = self.cash
        self.holdings: dict[str, Holding] = {}
        self.trade_history: list[Trade] = []
        self.realized_pnl = 0.0

    def exposure_value(self, price_lookup: dict[str, float]) -> float:
        return sum(h.quantity * price_lookup.get(h.symbol, h.avg_buy_price) for h in self.holdings.values())

    def total_value(self, price_lookup: dict[str, float]) -> float:
        return self.cash + self.exposure_value(price_lookup)

    def symbol_exposure_value(self, symbol: str, price: float) -> float:
        h = self.holdings.get(symbol)
        return h.quantity * price if h else 0.0

    def unrealized_pnl(self, price_lookup: dict[str, float]) -> float:
        total = 0.0
        for h in self.holdings.values():
            current = price_lookup.get(h.symbol, h.avg_buy_price)
            total += (current - h.avg_buy_price) * h.quantity
        return total


class PaperTradingEngine:
    def __init__(self, portfolio: Portfolio = None, config=None):
        self.portfolio = portfolio or Portfolio()
        self.cfg = config or settings

    def _execution_costs(self, notional: float) -> float:
        return notional * (self.cfg.brokerage_pct + self.cfg.slippage_pct + self.cfg.tax_pct)

    def buy(self, symbol: str, quantity: int, price: float, reason: str = "") -> Trade:
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        notional = quantity * price
        fees = self._execution_costs(notional)
        total_cost = notional + fees

        if total_cost > self.portfolio.cash:
            raise InsufficientFundsError(
                f"Need {total_cost:.2f} but only {self.portfolio.cash:.2f} cash available"
            )

        self.portfolio.cash -= total_cost
        existing = self.portfolio.holdings.get(symbol)
        if existing:
            new_qty = existing.quantity + quantity
            new_avg = (existing.avg_buy_price * existing.quantity + notional) / new_qty
            existing.quantity = new_qty
            existing.avg_buy_price = new_avg
        else:
            self.portfolio.holdings[symbol] = Holding(symbol=symbol, quantity=quantity, avg_buy_price=price)

        trade = Trade(
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol, side="BUY", quantity=quantity, price=price, fees=fees, reason=reason,
        )
        self.portfolio.trade_history.append(trade)
        return trade

    def sell(self, symbol: str, quantity: int, price: float, reason: str = "") -> Trade:
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        holding = self.portfolio.holdings.get(symbol)
        if not holding or holding.quantity < quantity:
            raise InsufficientHoldingsError(f"Not enough shares of {symbol} to sell")

        notional = quantity * price
        fees = self._execution_costs(notional)
        proceeds = notional - fees

        realized = (price - holding.avg_buy_price) * quantity - fees
        self.portfolio.realized_pnl += realized

        holding.quantity -= quantity
        if holding.quantity == 0:
            del self.portfolio.holdings[symbol]

        self.portfolio.cash += proceeds

        trade = Trade(
            timestamp=datetime.now(timezone.utc).isoformat(),
            symbol=symbol, side="SELL", quantity=quantity, price=price, fees=fees, reason=reason,
        )
        self.portfolio.trade_history.append(trade)
        return trade
