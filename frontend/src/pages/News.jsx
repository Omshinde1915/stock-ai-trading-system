import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import './News.css';

function News() {
    const [searchParams, setSearchParams] = useSearchParams();
    const symbolFilter = searchParams.get('symbol') || '';

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState(symbolFilter);
    const [selectedNews, setSelectedNews] = useState(null);

    useEffect(() => {
        fetchNews();
    }, [symbolFilter]);

    const fetchNews = async () => {
        setLoading(true);
        setError('');
        try {
            const url = symbolFilter
                ? `/news/?symbol=${symbolFilter.toUpperCase()}`
                : '/news/';
            const res = await api.get(url);
            setNews(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch news:', err);
            setError(
                err.response?.data?.detail ||
                    'Failed to load news. Please try again.'
            );
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const sym = search.trim().toUpperCase();
        if (sym) {
            setSearchParams({ symbol: sym });
        } else {
            setSearchParams({});
        }
    };

    const clearFilter = () => {
        setSearch('');
        setSearchParams({});
    };

    const getSentimentBadge = (sentiment) => {
        if (sentiment === 'POSITIVE') return { class: 'positive', icon: '📈' };
        if (sentiment === 'NEGATIVE') return { class: 'negative', icon: '📉' };
        return { class: 'neutral', icon: '➡️' };
    };

    const filteredNews = news.filter((n) => {
        if (filter === 'all') return true;
        return n.sentiment === filter;
    });

    const stats = {
        positive: news.filter((n) => n.sentiment === 'POSITIVE').length,
        negative: news.filter((n) => n.sentiment === 'NEGATIVE').length,
        neutral: news.filter((n) => n.sentiment === 'NEUTRAL').length,
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        return Math.floor(seconds / 86400) + 'd ago';
    };

    return (
        <div className="news-page">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>📰 Market News & Sentiment</h1>
                <p>Latest stock market news with AI-powered sentiment analysis</p>
            </motion.div>

            {/* Stock Search */}
            <motion.form
                className="news-search-bar"
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <span className="news-search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search stock news (RELIANCE, TCS, INFY...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value.toUpperCase())}
                />
                <button type="submit" className="news-search-btn">
                    Search
                </button>
                {symbolFilter && (
                    <button
                        type="button"
                        className="news-clear-btn"
                        onClick={clearFilter}
                    >
                        ✕ Clear
                    </button>
                )}
            </motion.form>

            {/* Active Filter Info */}
            {symbolFilter && (
                <motion.div
                    className="active-filter"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <span>
                        Showing news for <strong>{symbolFilter}</strong>
                    </span>
                    <Link
                        to={`/stock/${symbolFilter}`}
                        className="goto-stock-link"
                    >
                        View Stock →
                    </Link>
                </motion.div>
            )}

            {/* Sentiment Stats */}
            <div className="sentiment-stats">
                <div className="sentiment-card positive">
                    <span className="sentiment-icon">📈</span>
                    <span className="sentiment-label">Positive</span>
                    <span className="sentiment-count">{stats.positive}</span>
                </div>
                <div className="sentiment-card neutral">
                    <span className="sentiment-icon">➡️</span>
                    <span className="sentiment-label">Neutral</span>
                    <span className="sentiment-count">{stats.neutral}</span>
                </div>
                <div className="sentiment-card negative">
                    <span className="sentiment-icon">📉</span>
                    <span className="sentiment-label">Negative</span>
                    <span className="sentiment-count">{stats.negative}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="news-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All News
                </button>
                <button
                    className={`filter-btn ${
                        filter === 'POSITIVE' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('POSITIVE')}
                >
                    📈 Positive
                </button>
                <button
                    className={`filter-btn ${
                        filter === 'NEUTRAL' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('NEUTRAL')}
                >
                    ➡️ Neutral
                </button>
                <button
                    className={`filter-btn ${
                        filter === 'NEGATIVE' ? 'active' : ''
                    }`}
                    onClick={() => setFilter('NEGATIVE')}
                >
                    📉 Negative
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="news-loading">
                    <div className="spinner-large"></div>
                    <p>Loading news...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="news-error">
                    <span className="error-icon">⚠️</span>
                    <h3>Failed to Load News</h3>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={fetchNews}>
                        🔄 Retry
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredNews.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">📰</span>
                    <p>No news found</p>
                    {symbolFilter && (
                        <p className="empty-sub">
                            No news available for {symbolFilter}. Try another
                            symbol.
                        </p>
                    )}
                    {symbolFilter && (
                        <button className="browse-btn" onClick={clearFilter}>
                            Show All News
                        </button>
                    )}
                </div>
            )}

            {/* News Grid */}
            {!loading && !error && filteredNews.length > 0 && (
                <div className="news-grid">
                    {filteredNews.map((item, idx) => {
                        const badge = getSentimentBadge(item.sentiment);
                        return (
                            <motion.div
                                key={item.id || idx}
                                className="news-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedNews(item)}
                            >
                                <div className="news-card-header">
                                    <span
                                        className={`sentiment-badge ${badge.class}`}
                                    >
                                        {badge.icon} {item.sentiment}
                                    </span>
                                    <span className="news-time">
                                        {timeAgo(item.published_at)}
                                    </span>
                                </div>

                                {/* Stock symbols */}
                                {item.symbols && item.symbols.length > 0 && (
                                    <div className="news-symbols">
                                        {item.symbols.map((sym) => (
                                            <Link
                                                key={sym}
                                                to={`/stock/${sym}`}
                                                className="symbol-chip"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                ${sym}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <h3 className="news-title">{item.title}</h3>
                                <p className="news-description">
                                    {item.description}
                                </p>
                                <div className="news-card-footer">
                                    <span className="news-source">
                                        📰 {item.source}
                                    </span>
                                    <button className="news-read-btn">
                                        Read More →
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        className="news-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedNews(null)}
                    >
                        <motion.div
                            className="news-modal"
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="news-modal-close"
                                onClick={() => setSelectedNews(null)}
                            >
                                ✕
                            </button>

                            <div className="news-modal-header">
                                <div className="news-modal-meta">
                                    <span
                                        className={`sentiment-badge ${
                                            getSentimentBadge(
                                                selectedNews.sentiment
                                            ).class
                                        }`}
                                    >
                                        {
                                            getSentimentBadge(
                                                selectedNews.sentiment
                                            ).icon
                                        }{' '}
                                        {selectedNews.sentiment}
                                    </span>
                                    <span className="news-modal-source">
                                        📰 {selectedNews.source}
                                    </span>
                                    <span className="news-modal-time">
                                        {timeAgo(selectedNews.published_at)}
                                    </span>
                                </div>

                                {/* Related stock symbols */}
                                {selectedNews.symbols &&
                                    selectedNews.symbols.length > 0 && (
                                        <div className="news-symbols-modal">
                                            {selectedNews.symbols.map(
                                                (sym) => (
                                                    <Link
                                                        key={sym}
                                                        to={`/stock/${sym}`}
                                                        className="symbol-chip-modal"
                                                        onClick={() =>
                                                            setSelectedNews(
                                                                null
                                                            )
                                                        }
                                                    >
                                                        ${sym} →
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    )}

                                <h1 className="news-modal-title">
                                    {selectedNews.title}
                                </h1>
                                <p className="news-modal-description">
                                    {selectedNews.description}
                                </p>
                            </div>

                            <div className="news-modal-body">
                                {(selectedNews.full_content ||
                                    selectedNews.description ||
                                    '')
                                    .split('\n\n')
                                    .map((para, i) => (
                                        <p
                                            key={i}
                                            className="news-modal-paragraph"
                                        >
                                            {para}
                                        </p>
                                    ))}
                            </div>

                            <div className="news-modal-footer">
                                <div className="news-modal-sentiment-score">
                                    <span className="score-label">
                                        Sentiment Score
                                    </span>
                                    <span
                                        className="score-value"
                                        style={{
                                            color:
                                                selectedNews.sentiment_score >
                                                0
                                                    ? '#10b981'
                                                    : selectedNews.sentiment_score <
                                                      0
                                                    ? '#ef4444'
                                                    : '#64748b',
                                        }}
                                    >
                                        {selectedNews.sentiment_score > 0
                                            ? '+'
                                            : ''}
                                        {(
                                            selectedNews.sentiment_score || 0
                                        ).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    className="news-modal-close-btn"
                                    onClick={() => setSelectedNews(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default News;