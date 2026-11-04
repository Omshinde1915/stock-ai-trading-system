import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Login.css';

function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let response;
            if (isLogin) {
                response = await loginUser({ email, password });
                toast.success('Login successful! Welcome back 🎉');
            } else {
                response = await registerUser({ email, password, name });
                toast.success('Registration successful! Welcome to StockAI 🎉');
            }

            const { access_token, user } = response.data;
            login(access_token, user);
            navigate('/');
        } catch (err) {
            console.error('Auth error:', err);
            const errorMsg =
                err.response?.data?.detail ||
                'Authentication failed. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <motion.div
                className="login-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="login-header">
                    <h1>📈 StockAI Pro</h1>
                    <p>Intelligent Stock Trading System</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={`tab-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => {
                            setIsLogin(true);
                            setError('');
                        }}
                        type="button"
                    >
                        Login
                    </button>
                    <button
                        className={`tab-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => {
                            setIsLogin(false);
                            setError('');
                        }}
                        type="button"
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        {isLogin && (
                            <div
                                style={{
                                    textAlign: 'right',
                                    marginTop: '6px',
                                }}
                            >
                                <Link
                                    to="/forgot-password"
                                    style={{
                                        fontSize: '12px',
                                        color: 'var(--primary)',
                                        textDecoration: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        )}
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading
                            ? 'Please wait...'
                            : isLogin
                            ? 'Login'
                            : 'Create Account'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default Login;