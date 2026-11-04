import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './PredictionHistory.css';

function PredictionHistory() {
    const [predictions, setPredictions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const toast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [predRes, statsRes] = await Promise.all([
                api.get('/predictions/history'),
                api.get('/predictions/stats'),
            ]);
            setPredictions(predRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch predictions:', err);
            toast.error('Failed to load predictions');
        } finally {
            setLoading(false);
        }
    };

    const filteredPredictions = predictions.filter(p => {
        if (filter === 'all') return true;
        if (filter === 'buy') return p.signal === 'BUY';
        if (filter === 'sell') return p.signal === 'SELL';
        if (filter === 'hold') return p.signal === 'HOLD';
        return true;
    });

    const getSignalClass = (signal) => {
        if (signal === 'BUY') return 'signal-buy';
        if (signal === 'SELL') return 'signal-sell';
        return 'signal-hold';
    };

    if (loading) return <div className="loading">Loading predictions...</div>;

    return (
        <div className="prediction-history">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>📊 Prediction History</h1>
                <p>Track all AI predictions and their performance</p>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <div className="pred-stats-grid">
                    <motion.div
                        className="pred-stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <span className="pred-stat-label">Total Predictions</span>
                        <span className="pred-stat-value">{stats.total_predictions || 0}</span>
                    </motion.div>
                    <motion.div
                        className="pred-stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <span className="pred-stat-label">Buy Signals</span>
                        <span className="pred-stat-value" style={{ color: '#10b981' }}>
                            {stats.buy_signals || 0}
                        </span>
                    </motion.div>
                    <motion.div
                        className="pred-stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="pred-stat-label">Sell Signals</span>
                        <span className="pred-stat-value" style={{ color: '#ef4444' }}>
                            {stats.sell_signals || 0}
                        </span>
                    </motion.div>
                    <motion.div
                        className="pred-stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <span className="pred-stat-label">Avg Confidence</span>
                        <span className="pred-stat-value">{stats.avg_confidence || 0}%</span>
                    </motion.div>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="pred-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({predictions.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'buy' ? 'active' : ''}`}
                    onClick={() => setFilter('buy')}
                >
                    BUY
                </button>
                <button
                    className={`filter-btn ${filter === 'sell' ? 'active' : ''}`}
                    onClick={() => setFilter('sell')}
                >
                    SELL
                </button>
                <button
                    className={`filter-btn ${filter === 'hold' ? 'active' : ''}`}
                    onClick={() => setFilter('hold')}
                >
                    HOLD
                </button>
            </div>

            {/* Predictions Table */}
            <motion.div
                className="predictions-table-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {filteredPredictions.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📊</span>
                        <p>No predictions yet</p>
                        <Link to="/" className="browse-btn">
                            Analyze Stocks
                        </Link>
                    </div>
                ) : (
                    <table className="predictions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Symbol</th>
                                <th>Predicted Price</th>
                                <th>Actual Price</th>
                                <th>Signal</th>
                                <th>Confidence</th>
                                <th>Risk</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPredictions.map((pred, idx) => {
                                const accuracy = pred.actual_price
                                    ? ((pred.actual_price - pred.predicted_price) / pred.predicted_price * 100).toFixed(2)
                                    : null;
                                
                                return (
                                    <motion.tr
                                        key={pred.id || idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                    >
                                        <td>{new Date(pred.created_at).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <Link to={`/stock/${pred.symbol}`} className="symbol-link">
                                                {pred.symbol}
                                            </Link>
                                        </td>
                                        <td>₹{parseFloat(pred.predicted_price).toFixed(2)}</td>
                                        <td>
                                            {pred.actual_price
                                                ? `₹${parseFloat(pred.actual_price).toFixed(2)}`
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={`signal-badge-sm ${getSignalClass(pred.signal)}`}>
                                                {pred.signal}
                                            </span>
                                        </td>
                                        <td>{pred.confidence_score}%</td>
                                        <td>
                                            <span className={`risk-badge-sm risk-${(pred.risk_level || '').toLowerCase()}`}>
                                                {pred.risk_level || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            {accuracy !== null ? (
                                                <span
                                                    className="accuracy-value"
                                                    style={{ color: parseFloat(accuracy) >= 0 ? '#10b981' : '#ef4444' }}
                                                >
                                                    {parseFloat(accuracy) >= 0 ? '+' : ''}{accuracy}%
                                                </span>
                                            ) : (
                                                <span className="pending-badge">Pending</span>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </div>
    );
}

export default PredictionHistory;