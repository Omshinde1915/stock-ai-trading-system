import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStockAnalysis } from '../services/api';
import './StockCard.css';

function StockCard({ stock, analysis: initialAnalysis, isAnalyzing: initialAnalyzing }) {
    const [analysis, setAnalysis] = useState(initialAnalysis);
    const [isAnalyzing, setIsAnalyzing] = useState(initialAnalyzing || false);
    const navigate = useNavigate();

    // Update when props change
    React.useEffect(() => {
        if (initialAnalysis) setAnalysis(initialAnalysis);
        if (initialAnalyzing !== undefined) setIsAnalyzing(initialAnalyzing);
    }, [initialAnalysis, initialAnalyzing]);

    const getSignalClass = (signal) => {
        if (signal === 'BUY') return 'signal-buy';
        if (signal === 'SELL') return 'signal-sell';
        return 'signal-hold';
    };

    const getRiskClass = (risk) => {
        if (risk === 'LOW') return 'risk-low';
        if (risk === 'MEDIUM') return 'risk-medium';
        return 'risk-high';
    };

    const getSignalIcon = (signal) => {
        if (signal === 'BUY') return '↑';
        if (signal === 'SELL') return '↓';
        return '→';
    };

    // Analyze on click
    const handleAnalyze = async () => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);
        try {
            const res = await getStockAnalysis(stock.symbol);
            setAnalysis(res.data);
        } catch (err) {
            console.error('Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <motion.div 
            className="stock-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -6 }}
            layout
        >
            <div className="stock-card-header">
                <div className="stock-title">
                    <h3>{stock.symbol}</h3>
                    <motion.span 
                        className="sector-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        {stock.sector}
                    </motion.span>
                </div>
            </div>
            
            <p className="company-name">{stock.company_name}</p>
            
            {isAnalyzing ? (
                <div className="analyzing-state">
                    <motion.div 
                        className="spinner"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Analyzing {stock.symbol}...
                    </motion.span>
                </div>
            ) : analysis ? (
                <>
                    <motion.div 
                        className="price-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="price-main">
                            <span className="currency">₹</span>
                            <span className="price-value">{analysis.current_price}</span>
                        </div>
                        <motion.div 
                            className={`signal-badge ${getSignalClass(analysis.decision)}`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <span className="signal-icon">{getSignalIcon(analysis.decision)}</span>
                            {analysis.decision}
                        </motion.div>
                    </motion.div>
                    
                    <div className="metrics-grid">
                        <div className="metric">
                            <span className="metric-label">Confidence</span>
                            <span className="metric-value">{analysis.confidence}%</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Risk</span>
                            <span className={`risk-badge ${getRiskClass(analysis.risk_level)}`}>
                                {analysis.risk_level}
                            </span>
                        </div>
                    </div>
                </>
            ) : (
                <button className="analyze-btn" onClick={handleAnalyze}>
                    <span className="analyze-icon">📊</span>
                    <span>Click to Analyze</span>
                </button>
            )}
            
            <Link to={`/stock/${stock.symbol}`} className="view-btn">
                View Details
                <span className="arrow">→</span>
            </Link>
        </motion.div>
    );
}

export default StockCard;