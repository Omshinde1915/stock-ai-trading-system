"""
Standalone demo -- no server, no API keys required (Demo Mode).
Run with:  python run_demo.py
Shows the full pipeline: scan a universe -> rank by opportunity score ->
show the top pick's structured reasoning -> run one auto-trading cycle.
"""
from app.agents.supervisor import StockTradingSupervisor

UNIVERSE = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "AAPL", "MSFT", "NVDA"]


def line():
    print("-" * 70)


def main():
    supervisor = StockTradingSupervisor()

    print("Scanning universe (Demo Mode -- synthetic mock market data)...")
    line()
    ranked = supervisor.scan(UNIVERSE)

    print(f"{'Rank':<5}{'Symbol':<12}{'Decision':<10}{'Score':<8}{'Confidence':<12}{'Risk'}")
    for i, r in enumerate(ranked, start=1):
        print(f"{i:<5}{r['symbol']:<12}{r['decision']:<10}{r['opportunity_score']:<8}{r['confidence']:<12}{r['risk_level']}")

    line()
    top = ranked[0]
    print(f"Top pick: {top['symbol']} -> {top['decision']}")
    print(f"Current price: {top['current_price']}   Entry: {top['entry']}   "
          f"Stop-loss: {top['stop_loss']}   Target: {top['target']}   Size: {top['position_size']} shares")
    print("Reasons:")
    for reason in top["reasons"]:
        print(f"  - {reason}")
    print(f"Risk check passed: {top['risk_check']['passed']} -> {top['risk_check']['reasons']}")

    line()
    print("Enabling AUTO TRADING and running one cycle...")
    supervisor.start_auto_trading()
    results = supervisor.run_auto_cycle(UNIVERSE)
    for r in results:
        exe = r.get("execution", {})
        if exe.get("executed"):
            t = exe["trade"]
            print(f"  EXECUTED: {t.side} {t.quantity} {r['symbol']} @ {t.price:.2f}")
        else:
            print(f"  Skipped {r['symbol']}: {exe.get('reason')}")

    line()
    snapshot = supervisor.portfolio_agent.snapshot(
        {sym: supervisor.market_data_agent.get_quote(sym).price for sym in UNIVERSE}
    )
    print("Portfolio snapshot:")
    for k, v in snapshot.items():
        print(f"  {k}: {v}")

    print()
    print("DISCLAIMER: Educational project. Predictions are estimates and are not")
    print("guaranteed. All trades above are simulated paper trades only.")


if __name__ == "__main__":
    main()
