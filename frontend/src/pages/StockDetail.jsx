import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import {
    getStockAnalysis,
    getStockHistory,
    buyStock,
    sellStock,
    addToWatchlist,
} from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getTradeTiming } from '../utils/tradeTiming';
import ScheduleTradeForm from '../components/ScheduleTradeForm';
import StockInfo from '../components/StockInfo';
import './StockDetail.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Helper: first existing key from object
const pick = (obj, keys, fallback = null) => {
    if (!obj) return fallback;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
            return obj[k];
        }
    }
    return fallback;
};

// Helper: format number Indian style
const fmt = (num, digits = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return Number(num).toLocaleString('en-IN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

function StockDetail() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    const [analysis, setAnalysis] = useState(null);
    const [history, setHistory] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newsLoading, setNewsLoading] = useState(false);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchData();
        fetchNews();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [analysisRes, historyRes] = await Promise.all([
                getStockAnalysis(symbol),
                getStockHistory(symbol, 90),
            ]);
            setAnalysis(analysisRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            setError(
                err.response?.data?.detail || 'Failed to load stock data'
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchNews = async () => {
        setNewsLoading(true);
        try {
            const res = await api.get(`/news/?symbol=${symbol.toUpperCase()}`);
            setNews(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('News fetch failed:', err);
            setNews([]);
        } finally {
            setNewsLoading(false);
        }
    };

    const handleBuy = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            const res = await buyStock(symbol, parseInt(quantity));
            setMessage({ text: res.data.message, type: 'success' });
            toast.success(`Bought ${quantity} × ${symbol}`);
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Trade failed';
            setMessage({ text: msg, type: 'error' });
            toast.error(msg);
        }
    };

    const handleSell = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            const res = await sellStock(symbol, parseInt(quantity));
            setMessage({ text: res.data.message, type: 'success' });
            toast.success(`Sold ${quantity} × ${symbol}`);
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Trade failed';
            setMessage({ text: msg, type: 'error' });
            toast.error(msg);
        }
    };

    const handleWatchlist = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            await addToWatchlist(symbol);
            setMessage({
                text: `${symbol} added to watchlist!`,
                type: 'success',
            });
            toast.success(`${symbol} added to watchlist`);
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to add';
            setMessage({ text: msg, type: 'error' });
            toast.error(msg);
        }
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        return Math.floor(seconds / 86400) + 'd ago';
    };

    if (loading) {
        return (
            <div className="stock-detail">
                <div className="sd-loading">
                    <div className="sd-spinner"></div>
                    <p>Loading {symbol}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stock-detail">
                <button className="sd-back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="sd-error">
                    <span>⚠️</span>
                    <h3>Failed to Load</h3>
                    <p>{error}</p>
                    <button onClick={fetchData}>🔄 Retry</button>
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const timing = getTradeTiming(
        analysis.decision,
        analysis.confidence,
        analysis.risk_level,
        analysis.prediction?.expected_return_pct || 5
    );

    // ============ STOCK INFO ============
    const info = {
        open: pick(analysis, ['open', 'day_open', 'today_open']),
        high: pick(analysis, ['high', 'day_high', 'today_high']),
        low: pick(analysis, ['low', 'day_low', 'today_low']),
        prevClose: pick(analysis, [
            'prev_close',
            'previous_close',
            'prevClose',
        ]),
        volume: pick(analysis, ['volume', 'vol', 'day_volume']),
        week52High: pick(analysis, [
            'week_52_high',
            '52_week_high',
            'year_high',
            'high_52w',
        ]),
        week52Low: pick(analysis, [
            'week_52_low',
            '52_week_low',
            'year_low',
            'low_52w',
        ]),
        marketCap: pick(analysis, ['market_cap', 'mcap']),
        peRatio: pick(analysis, ['pe', 'pe_ratio']),
        faceValue: pick(analysis, ['face_value']),
        dividendYield: pick(analysis, ['dividend_yield', 'div_yield']),
    };

    const hasInfo =
        info.open ||
        info.high ||
        info.low ||
        info.week52High ||
        info.week52Low ||
        info.volume ||
        info.marketCap;

    // Range position bar
    let rangePercent = null;
    const dayHigh = info.high || analysis.current_price;
    const dayLow = info.low || analysis.current_price;
    if (dayHigh > dayLow) {
        const current = Number(analysis.current_price);
        rangePercent = ((current - dayLow) / (dayHigh - dayLow)) * 100;
        rangePercent = Math.max(0, Math.min(100, rangePercent));
    }

    // ============ 90-DAY HIGHS / LOWS ============
    const priceHighs = (() => {
        if (!history || history.length === 0) return null;
        const highs = history.map((h) => h.high || h.close);
        const lows = history.map((h) => h.low || h.close);
        const periodHigh = Math.max(...highs);
        const periodLow = Math.min(...lows);
        const periodHighDate =
            history[highs.indexOf(periodHigh)]?.date || '—';
        const periodLowDate = history[lows.indexOf(periodLow)]?.date || '—';
        const current = Number(analysis.current_price) || 0;
        const fromHigh = ((current - periodHigh) / periodHigh) * 100;
        const fromLow = ((current - periodLow) / periodLow) * 100;
        return {
            periodHigh,
            periodLow,
            periodHighDate,
            periodLowDate,
            fromHigh,
            fromLow,
            days: history.length,
        };
    })();

    const chartData = {
        labels: history.map((h) => h.date),
        datasets: [
            {
                label: `${symbol} Price`,
                data: history.map((h) => h.close),
                borderColor: '#1e3c72',
                backgroundColor: 'rgba(30, 60, 114, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `₹${ctx.parsed.y.toFixed(2)}`,
                },
            },
        },
        scales: {
            y: { ticks: { callback: (val) => `₹${val}` } },
        },
    };

    const signalClass =
        analysis.decision === 'BUY'
            ? 'buy'
            : analysis.decision === 'SELL'
            ? 'sell'
            : 'hold';

    const firstPrice = history[0]?.close || analysis.current_price;
    const lastPrice =
        history[history.length - 1]?.close || analysis.current_price;
    const priceChange = lastPrice - firstPrice;
    const priceChangePct = (priceChange / firstPrice) * 100;

    return (
        <div className="stock-detail">
            <button className="sd-back-btn" onClick={() => navigate(-1)}>
                ← Back
            </button>

            <AnimatePresence>
                {message.text && (
                    <motion.div
                        className={`sd-alert sd-alert-${message.type}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============ HEADER ============ */}
            <motion.div
                className="sd-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="sd-header-left">
                    <div className="sd-title-row">
                        <h1>{symbol}</h1>
                        <span className={`sd-signal ${signalClass}`}>
                            {analysis.decision}
                        </span>
                    </div>
                    <p className="sd-company">
                        {analysis.company_name || symbol}
                    </p>
                    <div className="sd-price-row">
                        <span className="sd-price">
                            ₹{analysis.current_price}
                        </span>
                        <span
                            className={`sd-change ${
                                priceChange >= 0 ? 'up' : 'down'
                            }`}
                        >
                            {priceChange >= 0 ? '+' : ''}
                            ₹{priceChange.toFixed(2)} (
                            {priceChangePct.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {isAuthenticated && (
                    <button
                        className="sd-watch-btn"
                        onClick={handleWatchlist}
                    >
                        ⭐ Add to Watchlist
                    </button>
                )}
            </motion.div>

            {/* ============ TABS ============ */}
            <div className="sd-tabs">
                <button
                    className={`sd-tab ${
                        activeTab === 'overview' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`sd-tab ${
                        activeTab === 'news' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('news')}
                >
                    📰 News ({news.length})
                </button>
                <button
                    className={`sd-tab ${
                        activeTab === 'trade' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('trade')}
                >
                    💰 Trade
                </button>
                <button
                    className={`sd-tab ${
                        activeTab === 'schedule' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('schedule')}
                >
                    ⏰ Schedule
                </button>
            </div>

                       {/* ============ OVERVIEW TAB ============ */}
            {activeTab === 'overview' && (
                <>
                    {/* 🏢 Company Information */}
                    <StockInfo symbol={symbol} />

                    {/* 📅 TODAY'S TRADING DATA */}
                    {hasInfo && (
                        <motion.div
                            className="sd-info-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <h3>📅 Today's Trading Data</h3>

                            {/* Range bar */}
                            {rangePercent !== null && (
                                <div className="sd-range-bar-wrap">
                                    <div className="sd-range-labels">
                                        <span className="sd-range-low">
                                            ₹{fmt(dayLow)}
                                        </span>
                                        <span className="sd-range-current">
                                            Current ₹
                                            {fmt(analysis.current_price)}
                                        </span>
                                        <span className="sd-range-high">
                                            ₹{fmt(dayHigh)}
                                        </span>
                                    </div>
                                    <div className="sd-range-bar">
                                        <div
                                            className="sd-range-fill"
                                            style={{
                                                width: `${rangePercent}%`,
                                            }}
                                        />
                                        <div
                                            className="sd-range-marker"
                                            style={{
                                                left: `${rangePercent}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="sd-range-caption">
                                        Today's Range · Position{' '}
                                        {rangePercent.toFixed(1)}%
                                    </div>
                                </div>
                            )}

                            {/* Info grid */}
                            <div className="sd-info-grid">
                                {info.open !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Open
                                        </span>
                                        <span className="sd-info-value">
                                            ₹{fmt(info.open)}
                                        </span>
                                    </div>
                                )}
                                {info.high !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Day High
                                        </span>
                                        <span className="sd-info-value sd-up">
                                            ₹{fmt(info.high)}
                                        </span>
                                    </div>
                                )}
                                {info.low !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Day Low
                                        </span>
                                        <span className="sd-info-value sd-down">
                                            ₹{fmt(info.low)}
                                        </span>
                                    </div>
                                )}
                                {info.prevClose !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Prev Close
                                        </span>
                                        <span className="sd-info-value">
                                            ₹{fmt(info.prevClose)}
                                        </span>
                                    </div>
                                )}
                                {info.volume !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Volume
                                        </span>
                                        <span className="sd-info-value">
                                            {fmt(info.volume, 0)}
                                        </span>
                                    </div>
                                )}
                                {info.week52High !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            52W High
                                        </span>
                                        <span className="sd-info-value sd-up">
                                            ₹{fmt(info.week52High)}
                                        </span>
                                    </div>
                                )}
                                {info.week52Low !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            52W Low
                                        </span>
                                        <span className="sd-info-value sd-down">
                                            ₹{fmt(info.week52Low)}
                                        </span>
                                    </div>
                                )}
                                {info.marketCap !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Market Cap
                                        </span>
                                        <span className="sd-info-value">
                                            ₹{fmt(info.marketCap, 0)}
                                        </span>
                                    </div>
                                )}
                                {info.peRatio !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            P/E Ratio
                                        </span>
                                        <span className="sd-info-value">
                                            {fmt(info.peRatio)}
                                        </span>
                                    </div>
                                )}
                                {info.faceValue !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Face Value
                                        </span>
                                        <span className="sd-info-value">
                                            ₹{fmt(info.faceValue)}
                                        </span>
                                    </div>
                                )}
                                {info.dividendYield !== null && (
                                    <div className="sd-info-item">
                                        <span className="sd-info-label">
                                            Div Yield
                                        </span>
                                        <span className="sd-info-value">
                                            {fmt(info.dividendYield)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 🔺 90-Day Highs & Lows */}
                            {priceHighs && (
                                <div className="sd-highs-wrap">
                                    <h4 className="sd-highs-title">
                                        🔺 {priceHighs.days}-Day Highs & Lows
                                    </h4>
                                    <div className="sd-highs-grid">
                                        <div className="sd-high-box high">
                                            <span className="sd-high-label">
                                                Highest ({priceHighs.days}d)
                                            </span>
                                            <span className="sd-high-value">
                                                ₹
                                                {fmt(
                                                    priceHighs.periodHigh
                                                )}
                                            </span>
                                            <span className="sd-high-date">
                                                📅{' '}
                                                {priceHighs.periodHighDate}
                                            </span>
                                            <span className="sd-high-diff down">
                                                {priceHighs.fromHigh.toFixed(
                                                    2
                                                )}
                                                % from high
                                            </span>
                                        </div>
                                        <div className="sd-high-box low">
                                            <span className="sd-high-label">
                                                Lowest ({priceHighs.days}d)
                                            </span>
                                            <span className="sd-high-value">
                                                ₹{fmt(priceHighs.periodLow)}
                                            </span>
                                            <span className="sd-high-date">
                                                📅 {priceHighs.periodLowDate}
                                            </span>
                                            <span className="sd-high-diff up">
                                                +
                                                {priceHighs.fromLow.toFixed(
                                                    2
                                                )}
                                                % from low
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Metrics Grid */}
                    <div className="sd-metrics-grid">
                        <div className="sd-metric-card">
                            <span className="sd-metric-label">
                                Confidence
                            </span>
                            <span className="sd-metric-value">
                                {analysis.confidence}%
                            </span>
                        </div>
                        <div className="sd-metric-card">
                            <span className="sd-metric-label">Risk</span>
                            <span
                                className={`sd-risk-badge risk-${(
                                    analysis.risk_level || 'medium'
                                ).toLowerCase()}`}
                            >
                                {analysis.risk_level}
                            </span>
                        </div>
                        <div className="sd-metric-card">
                            <span className="sd-metric-label">
                                Opportunity
                            </span>
                            <span className="sd-metric-value">
                                {analysis.opportunity_score}/100
                            </span>
                        </div>
                        <div className="sd-metric-card">
                            <span className="sd-metric-label">Target</span>
                            <span className="sd-metric-value">
                                ₹{analysis.target}
                            </span>
                        </div>
                        <div className="sd-metric-card">
                            <span className="sd-metric-label">
                                Stop Loss
                            </span>
                            <span className="sd-metric-value sd-stop">
                                ₹{analysis.stop_loss}
                            </span>
                        </div>
                        <div className="sd-metric-card">
                            <span className="sd-metric-label">
                                Position Size
                            </span>
                            <span className="sd-metric-value">
                                {analysis.position_size || 1} shares
                            </span>
                        </div>
                    </div>

                    {/* ⏰ Trade Timing */}
                    <motion.div
                        className="sd-timing-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3>⏰ AI Trade Timing</h3>
                        <div className="sd-timing-grid">
                            <div className="sd-timing-box entry">
                                <span className="sd-t-icon">🟢</span>
                                <span className="sd-t-label">Buy at</span>
                                <span className="sd-t-value">
                                    {timing.entryTime}
                                </span>
                                <span className="sd-t-date">
                                    📅 {timing.entryDate}
                                </span>
                            </div>
                            <div className="sd-timing-arrow">→</div>
                            <div className="sd-timing-box hold">
                                <span className="sd-t-icon">⏳</span>
                                <span className="sd-t-label">Hold</span>
                                <span className="sd-t-value">
                                    {timing.holdingDays} days
                                </span>
                                <span className="sd-t-date">
                                    Short-term swing
                                </span>
                            </div>
                            <div className="sd-timing-arrow">→</div>
                            <div className="sd-timing-box exit">
                                <span className="sd-t-icon">🔴</span>
                                <span className="sd-t-label">Sell at</span>
                                <span className="sd-t-value">
                                    {timing.exitTime}
                                </span>
                                <span className="sd-t-date">
                                    📅 {timing.exitDate}
                                </span>
                            </div>
                        </div>
                        <div className="sd-timing-summary">
                            {timing.summary}
                        </div>
                    </motion.div>

                    {/* Chart */}
                    <motion.div
                        className="sd-chart-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <h3>📈 Price Chart (Last 90 days)</h3>
                        <div className="sd-chart-wrapper">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </motion.div>

                    {/* Why? Reasons */}
                    {analysis.reasons && analysis.reasons.length > 0 && (
                        <motion.div
                            className="sd-reasons-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3>💡 Why {analysis.decision}?</h3>
                            <ul className="sd-reasons-list">
                                {analysis.reasons.map((reason, i) => (
                                    <li key={i}>
                                        <span className="sd-check">✓</span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* ML Prediction */}
                    {analysis.prediction && (
                        <motion.div
                            className="sd-prediction-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <h3>🤖 ML Prediction</h3>
                            <div className="sd-pred-grid">
                                <div className="sd-pred-item">
                                    <span className="sd-pred-label">
                                        Expected Return
                                    </span>
                                    <span className="sd-pred-value sd-positive">
                                        +
                                        {
                                            analysis.prediction
                                                .expected_return_pct
                                        }
                                        %
                                    </span>
                                </div>
                                <div className="sd-pred-item">
                                    <span className="sd-pred-label">
                                        Predicted Price
                                    </span>
                                    <span className="sd-pred-value">
                                        ₹
                                        {
                                            analysis.prediction
                                                .predicted_price
                                        }
                                    </span>
                                </div>
                                <div className="sd-pred-item">
                                    <span className="sd-pred-label">
                                        Model
                                    </span>
                                    <span className="sd-pred-value">
                                        {analysis.prediction.model_used}
                                    </span>
                                </div>
                                {analysis.prediction
                                    .test_directional_accuracy && (
                                    <div className="sd-pred-item">
                                        <span className="sd-pred-label">
                                            Model Accuracy
                                        </span>
                                        <span className="sd-pred-value">
                                            {
                                                analysis.prediction
                                                    .test_directional_accuracy
                                            }
                                            %
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </>
            )}

            {/* ============ NEWS TAB ============ */}
            {activeTab === 'news' && (
                <motion.div
                    className="sd-news-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {newsLoading && (
                        <div className="sd-news-loading">
                            <div className="sd-spinner"></div>
                            <p>Loading news for {symbol}...</p>
                        </div>
                    )}

                    {!newsLoading && news.length === 0 && (
                        <div className="sd-news-empty">
                            <span>📰</span>
                            <h3>No news for {symbol}</h3>
                            <p>
                                No recent news found for this stock. Try
                                checking other stocks.
                            </p>
                            <Link
                                to="/news"
                                className="sd-news-browse-btn"
                            >
                                Browse All News →
                            </Link>
                        </div>
                    )}

                    {!newsLoading && news.length > 0 && (
                        <div className="sd-news-list">
                            {news.map((item, idx) => (
                                <motion.div
                                    key={item.id || idx}
                                    className="sd-news-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className="sd-news-header">
                                        <span
                                            className={`sd-news-sentiment ${
                                                item.sentiment?.toLowerCase() ||
                                                'neutral'
                                            }`}
                                        >
                                            {item.sentiment === 'POSITIVE'
                                                ? '📈'
                                                : item.sentiment ===
                                                  'NEGATIVE'
                                                ? '📉'
                                                : '➡️'}{' '}
                                            {item.sentiment}
                                        </span>
                                        <span className="sd-news-time">
                                            {timeAgo(item.published_at)}
                                        </span>
                                    </div>
                                    <h4 className="sd-news-title">
                                        {item.title}
                                    </h4>
                                    <p className="sd-news-desc">
                                        {item.description}
                                    </p>
                                    <div className="sd-news-footer">
                                        <span className="sd-news-source">
                                            📰 {item.source}
                                        </span>
                                        {item.url && item.url !== '#' && (
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="sd-news-read"
                                            >
                                                Read Full →
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* ============ TRADE TAB ============ */}
            {activeTab === 'trade' && (
                <motion.div
                    className="sd-trade-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {!isAuthenticated ? (
                        <div className="sd-trade-login">
                            <span>🔒</span>
                            <h3>Login Required</h3>
                            <p>
                                Sign in to buy or sell {symbol} shares.
                            </p>
                            <Link to="/login" className="sd-login-btn">
                                Sign In →
                            </Link>
                        </div>
                    ) : (
                        <div className="sd-trade-card">
                            <h3>💰 Trade {symbol}</h3>
                            <p className="sd-trade-price">
                                Current Price: <b>₹{analysis.current_price}</b>
                            </p>

                            <div className="sd-trade-form">
                                <label>Quantity</label>
                                <div className="sd-qty-input">
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(
                                                    1,
                                                    parseInt(quantity) - 1
                                                )
                                            )
                                        }
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) =>
                                            setQuantity(e.target.value)
                                        }
                                    />
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                parseInt(quantity) + 1
                                            )
                                        }
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="sd-trade-total">
                                    <span>Estimated Total</span>
                                    <strong>
                                        ₹
                                        {(
                                            analysis.current_price *
                                            (parseInt(quantity) || 0)
                                        ).toLocaleString('en-IN')}
                                    </strong>
                                </div>

                                <div className="sd-trade-buttons">
                                    <motion.button
                                        className="sd-btn-buy"
                                        onClick={handleBuy}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        🟢 BUY {quantity} @ ₹
                                        {analysis.current_price}
                                    </motion.button>
                                    <motion.button
                                        className="sd-btn-sell"
                                        onClick={handleSell}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        🔴 SELL {quantity} @ ₹
                                        {analysis.current_price}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ============ SCHEDULE TAB ============ */}
            {activeTab === 'schedule' && (
                <motion.div
                    className="sd-schedule-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <ScheduleTradeForm
                        symbol={symbol}
                        analysis={analysis}
                        timing={timing}
                    />
                </motion.div>
            )}
        </div>
    );
}

export default StockDetail;