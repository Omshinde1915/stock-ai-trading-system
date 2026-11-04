import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './NotFound.css';

function NotFound() {
    return (
        <div className="notfound-page">
            <motion.div
                className="notfound-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="notfound-emoji"
                    animate={{
                        y: [0, -15, 0],
                        rotate: [0, -5, 5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    🔍
                </motion.div>
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist or has been moved.</p>
                <Link to="/" className="home-btn">
                    ← Back to Dashboard
                </Link>
            </motion.div>
        </div>
    );
}

export default NotFound;