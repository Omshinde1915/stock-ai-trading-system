import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPortfolio, getTransactions, sellStock } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import PortfolioCharts from '../components/PortfolioCharts';
import './Portfolio.css';

function Portfolio() {
    const [portfolio, setPortfolio] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Sell Modal State
    const [sellModal, setSellModal] = useState(null);
    const [sellQty, setSellQty] = useState(1);
    const [selling, setSelling] = useState(false);

    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        
        try {
            const portfolioRes = await getPortfolio();
            setPortfolio(portfolioRes.data);
        } catch (err) {
            console.error('Portfolio fetch error:', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to load portfolio';
            setError(errorMsg);
        }
        
        try {
            const transactionsRes = await getTransactions();
            setTransactions(transactionsRes.data);
        } catch (err) {
            console.error('Transactions fetch error:', err);
            setTransactions([]);
        }
        
        setLoading(false);
    };

    const openSellModal = (holding) => {
        setSellModal(holding);
        setSellQty(1);
    };

    const closeSellModal = () => {
        setSellModal(null);
        setSellQty(1);
    };

    const handleSell = async () => {
        if (!sellModal) return;

        const qty = parseInt(sellQty);
        if (qty < 1 || qty > sellModal.quantity) {
            setMessage({ type: 'error', text: `Quantity must be between 1 and ${sellModal.quantity}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return;
        }

        setSelling(true);
        try {
            const res = await sellStock(sellModal.symbol, qty);
            setMessage({
                type: 'success',
                text: `✅ Sold ${qty} shares of ${sellModal.symbol} at ₹${sellModal.current_price}`
            });
            closeSellModal();
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.detail || 'Sell failed'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } finally {
            setSelling(false);
        }
    };

    const handleSellAll = async (holding) => {
        if (!window.confirm(`Sell ALL ${holding.quantity} shares of ${holding.symbol}?`)) return;

        setSelling(true);
        try {
            await sellStock(holding.symbol, holding.quantity);
            setMessage({
                type: 'success',
                text: `✅ Sold all ${holding.quantity} shares of ${holding.symbol}`
            });
            fetchData();
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.detail || 'Sell failed'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } finally {
            setSelling(false);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="portfolio">
                <BackButton label="Back" />
                <div className="loading-state">
                    <div className="spinner-large"></div>
                    <p>Loading portfolio...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="portfolio">
                <BackButton label="Back" />
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <h2>Failed to Load Portfolio</h2>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={fetchData}>
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

    // No Portfolio Data
    if (!portfolio) {
        return (
            <div className="portfolio">
                <BackButton label="Back" />
                <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <h2>No Portfolio Data</h2>
                    <p>Start trading to see your portfolio!</p>
                    <button className="browse-btn" onClick={() => navigate('/')}>
                        Browse Stocks
                    </button>
                </div>
            </div>
        );
    }

    const pnlColor = portfolio.total_pnl >= 0 ? '#10b981' : '#ef4444';

    return (
        <div className="portfolio">
            <BackButton label="Back" />

            {/* Header */}
            <div className="portfolio-header">
                <div>
                    <h1>My Portfolio</h1>
                    <p className="portfolio-subtitle">Track your holdings and sell stocks</p>
                </div>
                <button
                    className="browse-btn"
                    onClick={() => navigate('/')}
                >
                    + Buy More Stocks
                </button>
            </div>

            {/* Alert Message */}
            <AnimatePresence>
                {message.text && (
                    <motion.div
                        className={`alert alert-${message.type}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Charts */}
            <PortfolioCharts portfolio={portfolio} />

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <span className="summary-label">Total Value</span>
                    <span className="summary-value">
                        ₹{portfolio.total_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Cash Balance</span>
                    <span className="summary-value">
                        ₹{portfolio.cash_balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Investment</span>
                    <span className="summary-value">
                        ₹{portfolio.total_investment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total P&L</span>
                    <span className="summary-value" style={{ color: pnlColor }}>
                        {portfolio.total_pnl >= 0 ? '+' : ''}₹
                        {portfolio.total_pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="summary-sub" style={{ color: pnlColor }}>
                        ({portfolio.total_pnl_pct >= 0 ? '+' : ''}{portfolio.total_pnl_pct}%)
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Holdings</span>
                    <span className="summary-value">{portfolio.holdings_count}</span>
                </div>
            </div>

            {/* Holdings Table */}
            <div className="section-container">
                <div className="section-header">
                    <h2>📊 My Holdings</h2>
                    <span className="section-hint">
                        {portfolio.holdings.length > 0 ? 'Click SELL to exit position' : ''}
                    </span>
                </div>

                {portfolio.holdings.length === 0 ? (
                    <div className="empty-state-portfolio">
                        <span className="empty-icon">📭</span>
                        <p>No holdings yet</p>
                        <button
                            className="browse-btn-inline"
                            onClick={() => navigate('/')}
                        >
                            Browse Stocks to Buy
                        </button>
                    </div>
                ) : (
                    <div className="holdings-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Quantity</th>
                                    <th>Buy Price</th>
                                    <th>Current Price</th>
                                    <th>Value</th>
                                    <th>P&L</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {portfolio.holdings.map((h, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="holding-row"
                                    >
                                        <td>
                                            <div className="stock-cell">
                                                <strong className="stock-symbol">{h.symbol}</strong>
                                                <span className="stock-name">{h.company_name}</span>
                                            </div>
                                        </td>
                                        <td><span className="qty-badge">{h.quantity}</span></td>
                                        <td>₹{h.average_price.toFixed(2)}</td>
                                        <td><strong>₹{h.current_price.toFixed(2)}</strong></td>
                                        <td>₹{h.current_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                        <td>
                                            <div className="pnl-cell">
                                                <span
                                                    className="pnl-value"
                                                    style={{ color: h.pnl >= 0 ? '#10b981' : '#ef4444' }}
                                                >
                                                    {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toFixed(2)}
                                                </span>
                                                <span
                                                    className="pnl-pct"
                                                    style={{ color: h.pnl_pct >= 0 ? '#10b981' : '#ef4444' }}
                                                >
                                                    ({h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <motion.button
                                                    className="btn-sell-small"
                                                    onClick={() => openSellModal(h)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    SELL
                                                </motion.button>
                                                <motion.button
                                                    className="btn-sell-all"
                                                    onClick={() => handleSellAll(h)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    title="Sell all shares"
                                                >
                                                    ALL
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transactions */}
            <div className="section-container">
                <h2>📜 Transaction History</h2>
                {transactions.length === 0 ? (
                    <p className="empty-msg">No transactions yet.</p>
                ) : (
                    <div className="holdings-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Symbol</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t, i) => (
                                    <tr key={i}>
                                        <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                                        <td><strong>{t.symbol}</strong></td>
                                        <td>
                                            <span className={`tx-type ${t.type.toLowerCase()}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td>{t.quantity}</td>
                                        <td>₹{t.price.toFixed(2)}</td>
                                        <td>₹{t.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sell Modal */}
            <AnimatePresence>
                {sellModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSellModal}
                    >
                        <motion.div
                            className="sell-modal"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="modal-close" onClick={closeSellModal}>✕</button>

                            <div className="modal-header">
                                <h3>💰 Sell {sellModal.symbol}</h3>
                                <p className="modal-subtitle">{sellModal.company_name}</p>
                            </div>

                            <div className="sell-info">
                                <div className="info-row">
                                    <span>Current Price</span>
                                    <strong>₹{sellModal.current_price.toFixed(2)}</strong>
                                </div>
                                <div className="info-row">
                                    <span>You Own</span>
                                    <strong>{sellModal.quantity} shares</strong>
                                </div>
                                <div className="info-row">
                                    <span>Avg Buy Price</span>
                                    <strong>₹{sellModal.average_price.toFixed(2)}</strong>
                                </div>
                                <div className="info-row pnl-row">
                                    <span>Current P&L</span>
                                    <strong style={{ color: sellModal.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                                        {sellModal.pnl >= 0 ? '+' : ''}₹{sellModal.pnl.toFixed(2)}
                                    </strong>
                                </div>
                            </div>

                            <div className="sell-form">
                                <label>Quantity to Sell</label>
                                <div className="qty-input-wrapper">
                                    <button
                                        className="qty-btn"
                                        onClick={() => setSellQty(Math.max(1, sellQty - 1))}
                                    >−</button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={sellModal.quantity}
                                        value={sellQty}
                                        onChange={(e) => setSellQty(e.target.value)}
                                    />
                                    <button
                                        className="qty-btn"
                                        onClick={() => setSellQty(Math.min(sellModal.quantity, parseInt(sellQty) + 1))}
                                    >+</button>
                                    <button
                                        className="qty-max"
                                        onClick={() => setSellQty(sellModal.quantity)}
                                    >MAX</button>
                                </div>

                                <div className="estimated-proceeds">
                                    <span>Estimated Proceeds</span>
                                    <strong>₹{(sellModal.current_price * sellQty).toFixed(2)}</strong>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={closeSellModal}
                                    disabled={selling}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    className="btn-confirm-sell"
                                    onClick={handleSell}
                                    disabled={selling}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {selling ? 'Selling...' : `Sell ${sellQty} Shares`}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Portfolio;