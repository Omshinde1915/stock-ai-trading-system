import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Watchlist.css';

function Watchlist() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchWatchlist();
    }, [isAuthenticated]);

    const fetchWatchlist = async () => {
        try {
            const res = await getWatchlist();
            setWatchlist(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load watchlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id, symbol) => {
        if (!window.confirm(`Remove ${symbol} from watchlist?`)) return;
        try {
            await removeFromWatchlist(id);
            setWatchlist(watchlist.filter(item => item.id !== id));
        } catch (err) {
            alert('Failed to remove: ' + (err.response?.data?.detail || err.message));
        }
    };

    if (loading) return <div className="loading">Loading watchlist...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="watchlist-page">
            <div className="watchlist-header">
                <h1>⭐ My Watchlist</h1>
                <Link to="/" className="browse-btn">+ Browse Stocks</Link>
            </div>

            {watchlist.length === 0 ? (
                <div className="empty-state">
                    <p>Your watchlist is empty.</p>
                    <p>Browse stocks from the dashboard and add them to your watchlist.</p>
                    <Link to="/" className="btn-primary">Go to Dashboard</Link>
                </div>
            ) : (
                <div className="watchlist-grid">
                    {watchlist.map(item => (
                        <div key={item.id} className="watchlist-card">
                            <div className="watchlist-card-header">
                                <div>
                                    <h3>{item.symbol}</h3>
                                    <p className="company">{item.company_name}</p>
                                </div>
                                <span className="sector-tag">{item.sector}</span>
                            </div>
                            
                            <div className="watchlist-card-actions">
                                <Link to={`/stock/${item.symbol}`} className="view-link">
                                    View Details →
                                </Link>
                                <button 
                                    className="remove-btn"
                                    onClick={() => handleRemove(item.id, item.symbol)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Watchlist;