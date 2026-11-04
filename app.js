// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';
let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    if (authToken) {
        showUserSection();
        loadDashboard();
        loadPortfolio();
        loadWatchlist();
    } else {
        showLoginButton();
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href');
            showSection(target);
        });
    });

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        filterStocks(e.target.value);
    });

    // Sector filter
    document.getElementById('sector-filter').addEventListener('change', (e) => {
        filterBySector(e.target.value);
    });

    // Login button
    document.getElementById('login-btn').addEventListener('click', showLoginModal);
    
    // Modal close
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Chat form
    document.getElementById('chat-form').addEventListener('submit', handleChat);
}

// API Helper Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
        method,
        headers,
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (response.status === 401) {
            // Token expired
            logout();
            throw new Error('Session expired. Please login again.');
        }
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.detail || 'API request failed');
        }
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication Functions
function showLoginModal() {
    document.getElementById('login-modal').classList.add('show');
    showLogin();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.querySelector('.tab-btn').classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.querySelector('.tab-btn').classList.remove('active');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const result = await apiRequest('/auth/login', 'POST', { email, password });
        authToken = result.access_token;
        currentUser = result.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        closeModal();
        showUserSection();
        loadDashboard();
        loadPortfolio();
        loadWatchlist();
        
        showToast('Login successful!');
    } catch (error) {
        document.getElementById('login-error').textContent = error.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const result = await apiRequest('/auth/register', 'POST', { name, email, password });
        authToken = result.access_token;
        currentUser = result.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        closeModal();
        showUserSection();
        loadDashboard();
        loadPortfolio();
        loadWatchlist();
        
        showToast('Registration successful!');
    } catch (error) {
        document.getElementById('register-error').textContent = error.message;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showLoginButton();
    showSection('#dashboard');
    loadDashboard();
}

function showUserSection() {
    document.getElementById('user-name').textContent = `👤 ${currentUser.name || currentUser.email}`;
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'block';
}

function showLoginButton() {
    document.getElementById('user-name').textContent = '👤 Guest';
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    if (sectionId === '#dashboard') {
        document.getElementById('dashboard').style.display = 'block';
        document.querySelectorAll('nav a')[0].classList.add('active');
    } else if (sectionId === '#portfolio') {
        document.getElementById('portfolio').style.display = 'block';
        document.querySelectorAll('nav a')[1].classList.add('active');
        loadPortfolio();
    } else if (sectionId === '#watchlist') {
        document.getElementById('watchlist').style.display = 'block';
        document.querySelectorAll('nav a')[2].classList.add('active');
        loadWatchlist();
    } else if (sectionId === '#chatbot-section') {
        document.getElementById('chatbot-section').style.display = 'block';
        document.querySelectorAll('nav a')[3].classList.add('active');
    }
}

// Dashboard Functions
async function loadDashboard() {
    const grid = document.getElementById('stocks-grid');
    grid.innerHTML = '<div class="loading">Loading stocks...</div>';
    
    try {
        const stocks = await apiRequest('/stocks');
        displayStocks(stocks);
    } catch (error) {
        grid.innerHTML = `<div class="error">Failed to load stocks: ${error.message}</div>`;
    }
}

function displayStocks(stocks) {
    const grid = document.getElementById('stocks-grid');
    grid.innerHTML = '';
    
    stocks.forEach(stock => {
        const card = document.createElement('div');
        card.className = 'stock-card';
        card.innerHTML = `
            <h3>${stock.symbol}</h3>
            <p class="company-name">${stock.company_name}</p>
            <span class="sector">${stock.sector}</span>
            <button class="view-btn" onclick="openStockDetail('${stock.symbol}')">View Details</button>
        `;
        grid.appendChild(card);
    });
}

function filterStocks(searchTerm) {
    const cards = document.querySelectorAll('.stock-card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm.toLowerCase()) ? 'block' : 'none';
    });
}

function filterBySector(sector) {
    const cards = document.querySelectorAll('.stock-card');
    cards.forEach(card => {
        const cardSector = card.querySelector('.sector').textContent;
        card.style.display = (sector === 'all' || cardSector === sector) ? 'block' : 'none';
    });
}

