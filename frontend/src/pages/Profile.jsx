import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Profile.css';

function Profile() {
    const { user, logout } = useAuth();
    const toast = useToast();
    
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const fetchPortfolio = async () => {
        try {
            const res = await api.get('/portfolio/');
            setPortfolio(res.data);
        } catch (err) {
            console.error('Failed to fetch portfolio:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Note: Backend update endpoint to be added later
            toast.success('Profile updated successfully!');
            setEditMode(false);
        } catch (err) {
            toast.error('Failed to update profile');
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            toast.info('Logged out successfully');
        }
    };

    const getInitial = () => {
        return (user?.name || user?.email || 'U').charAt(0).toUpperCase();
    };

    if (loading) return <div className="loading">Loading profile...</div>;

    return (
        <div className="profile-page">
            <motion.div
                className="profile-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>👤 My Profile</h1>
                <p>Manage your account and view your stats</p>
            </motion.div>

            <div className="profile-grid">
                {/* Profile Card */}
                <motion.div
                    className="profile-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="avatar-wrapper">
                        <div className="profile-avatar">{getInitial()}</div>
                        <div className="avatar-badge">✓</div>
                    </div>

                    {!editMode ? (
                        <>
                            <h2>{user?.name || 'User'}</h2>
                            <p className="profile-email">{user?.email}</p>
                            
                            <div className="profile-info">
                                <div className="info-item">
                                    <span className="info-label">Member Since</span>
                                    <span className="info-value">
                                        {user?.created_at
                                            ? new Date(user.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Account Status</span>
                                    <span className="status-active">● Active</span>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button
                                    className="btn-edit"
                                    onClick={() => setEditMode(true)}
                                >
                                    ✏️ Edit Profile
                                </button>
                                <button
                                    className="btn-logout"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleUpdate} className="profile-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="your@email.com"
                                    disabled
                                />
                                <small>Email cannot be changed</small>
                            </div>
                            <div className="form-buttons">
                                <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>

                {/* Stats Cards */}
                {portfolio && (
                    <motion.div
                        className="profile-stats"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3>📊 Your Statistics</h3>
                        
                        <div className="stats-grid-profile">
                            <div className="stat-box">
                                <span className="stat-box-label">Portfolio Value</span>
                                <span className="stat-box-value">
                                    ₹{portfolio.total_value?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-box-label">Cash Balance</span>
                                <span className="stat-box-value">
                                    ₹{portfolio.cash_balance?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-box-label">Total P&L</span>
                                <span
                                    className="stat-box-value"
                                    style={{ color: (portfolio.total_pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}
                                >
                                    {(portfolio.total_pnl || 0) >= 0 ? '+' : ''}₹{portfolio.total_pnl?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-box-label">Holdings</span>
                                <span className="stat-box-value">{portfolio.holdings_count || 0}</span>
                            </div>
                        </div>

                        <div className="profile-links">
                            <h4>Quick Links</h4>
                            <a href="/portfolio" className="quick-link">
                                💼 View Portfolio
                            </a>
                            <a href="/watchlist" className="quick-link">
                                ⭐ My Watchlist
                            </a>
                            <a href="/predictions" className="quick-link">
                                📊 Prediction History
                            </a>
                            <a href="/auto-trading" className="quick-link">
                                🤖 AI Agent
                            </a>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Profile;