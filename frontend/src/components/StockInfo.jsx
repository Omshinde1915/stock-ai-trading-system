import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import './StockInfo.css';

const fmt = (num, digits = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return Number(num).toLocaleString('en-IN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

const fmtBig = (num) => {
    if (!num) return '—';
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
    if (num >= 1e3) return `₹${(num / 1e3).toFixed(2)} K`;
    return `₹${num.toFixed(0)}`;
};

function StockInfo({ symbol }) {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [descExpanded, setDescExpanded] = useState(false);

    useEffect(() => {
        fetchInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    const fetchInfo = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/stocks/${symbol}/info`);
            if (res.data?.error) {
                setError(res.data.error);
            } else {
                setInfo(res.data);
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                    'Failed to load company info'
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="stock-info-card">
                <h3>🏢 Company Information</h3>
                <div className="si-loading">
                    <div className="si-spinner"></div>
                    <p>Loading company info...</p>
                </div>
            </div>
        );
    }

    if (error || !info) {
        return (
            <div className="stock-info-card">
                <h3>🏢 Company Information</h3>
                <p className="si-error">⚠️ {error || 'Info not available'}</p>
            </div>
        );
    }

    return (
        <motion.div
            className="stock-info-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h3>🏢 Company Information</h3>

            {/* Company header */}
            <div className="si-header">
                <div className="si-header-left">
                    <h2>{info.company_name || symbol}</h2>
                    <div className="si-tags">
                        {info.sector && (
                            <span className="si-tag sector">
                                {info.sector}
                            </span>
                        )}
                        {info.industry && (
                            <span className="si-tag industry">
                                {info.industry}
                            </span>
                        )}
                        {info.country && (
                            <span className="si-tag country">
                                🌍 {info.country}
                            </span>
                        )}
                    </div>
                </div>
                {info.website && (
                    <a
                        href={info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="si-website-btn"
                    >
                        🌐 Website
                    </a>
                )}
            </div>

            {/* Description */}
            {info.description && (
                <div className="si-description">
                    <p
                        className={
                            descExpanded ? 'expanded' : 'collapsed'
                        }
                    >
                        {info.description}
                    </p>
                    <button
                        className="si-read-more"
                        onClick={() => setDescExpanded(!descExpanded)}
                    >
                        {descExpanded ? 'Show Less ▲' : 'Read More ▼'}
                    </button>
                </div>
            )}

            {/* Key metrics */}
            <div className="si-section">
                <h4>💼 Key Metrics</h4>
                <div className="si-metrics">
                    {info.market_cap && (
                        <div className="si-metric">
                            <span>Market Cap</span>
                            <strong>{fmtBig(info.market_cap)}</strong>
                        </div>
                    )}
                    {info.pe_ratio && (
                        <div className="si-metric">
                            <span>P/E Ratio</span>
                            <strong>{fmt(info.pe_ratio)}</strong>
                        </div>
                    )}
                    {info.pb_ratio && (
                        <div className="si-metric">
                            <span>P/B Ratio</span>
                            <strong>{fmt(info.pb_ratio)}</strong>
                        </div>
                    )}
                    {info.eps && (
                        <div className="si-metric">
                            <span>EPS</span>
                            <strong>₹{fmt(info.eps)}</strong>
                        </div>
                    )}
                    {info.dividend_yield && (
                        <div className="si-metric">
                            <span>Div Yield</span>
                            <strong>
                                {fmt(info.dividend_yield * 100)}%
                            </strong>
                        </div>
                    )}
                    {info.beta && (
                        <div className="si-metric">
                            <span>Beta</span>
                            <strong>{fmt(info.beta)}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Financials */}
            {(info.revenue ||
                info.profit_margin ||
                info.roe ||
                info.debt_to_equity) && (
                <div className="si-section">
                    <h4>📊 Financials</h4>
                    <div className="si-metrics">
                        {info.revenue && (
                            <div className="si-metric">
                                <span>Revenue</span>
                                <strong>{fmtBig(info.revenue)}</strong>
                            </div>
                        )}
                        {info.profit_margin && (
                            <div className="si-metric">
                                <span>Profit Margin</span>
                                <strong>
                                    {fmt(info.profit_margin * 100)}%
                                </strong>
                            </div>
                        )}
                        {info.roe && (
                            <div className="si-metric">
                                <span>ROE</span>
                                <strong>{fmt(info.roe * 100)}%</strong>
                            </div>
                        )}
                        {info.roa && (
                            <div className="si-metric">
                                <span>ROA</span>
                                <strong>{fmt(info.roa * 100)}%</strong>
                            </div>
                        )}
                        {info.debt_to_equity && (
                            <div className="si-metric">
                                <span>Debt/Equity</span>
                                <strong>
                                    {fmt(info.debt_to_equity)}
                                </strong>
                            </div>
                        )}
                        {info.current_ratio && (
                            <div className="si-metric">
                                <span>Current Ratio</span>
                                <strong>
                                    {fmt(info.current_ratio)}
                                </strong>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Trading ranges */}
            {(info.week_52_high ||
                info.week_52_low ||
                info.day_50_avg ||
                info.day_200_avg) && (
                <div className="si-section">
                    <h4>📈 Trading Ranges</h4>
                    <div className="si-metrics">
                        {info.week_52_high && (
                            <div className="si-metric">
                                <span>52W High</span>
                                <strong className="si-up">
                                    ₹{fmt(info.week_52_high)}
                                </strong>
                            </div>
                        )}
                        {info.week_52_low && (
                            <div className="si-metric">
                                <span>52W Low</span>
                                <strong className="si-down">
                                    ₹{fmt(info.week_52_low)}
                                </strong>
                            </div>
                        )}
                        {info.day_50_avg && (
                            <div className="si-metric">
                                <span>50D Avg</span>
                                <strong>₹{fmt(info.day_50_avg)}</strong>
                            </div>
                        )}
                        {info.day_200_avg && (
                            <div className="si-metric">
                                <span>200D Avg</span>
                                <strong>₹{fmt(info.day_200_avg)}</strong>
                            </div>
                        )}
                        {info.avg_volume && (
                            <div className="si-metric">
                                <span>Avg Volume</span>
                                <strong>
                                    {fmt(info.avg_volume, 0)}
                                </strong>
                            </div>
                        )}
                        {info.employees && (
                            <div className="si-metric">
                                <span>Employees</span>
                                <strong>
                                    {fmt(info.employees, 0)}
                                </strong>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default StockInfo;