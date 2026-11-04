import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './MarketMovers.css';

const API_BASE_URL = 'http://localhost:8000/api';

function MarketMovers() {
    const [data, setData] = useState({ gainers: [], losers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovers();
        const interval = setInterval(fetchMovers, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchMovers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stocks/market/movers`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch movers:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="market-movers">
                <div className="movers-column">
                    <h3>Top Gainers</h3>
                    <div className="loading-msg">Loading...</div>
                </div>
                <div className="movers-column">
                    <h3>Top Losers</h3>
                    <div className="loading-msg">Loading...</div>
                </div>
            </div>
        );
    }

    const renderStock = (stock, index, isGainer) => (
        <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, x: isGainer ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="mover-item"
        >
            <Link to={`/stock/${stock.symbol}`} className="mover-link">
                <div className="mover-info">
                    <span className="mover-symbol">{stock.symbol}</span>
                    <span className="mover-price">₹{stock.price}</span>
                </div>
                <span className={`mover-change ${isGainer ? 'up' : 'down'}`}>
                    {isGainer ? '▲' : '▼'} {Math.abs(stock.change_pct)}%
                </span>
            </Link>
        </motion.div>
    );

    return (
        <div className="market-movers">
            <div className="movers-column">
                <div className="movers-header">
                    <h3>🚀 Top Gainers</h3>
                    <span className="movers-badge up">▲</span>
                </div>
                <div className="movers-list">
                    {data.gainers.map((s, i) => renderStock(s, i, true))}
                </div>
            </div>
            
            <div className="movers-column">
                <div className="movers-header">
                    <h3>📉 Top Losers</h3>
                    <span className="movers-badge down">▼</span>
                </div>
                <div className="movers-list">
                    {data.losers.map((s, i) => renderStock(s, i, false))}
                </div>
            </div>
        </div>
    );
}

export default MarketMovers;