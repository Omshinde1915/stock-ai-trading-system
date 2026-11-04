# 🤖 AI-Based Stock Prediction & Multi-Agent Trading Assistant

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![SQL Server](https://img.shields.io/badge/SQL%20Server-LocalDB-red.svg)
![License](https://img.shields.io/badge/License-Educational-yellow.svg)

**An intelligent stock analysis, prediction, and paper trading system powered by multi-agent AI architecture.**

[Features](#-features) • [Architecture](#-architecture) • [Setup](#-setup) • [API](#-api-endpoints) • [Screenshots](#-screenshots)

</div>

---

## 📖 Overview

**StockAI** is a full-stack web application that combines **Machine Learning**, **Multi-Agent Architecture**, and **Real-Time Market Data** to help users analyze Indian stocks, predict price movements, and practice paper trading in a risk-free environment.

> ⚠️ **Disclaimer:** This is an educational/research project. All trading is **simulated** (paper trading) — no real money or broker is involved. Predictions are **estimates**, not guarantees. This is **not financial advice**.

---

## ✨ Features

### 📊 Stock Analysis
- **100+ Indian Stocks** (NSE) across sectors
- **Real-time prices** via Yahoo Finance (with `.NS` / `.BO` support)
- **Market Indices** — NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, etc.
- **Historical charts** (up to 1 year+)
- **Interactive dashboards** with animated UI

### 🤖 AI & ML
- **Ensemble ML models** — Linear Regression + Random Forest
- **Technical Indicators** — RSI, MACD, SMA, EMA, Bollinger Bands, ATR
- **BUY / SELL / HOLD** signals with confidence scores
- **Risk assessment** — Low / Medium / High
- **Explainable decisions** with reasoning

### 👥 Multi-Agent Architecture
- **Supervisor Agent** — orchestrates all agents
- **Market Data Agent** — data provider layer
- **Technical Analysis Agent** — computes indicators
- **Prediction Agent** — ML model lifecycle
- **Decision Agent** — combines signals
- **Risk Management Agent** — enforces rules
- **Portfolio Agent** — tracks positions
- **Auto-Trading Agent** — autonomous execution

### 💼 Paper Trading
- **₹10,00,000 virtual balance** per user
- **BUY / SELL** with realistic execution costs
- **Portfolio tracking** with P&L
- **Transaction history**
- **Watchlist** for monitoring

### 🤖 Auto-Trading Agent
- **Autonomous trading** based on AI signals
- **Market hours enforcement** (9:15 AM – 3:30 PM IST)
- **Risk rules** — max position, daily loss limit, confidence threshold
- **Kill switch** for emergency stop
- **Complete audit log**
- **P&L tracking** with win rate

### 💬 Multilingual Chatbot
- **English / हिंदी / मराठी** support
- **Auto language detection**
- **Real-time stock analysis** responses
- **Context-aware** for stocks, portfolio, technicals

### 🎨 Modern UI
- **Dark / Light mode** toggle
- **Glassmorphism** design
- **Framer Motion** animations
- **Responsive** layout
- **Interactive charts** (Chart.js, Recharts)

### 🔐 Security
- **JWT authentication**
- **Bcrypt password hashing**
- **Protected routes**
- **SQL injection protection** (SQLAlchemy ORM)
- **User-specific data isolation**

---

## 🏗️ Architecture

### High-Level Flow





┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React + Vite) │
│ Dashboard | Portfolio | Watchlist | AI Agent | Chatbot │
└────────────────────┬────────────────────────────────────────┘
│ REST API (JWT)
┌────────────────────▼────────────────────────────────────────┐
│ BACKEND (FastAPI) │
│ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ SUPERVISOR AGENT (Orchestrator) │ │
│ └────┬────────┬────────┬────────┬────────┬────────┬────┘ │
│ │ │ │ │ │ │ │
│ ┌───▼──┐ ┌──▼───┐ ┌─▼────┐ ┌▼─────┐ ┌▼────┐ ┌─▼─────┐ │
│ │Market│ │Tech │ │Pred │ │Risk │ │Port │ │Auto │ │
│ │Data │ │Analy │ │ML │ │Mgmt │ │folio│ │Trade │ │
│ └───┬──┘ └──────┘ └──────┘ └──────┘ └─────┘ └───┬───┘ │
│ │ │ │
│ │ ┌────────────────────────┐ │ │
│ └──────►│ Scheduler (APScheduler)│◄────────┘ │
│ │ Market Hours Only │ │
│ └────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
│
┌────────────┼────────────┐
│ │ │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│ Yahoo │ │ SQL │ │ Mock │
│Finance │ │Server │ │Provider│
│(Real) │ │LocalDB │ │(Demo) │
└────────┘ └────────┘ └────────┘

text

### Multi-Agent Flow (10-Step Process)
Market Data Agent → Fetch OHLCV data

Technical Agent → Compute RSI, MACD, SMA

Prediction Agent → ML model prediction

Market Trend Check → Momentum analysis

Volatility Check → Risk assessment

Portfolio Agent → Current exposure

Risk Manager → Rule checks

Decision Agent → Weighted scoring

Confidence Blend → Model + history

Execution Engine → Paper trade

text

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Python 3.11+** | Core language |
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM |
| **SQL Server LocalDB** | Database |
| **Pydantic** | Data validation |
| **JWT** | Authentication |
| **Passlib + Bcrypt** | Password hashing |
| **APScheduler** | Background jobs |

### ML & Data
| Technology | Purpose |
|-----------|---------|
| **scikit-learn** | ML models |
| **pandas / numpy** | Data processing |
| **yfinance** | Real market data |
| **TA-Lib logic** | Technical indicators |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **React Router** | Navigation |
| **Framer Motion** | Animations |
| **Chart.js** | Charts |
| **Recharts** | Portfolio charts |
| **Axios** | HTTP client |

---

## 📁 Project Structure
stock-ai-trading-system/
│
├── backend/
│ ├── app/
│ │ ├── main.py # FastAPI entry
│ │ ├── config.py # Settings
│ │ ├── database.py # DB connection
│ │ │
│ │ ├── agents/ # Multi-agent system
│ │ │ ├── supervisor.py
│ │ │ ├── market_data_agent.py
│ │ │ ├── technical_analysis_agent.py
│ │ │ ├── prediction_agent.py
│ │ │ ├── decision_agent.py
│ │ │ ├── risk_management_agent.py
│ │ │ ├── portfolio_agent.py
│ │ │ ├── auto_trading_agent.py
│ │ │ └── scheduler.py
│ │ │
│ │ ├── models/ # SQLAlchemy models
│ │ │ ├── user.py
│ │ │ ├── stock.py
│ │ │ ├── portfolio.py
│ │ │ ├── watchlist.py
│ │ │ ├── prediction.py
│ │ │ ├── chat.py
│ │ │ ├── news.py
│ │ │ └── agent_log.py
│ │ │
│ │ ├── routers/ # API routes
│ │ │ ├── auth.py
│ │ │ ├── stocks.py
│ │ │ ├── portfolio.py
│ │ │ ├── watchlist.py
│ │ │ ├── trading.py
│ │ │ ├── chat.py
│ │ │ └── auto_trading.py
│ │ │
│ │ ├── providers/ # Data providers
│ │ │ ├── base.py
│ │ │ ├── factory.py
│ │ │ ├── yahoo_provider.py
│ │ │ └── mock_provider.py
│ │ │
│ │ ├── indicators/ # Technical indicators
│ │ │ └── technical.py
│ │ │
│ │ ├── ml/ # ML pipeline
│ │ │ └── models.py
│ │ │
│ │ ├── risk/ # Risk management
│ │ │ └── risk_manager.py
│ │ │
│ │ └── trading/ # Paper trading engine
│ │ └── paper_trading_engine.py
│ │
│ ├── scripts/
│ │ ├── setup_database.py
│ │ ├── seed_stocks.py
│ │ ├── seed_indices.py
│ │ └── migrate_agent_columns.py
│ │
│ ├── requirements.txt
│ └── .env
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── Header.jsx
│ │ │ ├── StockCard.jsx
│ │ │ ├── MarketOverview.jsx
│ │ │ ├── MarketMovers.jsx
│ │ │ ├── PortfolioCharts.jsx
│ │ │ └── Chatbot.jsx
│ │ │
│ │ ├── pages/
│ │ │ ├── Dashboard.jsx
│ │ │ ├── StockDetail.jsx
│ │ │ ├── Portfolio.jsx
│ │ │ ├── Watchlist.jsx
│ │ │ ├── AutoTrading.jsx
│ │ │ └── Login.jsx
│ │ │
│ │ ├── context/
│ │ │ ├── AuthContext.jsx
│ │ │ └── ThemeContext.jsx
│ │ │
│ │ ├── services/
│ │ │ └── api.js
│ │ │
│ │ ├── App.jsx
│ │ ├── main.jsx
│ │ └── index.css
│ │
│ ├── package.json
│ └── vite.config.js
│
└── README.md

text

---

## 🚀 Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- *(Optional)* SQL Server LocalDB or SQL Server Express (defaults to built-in SQLite)

### 1️⃣ Quick Start (Windows)

Simply run:
```powershell
.\run_all.bat
```
This automatically launches both the FastAPI Backend and the React Frontend in separate windows!

---

### 2️⃣ Manual Setup

#### Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed Indian stocks and indices
python scripts\seed_stocks.py
python scripts\seed_indices.py

# Start Backend Server
python -m uvicorn app.main:app --port 8000 --host 0.0.0.0
```
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

#### Frontend Setup

```powershell
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```
- Frontend Web App: `http://localhost:5173`

🔌 API Endpoints
Authentication
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login & get JWT
GET	/api/auth/me	Get current user
Stocks
Method	Endpoint	Description
GET	/api/stocks/	List all stocks
GET	/api/stocks/{symbol}	Get stock detail
GET	/api/stocks/{symbol}/history	Historical prices
GET	/api/stocks/{symbol}/analysis	Full AI analysis
GET	/api/stocks/market/indices	Market indices
GET	/api/stocks/market/movers	Top gainers/losers
Portfolio & Trading
Method	Endpoint	Description
GET	/api/portfolio/	Portfolio summary
GET	/api/portfolio/transactions	Transaction history
POST	/api/trading/buy	Buy stock
POST	/api/trading/sell	Sell stock
Watchlist
Method	Endpoint	Description
GET	/api/watchlist/	Get watchlist
POST	/api/watchlist/	Add stock
DELETE	/api/watchlist/{id}	Remove stock
Auto-Trading Agent
Method	Endpoint	Description
GET	/api/auto-trading/status	Agent status
POST	/api/auto-trading/start	Start agent
POST	/api/auto-trading/stop	Stop agent
POST	/api/auto-trading/run-cycle	Manual run
POST	/api/auto-trading/emergency-stop	Kill switch
GET	/api/auto-trading/logs	Activity logs
GET	/api/auto-trading/stats	Performance stats
Chatbot
Method	Endpoint	Description
POST	/api/chat/	Send message
GET	/api/chat/sessions	Chat history
📸 Screenshots
🏠 Dashboard
https://docs/screenshots/dashboard.png
Market Overview with live indices, top gainers/losers, and stock cards

📈 Stock Analysis
https://docs/screenshots/stock-detail.png
Detailed analysis with price chart, ML predictions, and technical indicators

💼 Portfolio
https://docs/screenshots/portfolio.png
Portfolio with allocation pie chart and stock-wise P&L

🤖 AI Auto-Trading Agent
https://docs/screenshots/auto-trading.png
Autonomous trading agent with market hours, P&L tracking, and activity logs

💬 Multilingual Chatbot
https://docs/screenshots/chatbot.png
AI assistant supporting English, Hindi, and Marathi

🌙 Dark Mode
https://docs/screenshots/dark-mode.png
Modern dark theme with glassmorphism design


🧪 Testing
powershell
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
⚠️ Limitations
Paper Trading Only — No real broker integration

ML Predictions — Not guaranteed, statistical estimates only

Yahoo Finance — Free tier has rate limits

Market Hours — Auto-trading works only 9:15 AM – 3:30 PM IST

No Options/Futures — Only equity stocks supported

Single User per Session — No concurrent user testing

🔮 Future Enhancements
□ News + Sentiment Analysis
□ Backtesting Engine
□ Real Broker Integration (Zerodha, Upstox)
□ LSTM / Transformer Models
□ Price Alerts & Notifications
□ Multi-user portfolio comparison
□ Advanced screening (P/E, RSI, volume)
□ Mobile app (React Native)
□ Docker deployment
□ Cloud hosting (AWS/GCP)

👨‍💻 Author
Your Name
Final Year Engineering Student
[Your College Name]

📧 Email: your.email@example.com

🔗 LinkedIn: Your Profile

🐙 GitHub: @yourusername

📄 License
This project is for educational purposes only.
Not for commercial use.
Not financial advice.

🙏 Acknowledgments
Yahoo Finance — Real market data

FastAPI — Backend framework

React — Frontend library

scikit-learn — ML models

Framer Motion — Animations

<div align="center">
⭐ Star this repo if you found it helpful!

Made with ❤️ for learning

</div> ```
		