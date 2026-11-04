"""PortfolioAgent: gives other agents a read-only snapshot of portfolio state."""
from ..trading.paper_trading_engine import PaperTradingEngine


class PortfolioAgent:
    def __init__(self, engine: PaperTradingEngine):
        self.engine = engine

    def snapshot(self, price_lookup: dict[str, float]) -> dict:
        p = self.engine.portfolio
        total_value = p.total_value(price_lookup)
        return {
            "cash": round(p.cash, 2),
            "total_value": round(total_value, 2),
            "exposure_value": round(p.exposure_value(price_lookup), 2),
            "unrealized_pnl": round(p.unrealized_pnl(price_lookup), 2),
            "realized_pnl": round(p.realized_pnl, 2),
            "total_pnl": round(p.unrealized_pnl(price_lookup) + p.realized_pnl, 2),
            "return_pct": round((total_value / p.starting_cash - 1) * 100, 2),
            "open_positions": len(p.holdings),
            "holdings": {
                sym: {"quantity": h.quantity, "avg_buy_price": round(h.avg_buy_price, 2)}
                for sym, h in p.holdings.items()
            },
        }
