import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import './ForgotPassword.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setSent(true);
            toast.success('Reset link sent to your email!');
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="forgot-page">
            <motion.div
                className="forgot-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link to="/" className="back-link">← Back to Home</Link>
                
                <div className="forgot-header">
                    <span className="forgot-icon">🔐</span>
                    <h1>Forgot Password?</h1>
                    <p>No worries! Enter your email and we'll send you a reset link.</p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="forgot-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="forgot-footer">
                            <span>Remember your password? </span>
                            <Link to="/login">Sign In</Link>
                        </div>
                    </form>
                ) : (
                    <motion.div
                        className="success-message"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="success-icon">✉️</div>
                        <h2>Check Your Email</h2>
                        <p>
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="small-text">
                            Didn't receive it? Check your spam folder or{' '}
                            <button onClick={() => setSent(false)} className="retry-btn">
                                try again
                            </button>
                        </p>
                        <Link to="/login" className="back-to-login-btn">
                            Back to Login
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

export default ForgotPassword;