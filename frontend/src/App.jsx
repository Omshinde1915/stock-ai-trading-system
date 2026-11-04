import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Chatbot from './components/Chatbot';
import Dashboard from './pages/Dashboard';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import AutoTrading from './pages/AutoTrading';
import PredictionHistory from './pages/PredictionHistory';
import Profile from './pages/Profile';
import Compare from './pages/Compare';
import News from './pages/News';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import './App.css';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <div className="loading">Loading...</div>;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

function AppContent() {
    return (
        <div className="app">
            <Header />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/stock/:symbol" element={<StockDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/compare" element={<Compare />} />
                    
                    <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                    <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
                    <Route path="/auto-trading" element={<ProtectedRoute><AutoTrading /></ProtectedRoute>} />
                    <Route path="/predictions" element={<ProtectedRoute><PredictionHistory /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Chatbot />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;