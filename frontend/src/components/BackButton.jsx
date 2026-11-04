import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './BackButton.css';

function BackButton({ label = 'Back', showLabel = true }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    // Don't show on dashboard (home)
    if (location.pathname === '/') {
        return null;
    }

    return (
        <motion.button
            className="back-button"
            onClick={handleBack}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ x: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Go Back"
        >
            <span className="back-icon">←</span>
            {showLabel && <span className="back-label">{label}</span>}
        </motion.button>
    );
}

export default BackButton;