import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'chart.js';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './Compare.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function Compare() {
    const [symbol1, setSymbol1] = useState('RELIANCE');
    const [symbol2, setSymbol2] = useState('TCS');
    const [data1, setData1] = useState(null);
    const [data2, setData2] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const compareStocks = async () => {
        if (!symbol1.trim() || !symbol2.trim()) {
            toast.error('Please enter both stock symbols');
            return;
        }
        
        setLoading(true);
        try {
            const [res1, res2] = await Promise.all([
                api.get(`/stocks/${symbol1.toUpperCase()}/history?days=90`),
                api.get(`/stocks/${symbol2.toUpperCase()}/history?days=90`),
            ]);
            
            const stock1 = await api.get(`/stocks/analyze/${symbol1.toUpperCase()}`);
            const stock2 = await api.get(`/stocks/analyze/${symbol2.toUpperCase()}`);
            
            setData1({ history: res1.data, analysis: stock1.data });
            setData2({ history: res2.data, analysis: stock2.data });
            
            toast.success('Comparison loaded!');
        } catch (err) {
            toast.error('Failed to load comparison');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getChartData = () => {
        if (!data1 || !data2) return null;
        
        const len = Math.min(data1.history.length, data2.history.length);
        const h1 = data1.history.slice(-len);
        const h2 = data2.history.slice(-len);
        
        // Normalize to percentage change for fair comparison
        const base1 = h1[0]?.close || 1;
        const base2 = h2[0]?.close || 1;
        
        return {
            labels: h1.map((d) => d.date),
            datasets: [
                {
                    label: `${symbol1} (%)`,
                    data: h1.map((d) => ((d.close - base1) / base1 * 100).toFixed(2)),
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                },
                {
                    label: `${symbol2} (%)`,
                    data: h2.map((d) => ((d.close - base2) / base2 * 100).toFixed(2)),
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
                },
            },
        },
        scales: {
            y: {
                ticks: { callback: (val) => `${val}%` },
            },
        },
    };

    const renderStockCard = (symbol, data, color) => {
        if (!data) return null;
        const a = data.analysis;
        const signalClass = a.decision === 'BUY' ? 'buy' : a.decision === 'SELL' ? 'sell' : 'hold';
        
        return (
            <div className="compare-stock-card">
                <div className="compare-stock-header" style={{ borderTopColor: color }}>
                    <h2>{symbol}</h2>
                    <span className={`signal-badge ${signalClass}`}>{a.decision}</span>
                </div>
                
                <div className="compare-price">₹{a.current_price}</div>
                
                <div className="compare-metrics">
                    <div className="compare-metric">
                        <span className="metric-label">Confidence</span>
                        <span className="metric-value">{a.confidence}%</span>
                    </div>
                    <div className="compare-metric">
                        <span className="metric-label">Risk</span>
                        <span className="metric-value">{a.risk_level}</span>
                    </div>
                    <div className="compare-metric">
                        <span className="metric-label">Opportunity</span>
                        <span className="metric-value">{a.opportunity_score}/100</span>
                    </div>
                    <div className="compare-metric">
                        <span className="metric-label">Expected Return</span>
                        <span className="metric-value">{a.prediction?.expected_return_pct || 0}%</span>
                    </div>
                    <div className="compare-metric">
                        <span className="metric-label">Target</span>
                        <span className="metric-value">₹{a.target}</span>
                    </div>
                    <div className="compare-metric">
                        <span className="metric-label">Stop Loss</span>
                        <span className="metric-value">₹{a.stop_loss}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="compare-page">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>📊 Stock Comparison</h1>
                <p>Compare two stocks side by side</p>
            </motion.div>

            {/* Input Section */}
            <div className="compare-inputs">
                <div className="compare-input-group">
                    <label>Stock 1</label>
                    <input
                        type="text"
                        value={symbol1}
                        onChange={(e) => setSymbol1(e.target.value.toUpperCase())}
                        placeholder="e.g. RELIANCE"
                    />
                </div>
                <div className="compare-vs">VS</div>
                <div className="compare-input-group">
                    <label>Stock 2</label>
                    <input
                        type="text"
                        value={symbol2}
                        onChange={(e) => setSymbol2(e.target.value.toUpperCase())}
                        placeholder="e.g. TCS"
                    />
                </div>
                <button
                    className="compare-btn"
                    onClick={compareStocks}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : '🔍 Compare'}
                </button>
            </div>

            {/* Results */}
            {data1 && data2 && (
                <>
                    {/* Chart */}
                    <motion.div
                        className="compare-chart-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h3>📈 Performance Comparison (Last 90 Days)</h3>
                        <div className="compare-chart">
                            <Line data={getChartData()} options={chartOptions} />
                        </div>
                    </motion.div>

                    {/* Stock Cards */}
                    <div className="compare-grid">
                        {renderStockCard(symbol1, data1, '#1e3c72')}
                        {renderStockCard(symbol2, data2, '#ff6b35')}
                    </div>

                    {/* Winner */}
                    <motion.div
                        className="winner-banner"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <span className="winner-label">🏆 Better Opportunity:</span>
                        <span className="winner-symbol">
                            {data1.analysis.opportunity_score > data2.analysis.opportunity_score
                                ? symbol1
                                : symbol2}
                        </span>
                        <span className="winner-score">
                            (Score:{' '}
                            {Math.max(
                                data1.analysis.opportunity_score,
                                data2.analysis.opportunity_score
                            )}
                            )
                        </span>
                    </motion.div>
                </>
            )}
        </div>
    );
}

export default Compare;