import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTradeTiming } from '../utils/tradeTiming';
import './AutoTrading.css';

function AutoTrading() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState(null);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [timings, setTimings] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [topPicks, setTopPicks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [running, setRunning] = useState(false);
    const [tradingSymbol, setTradingSymbol] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [config, setConfig] = useState({
        min_confidence: 65,
        min_opportunity_score: 50,
        max_trades_per_cycle: 3,
        max_position_pct: 0.10,
        max_daily_trades: 20,
        max_daily_loss_pct: 0.03,
        stop_trading_on_loss: true,
        interval_minutes: 15,
        market_hours_only: true,
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const fetchData = async () => {
        try {
            const [statusRes, logsRes, statsRes] = await Promise.all([
                api.get('/auto-trading/status'),
                api.get('/auto-trading/logs?limit=20'),
                api.get('/auto-trading/stats'),
            ]);
            setStatus(statusRes.data);
            setLogs(logsRes.data);
            setStats(statsRes.data);

            // Build timing from executed logs
            const timingData = (logsRes.data || [])
                .filter((log) => log.action === 'BUY' || log.action === 'SELL')
                .slice(0, 10)
                .map((log) => ({
                    symbol: log.symbol,
                    action: log.action,
                    createdAt: log.created_at,
                    ...getTradeTiming(
                        log.action,
                        log.confidence || 70,
                        log.risk_level || 'MEDIUM',
                        log.expected_return || 5
                    ),
                }));
            setTimings(timingData);

            if (statusRes.data.config) {
                setConfig((prev) => ({ ...prev, ...statusRes.data.config }));
            }
        } catch (err) {
            console.error('Failed to fetch agent data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Analyze top stocks and build suggestions + top picks
    const fetchSuggestions = async (currentConfig) => {
        setLoadingSuggestions(true);
        try {
            const stocksRes = await api.get('/stocks/');
            const topStocks = (stocksRes.data || []).slice(0, 10);

            const analyses = await Promise.all(
                topStocks.map(async (s) => {
                    try {
                        const res = await api.get(`/stocks/analyze/${s.symbol}`);
                        return { stock: s, analysis: res.data };
                    } catch {
                        return null;
                    }
                })
            );

            const valid = analyses.filter(Boolean);
            const cfg = currentConfig || config;

            const withTiming = valid.map(({ stock, analysis }) => {
                const passes =
                    analysis.confidence >= cfg.min_confidence &&
                    analysis.opportunity_score >= cfg.min_opportunity_score &&
                    analysis.decision !== 'HOLD';

                let failReason = '';
                if (analysis.decision === 'HOLD') failReason = 'AI signal = HOLD';
                else if (analysis.confidence < cfg.min_confidence)
                    failReason = `Confidence ${analysis.confidence}% < ${cfg.min_confidence}%`;
                else if (analysis.opportunity_score < cfg.min_opportunity_score)
                    failReason = `Opportunity ${analysis.opportunity_score} < ${cfg.min_opportunity_score}`;

                return {
                    symbol: stock.symbol,
                    company_name: stock.company_name,
                    decision: analysis.decision,
                    confidence: analysis.confidence,
                    risk_level: analysis.risk_level,
                    opportunity_score: analysis.opportunity_score,
                    current_price: analysis.current_price,
                    target: analysis.target,
                    stop_loss: analysis.stop_loss,
                    position_size: analysis.position_size || 1,
                    expectedReturn:
                        analysis.prediction?.expected_return_pct || 5,
                    reasons: (analysis.reasons || []).slice(0, 3),
                    passesFilters: passes,
                    failReason,
                    ...getTradeTiming(
                        analysis.decision,
                        analysis.confidence,
                        analysis.risk_level,
                        analysis.prediction?.expected_return_pct || 5
                    ),
                };
            });

            // Sort: passers first, then by confidence
            withTiming.sort((a, b) => {
                if (a.passesFilters !== b.passesFilters)
                    return b.passesFilters - a.passesFilters;
                return b.confidence - a.confidence;
            });

            setSuggestions(withTiming);

            // Top picks = only BUY signals sorted by a combined score
            const buyPicks = withTiming
                .filter((s) => s.decision === 'BUY' && s.passesFilters)
                .map((s) => ({
                    ...s,
                    // Combined score: confidence + opportunity + expected return
                    score:
                        s.confidence * 0.4 +
                        s.opportunity_score * 0.4 +
                        s.expectedReturn * 2,
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);

            setTopPicks(buyPicks);
        } catch (err) {
            console.error('Suggestions fetch failed:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        if (!loading) fetchSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, config.min_confidence, config.min_opportunity_score]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleStart = async () => {
        try {
            await api.post('/auto-trading/start');
            showMessage('success', '🤖 Agent started successfully');
            fetchData();
        } catch (err) {
            showMessage('error', err.response?.data?.detail || 'Failed to start');
        }
    };

    const handleStop = async () => {
        try {
            await api.post('/auto-trading/stop');
            showMessage('info', '⏸️ Agent stopped');
            fetchData();
        } catch (err) {
            showMessage('error', 'Failed to stop');
        }
    };

    const handleEmergencyStop = async () => {
        if (!window.confirm('🚨 EMERGENCY STOP - Disable ALL agents immediately?'))
            return;
        try {
            await api.post('/auto-trading/emergency-stop');
            showMessage('error', '🚨 KILL SWITCH ENGAGED');
            fetchData();
        } catch (err) {
            showMessage('error', 'Failed');
        }
    };

    const handleResetKillSwitch = async () => {
        try {
            await api.post('/auto-trading/reset-kill-switch');
            showMessage('success', '✅ Kill switch reset');
            fetchData();
        } catch (err) {
            showMessage('error', 'Failed to reset');
        }
    };

    const handleSaveConfig = async () => {
        try {
            await api.post('/auto-trading/configure', config);
            showMessage('success', '⚙️ Configuration saved');
            fetchSuggestions(config);
        } catch (err) {
            showMessage('error', 'Failed to save config');
        }
    };

    const handleRunCycle = async () => {
        setRunning(true);
        try {
            const res = await api.post('/auto-trading/run-cycle', {
                symbols: null,
                force: true,
            });

            if (res.data.status === 'market_closed' && !res.data.force) {
                showMessage('error', `🔴 ${res.data.reason}`);
            } else {
                const trades = res.data.trades_executed || 0;
                showMessage(
                    'success',
                    `✅ Cycle completed: ${trades} trades executed`
                );
            }
            fetchData();
        } catch (err) {
            showMessage('error', err.response?.data?.detail || 'Cycle failed');
        } finally {
            setRunning(false);
        }
    };

    // Manual trade execution
    const handleManualTrade = async (sug) => {
        const action = sug.decision;
        const qty = sug.position_size || 1;

        if (
            !window.confirm(
                `Manually ${action} ${qty} shares of ${sug.symbol} @ ₹${sug.current_price}?`
            )
        )
            return;

        setTradingSymbol(sug.symbol);
        try {
            const endpoint = action === 'BUY' ? '/trading/buy' : '/trading/sell';
            await api.post(endpoint, { symbol: sug.symbol, quantity: qty });
            showMessage(
                'success',
                `✅ ${action} ${qty} × ${sug.symbol} executed manually`
            );
            fetchData();
        } catch (err) {
            showMessage(
                'error',
                err.response?.data?.detail || 'Manual trade failed'
            );
        } finally {
            setTradingSymbol(null);
        }
    };

    const getActionColor = (action) => {
        if (action === 'BUY') return 'action-buy';
        if (action === 'SELL') return 'action-sell';
        if (action === 'ERROR') return 'action-error';
        if (action === 'REJECTED') return 'action-rejected';
        return 'action-info';
    };

    if (loading) return <div className="loading">Loading agent...</div>;

    const isRunning = status?.is_running;
    const killSwitch = status?.kill_switch;
    const marketStatus = status?.market_status;
    const noTradesYet = stats && (stats.total_trades || 0) === 0;

    return (
        <div className="auto-trading-page">
            {/* Page Header */}
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>🤖 AI Auto-Trading Agent</h1>
                <p>Autonomous trading based on AI signals & risk rules</p>
            </motion.div>

            {/* Message Alert */}
            {message.text && (
                <motion.div
                    className={`alert alert-${message.type}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {message.text}
                </motion.div>
            )}

            {/* Diagnostic Banner */}
            {noTradesYet && (
                <motion.div
                    className="diagnostic-banner"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span className="diag-icon">💡</span>
                    <div>
                        <strong>No trades yet — why?</strong>
                        <span>
                            Market may be closed OR AI confidence/opportunity is
                            below your filters. Check <b>AI Suggestions</b> below
                            to see which stocks passed and which were filtered
                            out. Lower <b>Min Confidence</b> to 55 in
                            Configuration to allow more trades.
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Market Status Banner */}
            {marketStatus && (
                <motion.div
                    className={`market-status-banner ${
                        marketStatus.is_open ? 'open' : 'closed'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="market-status-icon">
                        {marketStatus.is_open ? '🟢' : '🔴'}
                    </div>
                    <div className="market-status-info">
                        <strong>
                            {marketStatus.is_open
                                ? 'Market is OPEN'
                                : 'Market is CLOSED'}
                        </strong>
                        <span>{marketStatus.reason}</span>
                    </div>
                    <div className="market-time">
                        {marketStatus.current_time_ist}
                        <span className="market-day">
                            {marketStatus.current_day}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Kill Switch Warning */}
            {killSwitch && (
                <motion.div
                    className="kill-switch-banner"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <span>🚨 KILL SWITCH ENGAGED - All agents stopped</span>
                    <button
                        onClick={handleResetKillSwitch}
                        className="reset-btn"
                    >
                        Reset
                    </button>
                </motion.div>
            )}

            {/* Status Card */}
            <motion.div
                className={`status-card ${isRunning ? 'active' : 'inactive'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="status-info">
                    <div
                        className={`status-indicator ${
                            isRunning ? 'on' : 'off'
                        }`}
                    >
                        <span className="dot"></span>
                        {isRunning ? 'AGENT ACTIVE' : 'AGENT STOPPED'}
                    </div>
                    <p>
                        {isRunning
                            ? `Scanning market every ${config.interval_minutes} minutes`
                            : 'Enable agent to auto-trade stocks'}
                    </p>
                    {status?.stats?.last_run_at && (
                        <span className="last-run">
                            Last run:{' '}
                            {new Date(
                                status.stats.last_run_at
                            ).toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="status-actions">
                    {isRunning ? (
                        <motion.button
                            className="btn-stop"
                            onClick={handleStop}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            ⏸️ Stop Agent
                        </motion.button>
                    ) : (
                        <motion.button
                            className="btn-start"
                            onClick={handleStart}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={killSwitch}
                        >
                            ▶️ Start Agent
                        </motion.button>
                    )}
                    <motion.button
                        className="btn-emergency"
                        onClick={handleEmergencyStop}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        🚨 Emergency Stop
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            {stats && (
                <motion.div
                    className="stats-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-card">
                        <span className="stat-label">Total Trades</span>
                        <span className="stat-value">
                            {stats.total_trades || 0}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Today's Trades</span>
                        <span className="stat-value">
                            {stats.today_trades || 0}
                        </span>
                    </div>
                    <div className="stat-card buy">
                        <span className="stat-label">Buy Actions</span>
                        <span className="stat-value">
                            {stats.buy_count || 0}
                        </span>
                    </div>
                    <div className="stat-card sell">
                        <span className="stat-label">Sell Actions</span>
                        <span className="stat-value">
                            {stats.sell_count || 0}
                        </span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Rejected</span>
                        <span className="stat-value">
                            {stats.rejected_count || 0}
                        </span>
                    </div>
                    <div className="stat-card error">
                        <span className="stat-label">Errors</span>
                        <span className="stat-value">
                            {stats.error_count || 0}
                        </span>
                    </div>
                    <div className="stat-card pnl">
                        <span className="stat-label">Total P&L</span>
                        <span
                            className="stat-value"
                            style={{
                                color:
                                    (stats.total_pnl || 0) >= 0
                                        ? '#10b981'
                                        : '#ef4444',
                            }}
                        >
                            {(stats.total_pnl || 0) >= 0 ? '+' : ''}₹
                            {(stats.total_pnl || 0).toFixed(2)}
                        </span>
                    </div>
                    <div className="stat-card pnl">
                        <span className="stat-label">Win Rate</span>
                        <span className="stat-value">
                            {stats.win_rate || 0}%
                        </span>
                        <span className="stat-sub">
                            {stats.winning_trades || 0}W /{' '}
                            {stats.losing_trades || 0}L
                        </span>
                    </div>
                </motion.div>
            )}

            {/* 🏆 TOP PICKS — Best BUY stocks */}
            {topPicks.length > 0 && (
                <motion.div
                    className="top-picks-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.21 }}
                >
                    <div className="card-header">
                        <h3>🏆 Top Picks — Best BUY Stocks</h3>
                        <span className="picks-badge">
                            {topPicks.length} stocks
                        </span>
                    </div>
                    <p className="picks-hint">
                        Ranked by AI confidence + opportunity score + expected
                        return. These are the strongest BUY signals right now.
                    </p>

                    <div className="picks-list">
                        {topPicks.map((pick, i) => (
                            <motion.div
                                key={pick.symbol}
                                className="pick-row"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <div className="pick-rank">#{i + 1}</div>

                                <div className="pick-main">
                                    <div className="pick-symbol-box">
                                        <strong>{pick.symbol}</strong>
                                        <span>{pick.company_name}</span>
                                    </div>
                                    <div className="pick-price">
                                        ₹{pick.current_price}
                                        <span className="pick-target">
                                            → ₹{pick.target}
                                        </span>
                                    </div>
                                </div>

                                <div className="pick-metrics">
                                    <div className="pick-metric">
                                        <span>Confidence</span>
                                        <strong>{pick.confidence}%</strong>
                                    </div>
                                    <div className="pick-metric">
                                        <span>Opportunity</span>
                                        <strong>
                                            {pick.opportunity_score}/100
                                        </strong>
                                    </div>
                                    <div className="pick-metric">
                                        <span>Return</span>
                                        <strong>
                                            +{pick.expectedReturn}%
                                        </strong>
                                    </div>
                                    <div className="pick-metric">
                                        <span>Risk</span>
                                        <strong>{pick.risk_level}</strong>
                                    </div>
                                </div>

                                <div className="pick-timing">
                                    <span className="pick-timing-label">
                                        ⏰ Buy {pick.entryTime} · Hold{' '}
                                        {pick.holdingDays}d · Sell{' '}
                                        {pick.exitTime}
                                    </span>
                                </div>

                                <motion.button
                                    className="pick-trade-btn"
                                    onClick={() => handleManualTrade(pick)}
                                    disabled={tradingSymbol === pick.symbol}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {tradingSymbol === pick.symbol
                                        ? '⏳ Executing...'
                                        : `▶️ BUY ${pick.position_size} now`}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 🎯 AI SUGGESTIONS (Before Trade) */}
            {suggestions.length > 0 && (
                <motion.div
                    className="suggestions-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.23 }}
                >
                    <div className="card-header">
                        <h3>🎯 AI Suggestions — All Analyzed Stocks</h3>
                        <span className="suggestions-badge">
                            {suggestions.filter((s) => s.passesFilters).length}{' '}
                            pass ·{' '}
                            {
                                suggestions.filter((s) => !s.passesFilters)
                                    .length
                            }{' '}
                            filtered
                        </span>
                    </div>
                    <p className="suggestions-hint">
                        All top stocks checked by AI. Green = passes your
                        filters (agent will auto-trade). Grey = filtered out.
                        You can manually trade any stock.
                    </p>

                    {loadingSuggestions && (
                        <p className="loading-msg">
                            Loading AI suggestions...
                        </p>
                    )}

                    <div className="suggestions-list">
                        {suggestions.map((sug, i) => (
                            <motion.div
                                key={sug.symbol}
                                className={`suggestion-row ${
                                    sug.passesFilters ? 'pass' : 'fail'
                                } ${sug.decision.toLowerCase()}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="sug-header">
                                    <div className="sug-symbol-box">
                                        <strong>{sug.symbol}</strong>
                                        <span className="sug-company">
                                            {sug.company_name}
                                        </span>
                                    </div>
                                    <div className="sug-badges">
                                        <span
                                            className={`sug-signal ${sug.decision.toLowerCase()}`}
                                        >
                                            {sug.decision}
                                        </span>
                                        <span
                                            className={`sug-status ${
                                                sug.passesFilters
                                                    ? 'pass'
                                                    : 'fail'
                                            }`}
                                        >
                                            {sug.passesFilters
                                                ? '✓ Pass'
                                                : '✗ Filtered'}
                                        </span>
                                    </div>
                                </div>

                                <div className="sug-meta">
                                    <span>💰 ₹{sug.current_price}</span>
                                    <span>🎯 {sug.confidence}%</span>
                                    <span>⚠️ {sug.risk_level}</span>
                                    <span>⭐ {sug.opportunity_score}/100</span>
                                </div>

                                {sug.passesFilters ? (
                                    <>
                                        <div className="sug-timing">
                                            <div className="sug-time-box entry">
                                                <span>🟢 Buy</span>
                                                <strong>
                                                    {sug.entryTime}
                                                </strong>
                                            </div>
                                            <div className="sug-time-box hold">
                                                <span>⏳ Hold</span>
                                                <strong>
                                                    {sug.holdingDays} days
                                                </strong>
                                            </div>
                                            <div className="sug-time-box exit">
                                                <span>🔴 Sell</span>
                                                <strong>
                                                    {sug.exitTime}
                                                </strong>
                                            </div>
                                        </div>
                                        {sug.reasons.length > 0 && (
                                            <ul className="sug-reasons">
                                                {sug.reasons.map((r, idx) => (
                                                    <li key={idx}>{r}</li>
                                                ))}
                                            </ul>
                                        )}
                                        <motion.button
                                            className={`sug-trade-btn ${sug.decision.toLowerCase()}`}
                                            onClick={() =>
                                                handleManualTrade(sug)
                                            }
                                            disabled={
                                                tradingSymbol === sug.symbol
                                            }
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            {tradingSymbol === sug.symbol
                                                ? '⏳ Executing...'
                                                : `▶️ Trade Now (${sug.decision} ${sug.position_size})`}
                                        </motion.button>
                                    </>
                                ) : (
                                    <div className="sug-fail-reason">
                                        ❌ Rejected: {sug.failReason}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ⏰ Executed Trades Timing */}
            {timings.length > 0 && (
                <motion.div
                    className="timing-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="card-header">
                        <h3>⏰ Executed Trades — Timing</h3>
                        <span className="timing-badge">
                            {timings.length} signals
                        </span>
                    </div>

                    <div className="timing-list">
                        {timings.map((t, i) => (
                            <div
                                key={i}
                                className={`timing-row ${t.action.toLowerCase()}`}
                            >
                                <div className="timing-symbol">
                                    <strong>{t.symbol}</strong>
                                    <span
                                        className={`timing-action ${t.action.toLowerCase()}`}
                                    >
                                        {t.action}
                                    </span>
                                </div>

                                <div className="timing-times">
                                    <div className="time-box entry">
                                        <span className="time-icon">🟢</span>
                                        <span className="time-label">
                                            Buy at
                                        </span>
                                        <span className="time-value">
                                            {t.entryTime}
                                        </span>
                                    </div>
                                    <div className="time-box hold">
                                        <span className="time-icon">⏳</span>
                                        <span className="time-label">Hold</span>
                                        <span className="time-value">
                                            {t.holdingDays} days
                                        </span>
                                    </div>
                                    <div className="time-box exit">
                                        <span className="time-icon">🔴</span>
                                        <span className="time-label">
                                            Sell at
                                        </span>
                                        <span className="time-value">
                                            {t.exitTime}
                                        </span>
                                    </div>
                                </div>

                                <div className="timing-summary">
                                    {t.summary}
                                </div>

                                <div className="timing-confidence-bar">
                                    <div
                                        className="conf-fill"
                                        style={{
                                            width: `${t.timingConfidence}%`,
                                        }}
                                    />
                                    <span className="conf-text">
                                        {t.timingConfidence}% confidence
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Manual Run */}
            <motion.div
                className="run-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="card-header">
                    <h3>⚡ Manual Cycle</h3>
                    <motion.button
                        className="run-btn"
                        onClick={handleRunCycle}
                        disabled={running || !isRunning}
                        whileHover={{ scale: running ? 1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {running ? 'Running...' : '▶️ Run Cycle Now'}
                    </motion.button>
                </div>
                <p className="hint">
                    Runs one scan + trade cycle immediately (testing). Works
                    outside market hours for testing.
                </p>
                {!isRunning && (
                    <p className="hint" style={{ color: 'var(--warning)' }}>
                        ⚠️ Start the agent first to run cycles
                    </p>
                )}
            </motion.div>

            {/* Configuration */}
            <motion.div
                className="config-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h3>⚙️ Configuration</h3>
                <div className="config-grid">
                    <div className="config-item">
                        <label>Min Confidence (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.min_confidence}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    min_confidence: parseFloat(e.target.value),
                                })
                            }
                        />
                    </div>
                    <div className="config-item">
                        <label>Min Opportunity Score</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={config.min_opportunity_score}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    min_opportunity_score: parseFloat(
                                        e.target.value
                                    ),
                                })
                            }
                        />
                    </div>
                    <div className="config-item">
                        <label>Max Trades / Cycle</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={config.max_trades_per_cycle}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    max_trades_per_cycle: parseInt(
                                        e.target.value
                                    ),
                                })
                            }
                        />
                    </div>
                    <div className="config-item">
                        <label>Max Position Size (%)</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={config.max_position_pct * 100}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    max_position_pct:
                                        parseFloat(e.target.value) / 100,
                                })
                            }
                        />
                    </div>
                    <div className="config-item">
                        <label>Max Daily Trades</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={config.max_daily_trades}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    max_daily_trades: parseInt(e.target.value),
                                })
                            }
                        />
                    </div>
                    <div className="config-item">
                        <label>Max Daily Loss (%)</label>
                        <input
                            type="number"
                            min="0.5"
                            max="20"
                            step="0.5"
                            value={config.max_daily_loss_pct * 100}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    max_daily_loss_pct:
                                        parseFloat(e.target.value) / 100,
                                })
                            }
                        />
                    </div>
                    <div className="config-item">
                        <label>Interval (minutes)</label>
                        <input
                            type="number"
                            min="5"
                            max="120"
                            value={config.interval_minutes}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    interval_minutes: parseInt(
                                        e.target.value
                                    ),
                                })
                            }
                        />
                    </div>
                    <div className="config-item checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.market_hours_only}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        market_hours_only: e.target.checked,
                                    })
                                }
                            />
                            Market hours only
                        </label>
                    </div>
                    <div className="config-item checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.stop_trading_on_loss}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        stop_trading_on_loss:
                                            e.target.checked,
                                    })
                                }
                            />
                            Stop on daily loss limit
                        </label>
                    </div>
                </div>
                <motion.button
                    className="save-btn"
                    onClick={handleSaveConfig}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    💾 Save Configuration
                </motion.button>
            </motion.div>

            {/* Activity Log */}
            <motion.div
                className="logs-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <h3>📋 Activity Log</h3>
                {logs.length === 0 ? (
                    <p className="empty-msg">
                        No activity yet. Start the agent or run a cycle.
                    </p>
                ) : (
                    <div className="logs-list">
                        {logs.map((log, idx) => (
                            <motion.div
                                key={log.id || idx}
                                className={`log-item ${getActionColor(
                                    log.action
                                )}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <span
                                    className={`log-action ${getActionColor(
                                        log.action
                                    )}`}
                                >
                                    {log.action}
                                </span>
                                {log.symbol && (
                                    <span className="log-symbol">
                                        {log.symbol}
                                    </span>
                                )}
                                {log.quantity && (
                                    <span className="log-qty">
                                        × {log.quantity}
                                    </span>
                                )}
                                {log.price && (
                                    <span className="log-price">
                                        @ ₹{log.price}
                                    </span>
                                )}
                                {log.pnl !== null &&
                                    log.pnl !== undefined && (
                                        <span
                                            className="log-pnl"
                                            style={{
                                                color:
                                                    log.pnl >= 0
                                                        ? '#10b981'
                                                        : '#ef4444',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {log.pnl >= 0 ? '+' : ''}₹
                                            {parseFloat(log.pnl).toFixed(2)}
                                        </span>
                                    )}
                                {(log.action === 'BUY' ||
                                    log.action === 'SELL') &&
                                    log.symbol && (
                                        <span className="log-timing">
                                            {log.action === 'BUY'
                                                ? '⏰ Buy: 9:30–10:30 AM · Sell: 2:30–3:15 PM'
                                                : '⏰ Sell: 2:30–3:15 PM'}
                                        </span>
                                    )}
                                {log.reason && (
                                    <span className="log-reason">
                                        {log.reason}
                                    </span>
                                )}
                                <span className="log-time">
                                    {new Date(
                                        log.created_at
                                    ).toLocaleTimeString()}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default AutoTrading;