// Stock Detail
async function openStockDetail(symbol) {
    const modal = document.getElementById('stock-modal');
    const content = document.getElementById('stock-detail-content');
    content.innerHTML = '<div class="loading">Loading stock details...</div>';
    modal.classList.add('show');
    
    try {
        const analysis = await apiRequest(`/stocks/analyze/${symbol}`);
        const history = await apiRequest(`/stocks/history/${symbol}?days=30`);
        
        content.innerHTML = `
            <h2>${symbol}</h2>
            <div class="stock-price">₹${analysis.current_price}</div>
            <div class="signal ${analysis.decision}">${analysis.decision}</div>
            <p>Confidence: ${analysis.confidence}%</p>
            <p>Risk Level: ${analysis.risk_level}</p>
            <p>Target: ₹${analysis.target}</p>
            <canvas id="stock-chart" height="200"></canvas>
            <div class="reasons">
                <h4>Analysis Reasons:</h4>
                <ul>
                    ${analysis.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>
            ${authToken ? `
                <div class="trade-actions">
                    <button onclick="buyStock('${symbol}')" class="btn-buy">BUY</button>
                    <button onclick="sellStock('${symbol}')" class="btn-sell">SELL</button>
                    <button onclick="addWatchlist('${symbol}')" class="btn-watch">Add to Watchlist</button>
                </div>
            ` : ''}
        `;
        
        // Create chart
        const ctx = document.getElementById('stock-chart').getContext('2d');
        const chartData = history.history.map(h => h.close);
        const labels = history.history.map(h => h.date);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${symbol} Price`,
                    data: chartData,
                    borderColor: '#1e3c72',
                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    } catch (error) {
        content.innerHTML = `<div class="error">Failed to load stock details: ${error.message}</div>`;
    }
}

// Trading Functions
async function buyStock(symbol) {
    const quantity = prompt(`Enter quantity to buy ${symbol}:`, '10');
    if (!quantity) return;
    
    try {
        const result = await apiRequest('/trading/buy', 'POST', { symbol, quantity: parseInt(quantity) });
        showToast(result.message);
        loadPortfolio();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function sellStock(symbol) {
    const quantity = prompt(`Enter quantity to sell ${symbol}:`, '10');
    if (!quantity) return;
    
    try {
        const result = await apiRequest('/trading/sell', 'POST', { symbol, quantity: parseInt(quantity) });
        showToast(result.message);
        loadPortfolio();
    } catch (error) {
        showToast(error.message, true);
    }
}

// Watchlist Functions
async function loadWatchlist() {
    if (!authToken) return;
    
    const container = document.getElementById('watchlist-items');
    container.innerHTML = '<div class="loading">Loading watchlist...</div>';
    
    try {
        const watchlist = await apiRequest('/watchlist');
        displayWatchlist(watchlist);
    } catch (error) {
        container.innerHTML = `<div class="error">Failed to load watchlist: ${error.message}</div>`;
    }
}

function displayWatchlist(watchlist) {
    const container = document.getElementById('watchlist-items');
    container.innerHTML = '';
    
    if (watchlist.length === 0) {
        container.innerHTML = '<p>No stocks in watchlist. Add stocks from the dashboard!</p>';
        return;
    }
    
    watchlist.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'watchlist-item';
        itemDiv.innerHTML = `
            <div class="stock-info">
                <h4>${item.symbol}</h4>
                <p>${item.company_name}</p>
                <span class="sector">${item.sector}</span>
            </div>
            <button class="remove-btn" onclick="removeWatchlist(${item.id})">Remove</button>
        `;
        container.appendChild(itemDiv);
    });
}

async function addWatchlist(symbol) {
    try {
        const result = await apiRequest('/watchlist', 'POST', { symbol });
        showToast(`Added ${symbol} to watchlist!`);
        loadWatchlist();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function removeWatchlist(id) {
    try {
        await apiRequest(`/watchlist/${id}`, 'DELETE');
        showToast('Removed from watchlist');
        loadWatchlist();
    } catch (error) {
        showToast(error.message, true);
    }
}

// Portfolio Functions
async function loadPortfolio() {
    if (!authToken) return;
    
    try {
        const portfolio = await apiRequest('/portfolio');
        displayPortfolio(portfolio);
        
        const transactions = await apiRequest('/portfolio/transactions');
        displayTransactions(transactions);
    } catch (error) {
        console.error('Failed to load portfolio:', error);
    }
}

function displayPortfolio(portfolio) {
    document.getElementById('total-value').textContent = `₹${portfolio.total_value.toFixed(2)}`;
    document.getElementById('cash-balance').textContent = `₹${portfolio.cash_balance.toFixed(2)}`;
    document.getElementById('total-pnl').textContent = `₹${portfolio.total_pnl.toFixed(2)}`;
    document.getElementById('holdings-count').textContent = portfolio.holdings_count;
    
    const table = document.getElementById('holdings-table');
    table.innerHTML = '<h3>Holdings</h3>';
    
    if (portfolio.holdings.length === 0) {
        table.innerHTML += '<p>No holdings yet. Start trading!</p>';
        return;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Avg Price</th>
                    <th>Current Price</th>
                    <th>P&L</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    portfolio.holdings.forEach(holding => {
        tableHTML += `
            <tr>
                <td>${holding.symbol}</td>
                <td>${holding.quantity}</td>
                <td>₹${holding.average_price.toFixed(2)}</td>
                <td>₹${holding.current_price.toFixed(2)}</td>
                <td style="color: ${holding.pnl >= 0 ? 'green' : 'red'}">
                    ${holding.pnl >= 0 ? '+' : ''}₹${holding.pnl.toFixed(2)}
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    table.innerHTML = tableHTML;
}

function displayTransactions(transactions) {
    const table = document.getElementById('transactions-table');
    table.innerHTML = '<h3>Transaction History</h3>';
    
    if (transactions.length === 0) {
        table.innerHTML += '<p>No transactions yet.</p>';
        return;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    transactions.forEach(transaction => {
        tableHTML += `
            <tr>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>${transaction.symbol}</td>
                <td style="color: ${transaction.type === 'BUY' ? 'green' : 'red'}">${transaction.type}</td>
                <td>${transaction.quantity}</td>
                <td>₹${transaction.price.toFixed(2)}</td>
                <td>₹${transaction.total_amount.toFixed(2)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    table.innerHTML = tableHTML;
}

// Chatbot Functions
async function handleChat(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    try {
        const result = await apiRequest('/chat', 'POST', { message });
        addChatMessage(result.response, 'assistant');
    } catch (error) {
        addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    }
}

function addChatMessage(message, role) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.textContent = message;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Toast Notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    toast.style.color = isError ? '#721c24' : '#155724';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}