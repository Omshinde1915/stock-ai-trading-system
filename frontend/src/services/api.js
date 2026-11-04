// API Service for backend communication
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
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

// TRADING
export const buyStock = (symbol, quantity) => api.post('/trading/buy', { symbol, quantity });
export const sellStock = (symbol, quantity) => api.post('/trading/sell', { symbol, quantity });

// CHATBOT
export const sendChatMessage = (message, sessionId = null) => 
    api.post('/chat', { message, session_id: sessionId });
export const getChatSessions = () => api.get('/chat/sessions');
export const getChatMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`);

export default api;