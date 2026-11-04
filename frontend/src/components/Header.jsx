import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/stock/${searchQuery.toUpperCase().trim()}`);
            setSearchQuery('');
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <motion.header 
            className="header"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="header-container">
                <div className="header-left">
                    <Link to="/" className="logo">
                        <motion.span 
                            className="logo-icon"
                            whileHover={{ rotate: 15, scale: 1.1 }}
                            transition={{ type: 'spring' }}
                        >
                            📈
                        </motion.span>
                       <span className="logo-text">
    Stock<span className="logo-accent">AI</span> <span style={{fontSize: '0.75em', opacity: 0.8}}>Pro</span>
</span>
                    </Link>

                    <nav className="nav-links">
                        <Link 
                            to="/" 
                            className={`nav-link ${isActive('/') ? 'active' : ''}`}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to="/news" 
                            className={`nav-link ${isActive('/news') ? 'active' : ''}`}
                        >
                            📰 News
                        </Link>
                        <Link 
                            to="/compare" 
                            className={`nav-link ${isActive('/compare') ? 'active' : ''}`}
                        >
                            📊 Compare
                        </Link>
                        
                        {isAuthenticated && (
                            <>
                                <Link 
                                    to="/portfolio" 
                                    className={`nav-link ${isActive('/portfolio') ? 'active' : ''}`}
                                >
                                    Portfolio
                                </Link>
                                <Link 
                                    to="/watchlist" 
                                    className={`nav-link ${isActive('/watchlist') ? 'active' : ''}`}
                                >
                                    Watchlist
                                </Link>
                                <Link 
                                    to="/auto-trading" 
                                    className={`nav-link ${isActive('/auto-trading') ? 'active' : ''}`}
                                >
                                    🤖 AI Agent
                                </Link>
                                <Link 
                                    to="/predictions" 
                                    className={`nav-link ${isActive('/predictions') ? 'active' : ''}`}
                                >
                                    📈 Predictions
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
                
                <form className="search-bar" onSubmit={handleSearch}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search stocks (RELIANCE, TCS...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
                
                <div className="header-right">
                    <motion.button 
                        className="theme-toggle"
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </motion.button>

                    {isAuthenticated ? (
                        <div className="user-menu-container">
                            <motion.button
                                className="user-menu-btn"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="user-avatar">
                                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info">
                                    <div className="user-name">{user?.name || 'User'}</div>
                                    <div className="user-email">{user?.email}</div>
                                </div>
                                <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
                            </motion.button>

                            {showUserMenu && (
                                <motion.div 
                                    className="user-dropdown"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Link 
                                        to="/profile" 
                                        className="dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        👤 My Profile
                                    </Link>
                                    <Link 
                                        to="/predictions" 
                                        className="dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        📊 Prediction History
                                    </Link>
                                    <Link 
                                        to="/portfolio" 
                                        className="dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        💼 Portfolio
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button 
                                        onClick={() => { logout(); setShowUserMenu(false); }}
                                        className="dropdown-item logout-item"
                                    >
                                        🚪 Logout
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link to="/login" className="login-btn">
                                Sign In
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.header>
    );
}

export default Header;