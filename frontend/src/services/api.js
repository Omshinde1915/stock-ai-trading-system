// API Service for backend communication
import axios from 'axios';

// Get backend URL dynamically:
// 1. Checks VITE_API_URL environment variable first (Vite production build)
// 2. If running locally on localhost, uses http://127.0.0.1:8000/api
// 3. In cloud production (Render), connects to https://stock-ai-trading-system.onrender.com/api
const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.trim() !== '') {
        const clean = envUrl.trim().replace(/\/$/, '');
        return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://127.0.0.1:8000/api';
    }
    return 'https://stock-ai-trading-system.onrender.com/api';
};

const API_BASE_URL = getBaseUrl();
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// AUTHENTICATION
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getCurrentUser = () => api.get('/auth/me');

// STOCKS
export const getStocks = () => api.get('/stocks/');
export const getStockDetail = (symbol) => api.get(`/stocks/${symbol}`);
export const getStockHistory = (symbol, days = 180) => api.get(`/stocks/${symbol}/history?days=${days}`);
export const getStockAnalysis = (symbol) => api.get(`/stocks/analyze/${symbol}`);

// WATCHLIST
export const getWatchlist = () => api.get('/watchlist/');
export const addToWatchlist = (symbol) => api.post('/watchlist', { symbol });
export const removeFromWatchlist = (id) => api.delete(`/watchlist/${id}`);

// PORTFOLIO
export const getPortfolio = () => api.get('/portfolio/');
export const getTransactions = () => api.get('/portfolio/transactions');
export const buyStock = (data) => api.post('/trading/buy', data);
export const sellStock = (data) => api.post('/trading/sell', data);

// MARKET DATA
export const getMarketIndices = () => api.get('/stocks/market/indices');
export const getMarketMovers = () => api.get('/stocks/market/movers');

// AI CHATBOT
export const sendChatMessage = (data) => api.post('/chat/', data);
export const getChatSessions = () => api.get('/chat/sessions');
export const getChatMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}`);

// AUTO-TRADING AGENT
export const getAgentStatus = () => api.get('/auto-trading/status');
export const startAgent = () => api.post('/auto-trading/start');
export const stopAgent = () => api.post('/auto-trading/stop');
export const runAgentCycle = () => api.post('/auto-trading/run-cycle');
export const emergencyStop = () => api.post('/auto-trading/emergency-stop');
export const getAgentLogs = () => api.get('/auto-trading/logs');
export const getAgentStats = () => api.get('/auto-trading/stats');

export default api;
