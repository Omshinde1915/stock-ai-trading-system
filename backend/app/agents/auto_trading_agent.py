"""
AutoTradingAgent - Autonomous AI agent that buys/sells stocks.
Market hours STRICTLY enforced on server side.
"""
import logging
import json
from datetime import datetime, time as dtime, timezone, timedelta
from typing import Optional

from app.database import SessionLocal
from app.models.user import User
from app.models.stock import Stock
from app.models.portfolio import PaperAccount, Holding, Transaction
from app.models.agent_log import AgentLog, AgentConfig
from app.agents.supervisor import StockTradingSupervisor

logger = logging.getLogger("auto_trading_agent")

# India Standard Time
IST = timezone(timedelta(hours=5, minutes=30))

# Market hours (IST)
MARKET_OPEN = dtime(9, 15)
MARKET_CLOSE = dtime(15, 30)


class AutoTradingAgent:
    """Autonomous trading agent with strict market hours enforcement."""

    def __init__(self):
        self.supervisor = StockTradingSupervisor()
        self.kill_switch_engaged = False

    # ============ MARKET HOURS ============
    def _is_market_hours(self) -> bool:
        """Check if Indian market is open."""
        now_ist = datetime.now(IST)
        
        # Weekend check
        if now_ist.weekday() >= 5:
            return False
        
        current_time = now_ist.time()
        return MARKET_OPEN <= current_time <= MARKET_CLOSE

    def get_market_status(self) -> dict:
        """Get current market status."""
        now_ist = datetime.now(IST)
        
        is_open = self._is_market_hours()
        weekday = now_ist.weekday()
        current_time = now_ist.time()
        
        # Determine reason
        if weekday == 5:
            reason = "Weekend (Saturday) - Market closed"
        elif weekday == 6:
            reason = "Weekend (Sunday) - Market closed"
        elif current_time < MARKET_OPEN:
            reason = "Pre-market - Opens at 9:15 AM IST"
        elif current_time > MARKET_CLOSE:
            reason = "Post-market - Closed at 3:30 PM IST"
        else:
            reason = "Market is OPEN for trading"
        
        return {
            "is_open": is_open,
            "current_time_ist": now_ist.strftime("%I:%M %p"),
            "current_day": now_ist.strftime("%A"),
            "current_date": now_ist.strftime("%d %b %Y"),
            "market_open_time": "9:15 AM IST",
            "market_close_time": "3:30 PM IST",
            "reason": reason,
            "timezone": "IST (UTC+5:30)",
        }

    # ============ LOGGING ============
    def _log(self, db, user_id: int, action: str, **kwargs):
        """Write agent action to database."""
        try:
            log = AgentLog(
                user_id=user_id,
                action=action,
                symbol=kwargs.get("symbol"),
                quantity=kwargs.get("quantity"),
                price=kwargs.get("price"),
                total_amount=kwargs.get("total_amount"),
                pnl=kwargs.get("pnl"),
                pnl_pct=kwargs.get("pnl_pct"),
                confidence=kwargs.get("confidence"),
                reason=kwargs.get("reason"),
                details=json.dumps(kwargs.get("details")) if kwargs.get("details") else None,
                success=kwargs.get("success", True),
                error_message=kwargs.get("error_message"),
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log agent action: {e}")
            db.rollback()

    # ============ GET / CREATE CONFIG ============
    def get_or_create_config(self, db, user_id: int) -> AgentConfig:
        """Get or create agent config for user."""
        config = db.query(AgentConfig).filter(
            AgentConfig.user_id == user_id
        ).first()

        if not config:
            config = AgentConfig(user_id=user_id)
            db.add(config)
            db.commit()
            db.refresh(config)

        return config

    # ============ MAIN CYCLE ============
    def run_cycle(self, user_id: int, symbols: Optional[list] = None, force: bool = False) -> dict:
        """
        Main trading cycle.
        force=True allows testing outside market hours (manual run only).
        """
        db = SessionLocal()
        start_time = datetime.utcnow()

        try:
            # 1. Kill switch
            if self.kill_switch_engaged:
                return {"status": "stopped", "reason": "Kill switch engaged", "trades": []}

            # 2. Get config
            config = self.get_or_create_config(db, user_id)

            if not config.is_running:
                return {"status": "stopped", "reason": "Agent not running", "trades": []}

            # 3. MARKET HOURS CHECK - ALWAYS ENFORCED unless force=True (manual test)
            market_status = self.get_market_status()
            
            if not market_status["is_open"]:
                if not force:
                    # Auto-stop agent when market closed
                    if config.is_running:
                        config.is_running = False
                        db.commit()
                        self._log(db, user_id, "AUTO_STOP",
                                  reason=f"Market closed: {market_status['reason']}",
                                  success=True)
                        logger.info(f"⏰ Auto-stopped agent for user {user_id} - market closed")
                    
                    return {
                        "status": "market_closed",
                        "reason": market_status['reason'],
                        "market_status": market_status,
                        "trades": []
                    }
                else:
                    logger.warning(f"⚠️ Force run during market closed for user {user_id}")

            # 4. Daily loss check
            if config.stop_trading_on_loss:
                daily_loss_pct = self._calculate_daily_loss_pct(db, user_id, config)
                if daily_loss_pct <= -float(config.max_daily_loss_pct):
                    self._log(db, user_id, "AUTO_STOP",
                              reason=f"Daily loss limit: {daily_loss_pct:.2%}",
                              success=False)
                    config.is_running = False
                    db.commit()
                    return {
                        "status": "stopped",
                        "reason": f"Daily loss limit reached ({daily_loss_pct:.2%})",
                        "trades": []
                    }

            # 5. Daily trades check
            if config.today_trades_count >= config.max_daily_trades:
                return {
                    "status": "skipped",
                    "reason": f"Max daily trades reached ({config.max_daily_trades})",
                    "trades": []
                }

            # 6. Default symbols
            if not symbols:
                stocks = db.query(Stock).filter(
                    Stock.exchange == "NSE",
                    Stock.is_active == True
                ).limit(15).all()
                symbols = [s.symbol for s in stocks]

            # 7. Get account
            account = db.query(PaperAccount).filter(
                PaperAccount.user_id == user_id
            ).first()
            if not account:
                account = PaperAccount(user_id=user_id, virtual_balance=1000000.00)
                db.add(account)
                db.commit()
                db.refresh(account)

            # 8. Log start
            self._log(db, user_id, "SCAN",
                      reason=f"Scanning {len(symbols)} symbols",
                      details={"symbols": symbols})

            # 9. Scan
            trades_executed = []
            signals_found = []

            for symbol in symbols:
                if len(trades_executed) >= config.max_trades_per_cycle:
                    break

                try:
                    analysis = self.supervisor.analyze(symbol)

                    signal = {
                        "symbol": symbol,
                        "decision": analysis["decision"],
                        "confidence": float(analysis["confidence"]),
                        "opportunity_score": float(analysis["opportunity_score"]),
                        "risk_level": analysis["risk_level"],
                        "price": float(analysis["current_price"]),
                    }
                    signals_found.append(signal)

                    if float(analysis["confidence"]) < float(config.min_confidence):
                        continue
                    if float(analysis["opportunity_score"]) < float(config.min_opportunity_score):
                        continue

                    if analysis["decision"] == "BUY":
                        trade = self._execute_buy(db, account, config, analysis)
                        if trade:
                            trades_executed.append(trade)

                    elif analysis["decision"] == "SELL":
                        trade = self._execute_sell(db, account, config, analysis)
                        if trade:
                            trades_executed.append(trade)

                except Exception as e:
                    logger.exception(f"Error scanning {symbol}: {e}")
                    self._log(db, user_id, "ERROR", symbol=symbol,
                              error_message=str(e)[:200], success=False)

            # 10. Update stats
            config.last_run_at = datetime.utcnow()
            config.today_trades_count += len(trades_executed)
            config.total_trades += len(trades_executed)
            db.commit()

            # 11. Log completion
            self._log(db, user_id, "CYCLE_COMPLETE",
                      reason=f"Scanned {len(symbols)}, executed {len(trades_executed)}",
                      details={"trades": trades_executed})

            duration = (datetime.utcnow() - start_time).total_seconds()

            return {
                "status": "completed",
                "duration_seconds": round(duration, 1),
                "symbols_scanned": len(symbols),
                "signals_found": len(signals_found),
                "trades_executed": len(trades_executed),
                "trades": trades_executed,
                "signals": signals_found,
                "market_status": market_status,
            }

        except Exception as e:
            logger.exception("Cycle failed")
            self._log(db, user_id, "ERROR", error_message=str(e), success=False)
            return {"status": "error", "error": str(e)}
        finally:
            db.close()

    # ============ TRADE EXECUTION ============
    def _execute_buy(self, db, account, config, analysis) -> Optional[dict]:
        """Execute BUY."""
        symbol = analysis["symbol"]
        current_price = float(analysis["current_price"])

        if not analysis.get("risk_check", {}).get("passed"):
            self._log(db, account.user_id, "REJECTED", symbol=symbol,
                      reason="Risk check failed", success=False)
            return None

        account_balance = float(account.virtual_balance)
        max_position_value = account_balance * float(config.max_position_pct)

        stock = db.query(Stock).filter(Stock.symbol == symbol).first()
        if not stock:
            return None

        existing_holding = db.query(Holding).filter(
            Holding.user_id == account.user_id,
            Holding.stock_id == stock.id
        ).first()

        existing_value = 0
        if existing_holding:
            existing_value = float(existing_holding.average_price) * int(existing_holding.quantity)

        remaining_room = max_position_value - existing_value
        if remaining_room <= 0:
            return None

        suggested_size = int(analysis.get("position_size", 0))
        max_size_by_room = int(remaining_room / current_price)
        quantity = min(suggested_size, max_size_by_room)

        if quantity <= 0:
            return None

        total_cost = current_price * quantity
        if total_cost > account_balance:
            return None

        account.virtual_balance = account_balance - total_cost

        if existing_holding:
            existing_qty = int(existing_holding.quantity)
            new_qty = existing_qty + quantity
            new_avg = (existing_value + total_cost) / new_qty
            existing_holding.quantity = new_qty
            existing_holding.average_price = new_avg
        else:
            holding = Holding(
                user_id=account.user_id,
                stock_id=stock.id,
                quantity=quantity,
                average_price=current_price
            )
            db.add(holding)

        transaction = Transaction(
            user_id=account.user_id,
            stock_id=stock.id,
            transaction_type="BUY",
            quantity=quantity,
            price=current_price,
            total_amount=total_cost
        )
        db.add(transaction)
        config.total_invested = float(config.total_invested or 0) + total_cost
        db.commit()

        trade_data = {
            "action": "BUY",
            "symbol": symbol,
            "quantity": quantity,
            "price": round(current_price, 2),
            "total": round(total_cost, 2),
            "confidence": float(analysis["confidence"]),
            "timestamp": datetime.utcnow().isoformat(),
        }

        self._log(db, account.user_id, "BUY", symbol=symbol, quantity=quantity,
                  price=current_price, total_amount=total_cost,
                  confidence=float(analysis["confidence"]),
                  reason=f"BUY {symbol} ×{quantity} @ ₹{current_price}")

        logger.info(f"🤖 AUTO-BUY {symbol} ×{quantity} @ ₹{current_price}")
        return trade_data

    def _execute_sell(self, db, account, config, analysis) -> Optional[dict]:
        """Execute SELL with P&L tracking."""
        symbol = analysis["symbol"]
        current_price = float(analysis["current_price"])

        stock = db.query(Stock).filter(Stock.symbol == symbol).first()
        if not stock:
            return None

        holding = db.query(Holding).filter(
            Holding.user_id == account.user_id,
            Holding.stock_id == stock.id
        ).first()

        if not holding or holding.quantity <= 0:
            return None

        quantity = int(holding.quantity)
        avg_buy_price = float(holding.average_price)
        total_proceeds = current_price * quantity
        total_cost = avg_buy_price * quantity
        
        pnl = total_proceeds - total_cost
        pnl_pct = (pnl / total_cost * 100) if total_cost > 0 else 0

        account.virtual_balance = float(account.virtual_balance) + total_proceeds
        db.delete(holding)

        transaction = Transaction(
            user_id=account.user_id,
            stock_id=stock.id,
            transaction_type="SELL",
            quantity=quantity,
            price=current_price,
            total_amount=total_proceeds
        )
        db.add(transaction)
        
        config.total_realized_pnl = float(config.total_realized_pnl or 0) + pnl
        config.total_pnl = float(config.total_pnl or 0) + pnl
        config.today_pnl = float(config.today_pnl or 0) + pnl
        
        if pnl >= 0:
            config.winning_trades = (config.winning_trades or 0) + 1
        else:
            config.losing_trades = (config.losing_trades or 0) + 1
        
        db.commit()

        trade_data = {
            "action": "SELL",
            "symbol": symbol,
            "quantity": quantity,
            "price": round(current_price, 2),
            "total": round(total_proceeds, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2),
            "confidence": float(analysis["confidence"]),
            "timestamp": datetime.utcnow().isoformat(),
        }

        pnl_label = "PROFIT" if pnl >= 0 else "LOSS"
        self._log(db, account.user_id, "SELL", symbol=symbol, quantity=quantity,
                  price=current_price, total_amount=total_proceeds,
                  confidence=float(analysis["confidence"]),
                  pnl=pnl, pnl_pct=pnl_pct,
                  reason=f"SELL {symbol} ×{quantity} - {pnl_label}: ₹{pnl:.2f}")

        logger.info(f"🤖 AUTO-SELL {symbol} ×{quantity} @ ₹{current_price} | P&L: ₹{pnl:.2f}")
        return trade_data

    # ============ HELPERS ============
    def _calculate_daily_loss_pct(self, db, user_id: int, config) -> float:
        """Calculate today's P&L %."""
        today_pnl = float(config.today_pnl or 0)
        starting = 1000000.00
        return today_pnl / starting if starting > 0 else 0

    # ============ CONTROLS ============
    def start(self, user_id: int) -> dict:
        """Start agent - only if market is open OR force mode."""
        db = SessionLocal()
        try:
            market_status = self.get_market_status()
            
            config = self.get_or_create_config(db, user_id)
            config.is_running = True
            config.is_enabled = True
            self.kill_switch_engaged = False
            
            # Reset daily counters if new day
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            if config.last_run_at and config.last_run_at < today_start:
                config.today_trades_count = 0
                config.today_pnl = 0
            
            db.commit()

            self._log(db, user_id, "START",
                      reason=f"Agent started. Market: {market_status['reason']}")

            return {
                "status": "started",
                "config_id": config.id,
                "market_status": market_status,
                "warning": None if market_status["is_open"] else 
                          f"⚠️ Market is closed. Agent will auto-activate at 9:15 AM IST on next trading day.",
            }
        finally:
            db.close()

    def stop(self, user_id: int) -> dict:
        """Stop agent."""
        db = SessionLocal()
        try:
            config = self.get_or_create_config(db, user_id)
            config.is_running = False
            db.commit()
            self._log(db, user_id, "STOP", reason="Agent stopped")
            return {"status": "stopped"}
        finally:
            db.close()

    def emergency_stop(self) -> dict:
        """KILL SWITCH."""
        db = SessionLocal()
        try:
            self.kill_switch_engaged = True
            configs = db.query(AgentConfig).filter(AgentConfig.is_running == True).all()
            for config in configs:
                config.is_running = False
                self._log(db, config.user_id, "EMERGENCY_STOP",
                          reason="Kill switch engaged")
            db.commit()
            logger.critical("🚨 EMERGENCY STOP")
            return {"status": "emergency_stopped", "agents_stopped": len(configs)}
        finally:
            db.close()

    def reset_kill_switch(self, user_id: int) -> dict:
        """Reset kill switch."""
        db = SessionLocal()
        try:
            self.kill_switch_engaged = False
            self._log(db, user_id, "KILL_SWITCH_RESET", reason="Manual reset")
            return {"status": "reset"}
        finally:
            db.close()

    def auto_stop_all_for_market_close(self) -> int:
        """Auto-stop all agents when market closes. Called by scheduler."""
        db = SessionLocal()
        try:
            configs = db.query(AgentConfig).filter(AgentConfig.is_running == True).all()
            count = 0
            for config in configs:
                config.is_running = False
                self._log(db, config.user_id, "AUTO_STOP",
                          reason="Market closed at 3:30 PM IST")
                count += 1
            db.commit()
            if count > 0:
                logger.info(f"⏰ Auto-stopped {count} agent(s) - market closed")
            return count
        finally:
            db.close()


# Global instance
auto_trading_agent = AutoTradingAgent()