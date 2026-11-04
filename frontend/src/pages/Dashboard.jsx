import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getStocks, getStockAnalysis } from '../services/api';
import StockCard from '../components/StockCard';
import MarketOverview from '../components/MarketOverview';
import MarketMovers from '../components/MarketMovers';
import './Dashboard.css';

function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [analyzedStocks, setAnalyzedStocks] = useState({});
    const [analyzingSymbols, setAnalyzingSymbols] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSector, setSelectedSector] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            const response = await getStocks();
            setStocks(response.data);
            setLoading(false);
            analyzeStocksInBackground(response.data.slice(0, 6));
        } catch (err) {
            setError('Failed to fetch stocks data');
            console.error('Error:', err);
            setLoading(false);
        }
    };

    const analyzeStocksInBackground = async (topStocks) => {
        const symbols = topStocks.map(s => s.symbol);
        setAnalyzingSymbols(new Set(symbols));

        await Promise.all(topStocks.map(async (stock) => {
            try {
                const analysis = await getStockAnalysis(stock.symbol);
                setAnalyzedStocks(prev => ({
                    ...prev,
                    [stock.symbol]: analysis.data
                }));
            } catch (err) {
                console.error(`Analysis failed for ${stock.symbol}:`, err);
            } finally {
                setAnalyzingSymbols(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(stock.symbol);
                    return newSet;
                });
            }
        }));
    };

    const filteredStocks = stocks.filter(stock => {
        const matchesSector = selectedSector === 'all' || stock.sector === selectedSector;
        const matchesSearch = searchTerm === '' ||
            stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSector && matchesSearch;
    });

    const sectors = ['all', ...new Set(stocks.map(s => s.sector).filter(Boolean))];

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard-loading">
                    <div className="spinner-large"></div>
                    <p>Loading market data...</p>
                </div>
            </div>
        );
    }

    if (error) return <div className="error">{error}</div>;

    return (
        <div className="dashboard">
            <MarketOverview />
            <MarketMovers />

            <div className="dashboard-header">
                <div>
                    <h1>All Stocks</h1>
                    <p className="stock-count">{filteredStocks.length} stocks available</p>
                </div>
            </div>

            <div className="filters">
                <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="sector-filter"
                >
                    {sectors.map(sector => (
                        <option key={sector} value={sector}>
                            {sector === 'all' ? 'All Sectors' : sector}
                        </option>
                    ))}
                </select>
                <div className="search-wrapper">
                    <span className="search-icon-small">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by symbol or company name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-filter"
                    />
                </div>
            </div>

            <motion.div
                className="stocks-grid"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                    }
                }}
            >
                {filteredStocks.map((stock) => (
                    <StockCard
                        key={stock.id}
                        stock={stock}
                        analysis={analyzedStocks[stock.symbol]}
                        isAnalyzing={analyzingSymbols.has(stock.symbol)}
                    />
                ))}
            </motion.div>

            {filteredStocks.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <p>No stocks found matching your filters</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;