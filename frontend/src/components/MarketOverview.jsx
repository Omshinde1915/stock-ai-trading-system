import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './MarketOverview.css';

const API_BASE_URL = 'http://localhost:8000/api';

function MarketOverview() {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [marketOpen, setMarketOpen] = useState(false);

    // Check if market is open (IST)
    const checkMarketOpen = () => {
        const now = new Date();
        // Convert to IST
        const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const day = istTime.getDay(); // 0=Sunday, 6=Saturday
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
        const timeInMinutes = hours * 60 + minutes;

        const marketOpenTime = 9 * 60 + 15;   // 9:15 AM
        const marketCloseTime = 15 * 60 + 30; // 3:30 PM

        if (day === 0 || day === 6) return false; // Weekend
        return timeInMinutes >= marketOpenTime && timeInMinutes <= marketCloseTime;
    };

    useEffect(() => {
        // Check market status immediately
        setMarketOpen(checkMarketOpen());

        fetchIndices();

        // Update every 60 seconds
        const interval = setInterval(() => {
            setMarketOpen(checkMarketOpen());
            fetchIndices();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const fetchIndices = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stocks/market/indices`);
            setIndices(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch indices:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 100, damping: 15 },
        },
    };

    if (loading) {
        return (
            <div className="market-overview">
                <div className="market-header">
                    <h2>Market Overview</h2>
                </div>
                <div className="indices-grid">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="index-card skeleton">
                            <div className="skeleton-line skeleton-title"></div>
                            <div className="skeleton-line skeleton-price"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="market-overview"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="market-header">
                <div>
                    <h2>Market Overview</h2>
                    <p className="market-subtitle">Live Indian Market Indices</p>
                </div>

                {lastUpdated && (
                    <motion.div
                        className={`live-indicator ${marketOpen ? 'live' : 'closed'}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                    >
                        <span className={`live-dot ${marketOpen ? '' : 'closed'}`}></span>
                        {marketOpen
                            ? `Live · ${lastUpdated.toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })}`
                            : 'Market Closed'}
                    </motion.div>
                )}
            </div>

            <motion.div
                className="indices-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {indices.map((idx) => {
                    const isUp = idx.change_pct > 0;
                    const isDown = idx.change_pct < 0;
                    const cardClass = isUp ? 'up' : isDown ? 'down' : 'neutral';

                    return (
                        <motion.div
                            key={idx.symbol}
                            className={`index-card ${cardClass}`}
                            variants={itemVariants}
                            whileHover={{
                                y: -5,
                                scale: 1.02,
                                transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="index-header">
                                <span className="index-name">{idx.name}</span>
                                <motion.span
                                    className="index-trend"
                                    animate={{
                                        y: isUp ? [0, -3, 0] : isDown ? [0, 3, 0] : 0,
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatDelay: 2,
                                    }}
                                >
                                    {isUp ? '▲' : isDown ? '▼' : '▬'}
                                </motion.span>
                            </div>
                            <div className="index-price">
                                {formatNumber(idx.price)}
                            </div>
                            <div className="index-change">
                                <span className="change-value">
                                    {isUp ? '+' : ''}
                                    {formatNumber(idx.change)}
                                </span>
                                <span className="change-pct">
                                    ({isUp ? '+' : ''}
                                    {idx.change_pct.toFixed(2)}%)
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export default MarketOverview;