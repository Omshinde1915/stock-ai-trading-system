import React from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './PortfolioCharts.css';

const COLORS = [
    '#1e3c72', '#ff6b35', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1'
];

function PortfolioCharts({ portfolio }) {
    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
        return (
            <div className="portfolio-charts empty">
                <p>No holdings to visualize yet. Buy some stocks!</p>
            </div>
        );
    }

    const allocationData = portfolio.holdings.map(h => ({
        name: h.symbol,
        value: h.current_value,
    }));

    const pnlData = portfolio.holdings.map(h => ({
        symbol: h.symbol,
        pnl: h.pnl,
        pnl_pct: h.pnl_pct,
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{data.name || data.symbol}</p>
                    <p className="tooltip-value">
                        ₹{(data.value || data.pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    {data.pnl_pct !== undefined && (
                        <p className={`tooltip-change ${data.pnl_pct >= 0 ? 'up' : 'down'}`}>
                            {data.pnl_pct >= 0 ? '+' : ''}{data.pnl_pct}%
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="portfolio-charts">
            <motion.div
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h3>🥧 Portfolio Allocation</h3>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <motion.div
                className="chart-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3>📊 Stock-wise P&L</h3>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={pnlData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                            <XAxis
                                dataKey="symbol"
                                stroke="var(--text-tertiary)"
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis
                                stroke="var(--text-tertiary)"
                                tick={{ fontSize: 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                                {pnlData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}

export default PortfolioCharts;