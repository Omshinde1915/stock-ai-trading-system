"""
Chat router - Multilingual AI chatbot with REAL stock data.
Supports: English, Hindi, Marathi
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import re
import json

from app.database import get_db
from app.models.user import User
from app.models.stock import Stock
from app.models.chat import ChatSession, ChatMessage
from app.models.portfolio import PaperAccount, Holding
from app.routers.auth import get_current_user

router = APIRouter()


# ============ SCHEMAS ============
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

class ChatResponse(BaseModel):
    session_id: int
    response: str
    detected_language: str


# ============ LANGUAGE DETECTION ============
def detect_language(text: str) -> str:
    """Detect: en (English), hi (Hindi), mr (Marathi)"""
    # Check Devanagari script
    if re.search(r'[\u0900-\u097F]', text):
        marathi_markers = ['आहे', 'काय', 'मला', 'करा', 'सांगा', 'मध्ये', 'चा ', 'ची ', 'चे ', 'आहेत']
        if any(w in text for w in marathi_markers):
            return 'mr'
        return 'hi'  # Default Devanagari to Hindi
    
    # Romanized detection
    lower = text.lower()
    
    marathi_roman = ['aahe', 'ahe ', 'kay', 'mala', 'kara', 'sanga', 'kiti', 'majha', 'mazha', 'cha ', 'chi ', 'che ']
    hindi_roman = ['kya', 'hai', 'mujhe', 'batao', 'kaisa', 'karo', 'mera', 'meri', 'ka ', 'ki ', 'ke ']
    
    marathi_score = sum(1 for w in marathi_roman if w in lower)
    hindi_score = sum(1 for w in hindi_roman if w in lower)
    
    if marathi_score > hindi_score and marathi_score > 0:
        return 'mr'
    if hindi_score > 0:
        return 'hi'
    return 'en'


# ============ SYMBOL EXTRACTION ============
def extract_symbol(message: str, db: Session) -> Optional[str]:
    """Extract stock symbol from message"""
    known_stocks = db.query(Stock.symbol).all()
    known_symbols = {s[0].upper(): s[0] for s in known_stocks}
    
    # Extract uppercase/mixed case words
    words = re.findall(r'\b[A-Za-z]{2,20}\b', message)
    
    # Check exact matches first
    for word in words:
        upper = word.upper()
        if upper in known_symbols:
            return known_symbols[upper]
    
    # Check partial matches (e.g., "reliance" → "RELIANCE")
    for word in words:
        upper = word.upper()
        if len(upper) >= 4:
            for sym, orig in known_symbols.items():
                if upper in sym or sym in upper:
                    return orig
    
    return None


# ============ INTENT DETECTION ============
def detect_intent(message: str) -> str:
    """Detect user intent"""
    text = message.lower()
    
    greetings = ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'नमस्ते', 'नमस्कार']
    if any(w in text for w in greetings):
        return 'greeting'
    
    if any(w in text for w in ['rsi', 'relative strength']):
        return 'explain_rsi'
    
    if any(w in text for w in ['macd', 'moving average']):
        return 'explain_macd'
    
    if any(w in text for w in ['pe ratio', 'p/e']):
        return 'explain_pe'
    
    if any(w in text for w in ['portfolio', 'पोर्टफोलियो', 'पोर्टफोलिओ', 'holding', 'my stocks']):
        return 'portfolio'
    
    if any(w in text for w in ['watchlist', 'watch list', 'वॉचलिस्ट']):
        return 'watchlist'
    
    if any(w in text for w in ['help', 'what can you do', 'features']):
        return 'help'
    
    if any(w in text for w in ['risk', 'जोखीम', 'रिस्क']):
        return 'risk'
    
    if any(w in text for w in ['buy', 'kharid', 'खरेदी']):
        return 'buy'
    
    if any(w in text for w in ['sell', 'bech', 'विक्री']):
        return 'sell'
    
    # Default: analyze stock
    return 'analyze'


# ============ RESPONSE GENERATION ============
def generate_response(message: str, language: str, db: Session, user_id: int) -> str:
    """Generate response in user's language with real data"""
    
    intent = detect_intent(message)
    symbol = extract_symbol(message, db)
    
    # ============ GREETING ============
    if intent == 'greeting':
        if language == 'hi':
            return """🙏 नमस्ते! मैं आपका AI स्टॉक असिस्टेंट हूँ।

मैं आपकी इन चीज़ों में मदद कर सकता हूँ:
• 📊 किसी भी stock का analysis (जैसे "RELIANCE analyze करो")
• 🤖 ML prediction और BUY/SELL signal
• 📈 Technical indicators (RSI, MACD)
• 💼 आपका portfolio और P&L
• ⚠️ Risk analysis

बस stock का नाम लिखें और पूछें!"""
        
        if language == 'mr':
            return """🙏 नमस्कार! मी तुमचा AI स्टॉक असिस्टंट आहे.

मी यामध्ये मदत करू शकतो:
• 📊 कोणत्याही stock चे analysis (उदा. "RELIANCE analyze कर")
• 🤖 ML prediction आणि BUY/SELL signal
• 📈 Technical indicators (RSI, MACD)
• 💼 तुमचा portfolio आणि P&L
• ⚠️ Risk analysis

फक्त stock चे नाव टाका आणि विचारा!"""
        
        return """👋 Hello! I'm your AI Stock Assistant.

I can help you with:
• 📊 Analyze any stock (e.g., "Analyze RELIANCE")
• 🤖 ML predictions & BUY/SELL signals
• 📈 Technical indicators (RSI, MACD)
• 💼 Your portfolio & P&L
• ⚠️ Risk analysis

Just mention a stock symbol and ask away!"""
    
    # ============ HELP ============
    if intent == 'help':
        if language == 'hi':
            return """🤖 **मैं क्या कर सकता हूँ:**

1. **Stock Analysis:**
   • "RELIANCE का analysis करो"
   • "TCS का prediction बताओ"

2. **Technical:**
   • "What is RSI?"
   • "MACD explain करो"

3. **Portfolio:**
   • "मेरा portfolio दिखाओ"
   • "मेरा profit कितना है?"

4. **Trading:**
   • "HDFCBANK खरीदूं या नहीं?"
   • "SBIN बेच दूं?"

बस पूछें!"""
        
        if language == 'mr':
            return """🤖 **मी काय करू शकतो:**

1. **Stock Analysis:**
   • "RELIANCE चे analysis कर"
   • "TCS चा prediction सांगा"

2. **Technical:**
   • "RSI काय आहे?"
   • "MACD explain कर"

3. **Portfolio:**
   • "माझा portfolio दाखव"
   • "माझा profit किती आहे?"

4. **Trading:**
   • "HDFCBANK घ्यावा का?"
   • "SBIN विकावा का?"

विचारा!"""
        
        return """🤖 **What I can do:**

1. **Stock Analysis:**
   • "Analyze RELIANCE"
   • "TCS prediction"

2. **Technical:**
   • "What is RSI?"
   • "Explain MACD"

3. **Portfolio:**
   • "Show my portfolio"
   • "What is my profit?"

4. **Trading:**
   • "Should I buy HDFCBANK?"
   • "Should I sell SBIN?"

Ask away!"""
    
    # ============ EXPLAIN RSI ============
    if intent == 'explain_rsi':
        if language == 'hi':
            return """📊 **RSI (Relative Strength Index)**

RSI एक momentum indicator है जो 0-100 के बीच होता है।

**कैसे पढ़ें:**
• **RSI > 70** → Overbought (ज़्यादा खरीदा गया) - बेचने का signal 🚨
• **RSI < 30** → Oversold (ज़्यादा बेचा गया) - खरीदने का signal ✅
• **RSI 40-60** → Neutral zone

**Formula:** RSI = 100 - (100 / (1 + RS))
जहाँ RS = Average Gain / Average Loss

**Use case:** जब RSI 30 के नीचे हो, तो stock उठ सकता है।"""
        
        if language == 'mr':
            return """📊 **RSI (Relative Strength Index)**

RSI हा 0-100 दरम्यान असणारा momentum indicator आहे.

**कसा वाचायचा:**
• **RSI > 70** → Overbought (जास्त खरेदी) - विकण्याचा signal 🚨
• **RSI < 30** → Oversold (जास्त विक्री) - खरेदीचा signal ✅
• **RSI 40-60** → Neutral zone

**Formula:** RSI = 100 - (100 / (1 + RS))
जिथे RS = Average Gain / Average Loss"""
        
        return """📊 **RSI (Relative Strength Index)**

RSI is a momentum indicator ranging 0-100.

**How to read:**
• **RSI > 70** → Overbought - Sell signal 🚨
• **RSI < 30** → Oversold - Buy signal ✅
• **RSI 40-60** → Neutral zone

**Formula:** RSI = 100 - (100 / (1 + RS))
Where RS = Average Gain / Average Loss

**Use case:** When RSI drops below 30, stock may bounce back."""
    
    # ============ EXPLAIN MACD ============
    if intent == 'explain_macd':
        if language == 'hi':
            return """📊 **MACD (Moving Average Convergence Divergence)**

MACD दो EMAs का फर्क है (12-day और 26-day).

**Components:**
• **MACD Line** = 12-day EMA - 26-day EMA
• **Signal Line** = 9-day EMA of MACD
• **Histogram** = MACD - Signal

**Signals:**
• MACD > Signal → **Bullish** ✅
• MACD < Signal → **Bearish** ❌
• Crossover above zero → Strong buy"""
        
        if language == 'mr':
            return """📊 **MACD (Moving Average Convergence Divergence)**

MACD दोन EMAs (12-day आणि 26-day) मधील फरक आहे.

**Components:**
• **MACD Line** = 12-day EMA - 26-day EMA
• **Signal Line** = 9-day EMA of MACD
• **Histogram** = MACD - Signal

**Signals:**
• MACD > Signal → **Bullish** ✅
• MACD < Signal → **Bearish** ❌"""
        
        return """📊 **MACD (Moving Average Convergence Divergence)**

MACD is the difference between two EMAs (12-day and 26-day).

**Components:**
• **MACD Line** = 12-day EMA - 26-day EMA
• **Signal Line** = 9-day EMA of MACD
• **Histogram** = MACD - Signal

**Signals:**
• MACD > Signal → **Bullish** ✅
• MACD < Signal → **Bearish** ❌
• Crossover above zero → Strong buy"""
    
    # ============ PORTFOLIO ============
    if intent == 'portfolio':
        account = db.query(PaperAccount).filter(
            PaperAccount.user_id == user_id
        ).first()
        
        if not account:
            if language == 'hi':
                return "❌ आपका portfolio अभी खाली है। कोई stock खरीदें!"
            if language == 'mr':
                return "❌ तुमचा portfolio रिकामा आहे. काही stock खरेदी करा!"
            return "❌ Your portfolio is empty. Buy some stocks!"
        
        holdings = db.query(Holding).filter(
            Holding.user_id == user_id,
            Holding.quantity > 0
        ).all()
        
        cash = float(account.virtual_balance)
        
        if not holdings:
            if language == 'hi':
                return f"""💼 **आपका Portfolio:**

💰 Cash Balance: ₹{cash:,.2f}
📊 Holdings: कोई नहीं

Stock खरीदने के लिए Dashboard से stock select करें।"""
            if language == 'mr':
                return f"""💼 **तुमचा Portfolio:**

💰 Cash Balance: ₹{cash:,.2f}
📊 Holdings: काही नाही

Stock खरेदीसाठी Dashboard वरून stock निवडा."""
            return f"""💼 **Your Portfolio:**

💰 Cash Balance: ₹{cash:,.2f}
📊 Holdings: None

Buy stocks from Dashboard to start trading!"""
        
        # Build holdings list
        holdings_lines = []
        total_invested = 0
        total_current = 0
        
        for h in holdings:
            stock = db.query(Stock).filter(Stock.id == h.stock_id).first()
            if stock:
                qty = int(h.quantity)
                avg = float(h.average_price)
                invested = avg * qty
                total_invested += invested
                holdings_lines.append(
                    f"• **{stock.symbol}**: {qty} shares @ ₹{avg:.2f} (₹{invested:,.2f})"
                )
        
        holdings_text = "\n".join(holdings_lines)
        
        if language == 'hi':
            return f"""💼 **आपका Portfolio:**

💰 Cash: ₹{cash:,.2f}
📊 Holdings ({len(holdings)}):
{holdings_text}

कुल निवेश: ₹{total_invested:,.2f}

पूरा P&L देखने के लिए Portfolio page पर जाएं।"""
        
        if language == 'mr':
            return f"""💼 **तुमचा Portfolio:**

💰 Cash: ₹{cash:,.2f}
📊 Holdings ({len(holdings)}):
{holdings_text}

एकूण गुंतवणूक: ₹{total_invested:,.2f}

पूर्ण P&L साठी Portfolio page वर जा."""
        
        return f"""💼 **Your Portfolio:**

💰 Cash: ₹{cash:,.2f}
📊 Holdings ({len(holdings)}):
{holdings_text}

Total Invested: ₹{total_invested:,.2f}

Visit Portfolio page for full P&L details."""
    
    # ============ NO SYMBOL FOUND ============
    if not symbol:
        if language == 'hi':
            return """❓ मुझे stock का नाम समझ नहीं आया।

कृपया साफ़ लिखें:
• "RELIANCE analyze करो"
• "TCS prediction बताओ"
• "HDFCBANK risk क्या है?"

या पूछें: "What can you do?" """
        
        if language == 'mr':
            return """❓ मला stock चे नाव समजले नाही.

कृपया स्पष्ट लिहा:
• "RELIANCE analyze कर"
• "TCS prediction सांगा"
• "HDFCBANK चा risk काय?"

किंवा विचारा: "तू काय करू शकतोस?"""
        
        return """❓ I couldn't find a stock name.

Please try:
• "Analyze RELIANCE"
• "TCS prediction"
• "HDFCBANK risk"

Or ask: "What can you do?"""
    
    # ============ ANALYZE STOCK ============
    try:
        from app.agents.supervisor import StockTradingSupervisor
        supervisor = StockTradingSupervisor()
        analysis = supervisor.analyze(symbol)
        
        # Get additional data
        stock = db.query(Stock).filter(Stock.symbol == symbol).first()
        company_name = stock.company_name if stock else symbol
        
        price = analysis.get('current_price', 0)
        decision = analysis.get('decision', 'HOLD')
        confidence = analysis.get('confidence', 0)
        risk = analysis.get('risk_level', 'MEDIUM')
        opportunity = analysis.get('opportunity_score', 0)
        target = analysis.get('target', 0)
        stop_loss = analysis.get('stop_loss', 0)
        
        # Get prediction
        prediction = analysis.get('prediction', {})
        expected_return = prediction.get('expected_return_pct', 0)
        
        # Get technical
        technical = analysis.get('technical', {})
        rsi = technical.get('rsi_14', 'N/A')
        
        reasons = analysis.get('reasons', [])[:3]
        reasons_text = "\n".join(f"  {i+1}. {r}" for i, r in enumerate(reasons))
        
        # Signal emoji
        signal_emoji = "🟢" if decision == "BUY" else "🔴" if decision == "SELL" else "🟡"
        
        # ===== HINDI =====
        if language == 'hi':
            return f"""📊 **{symbol} - {company_name}**

💰 **वर्तमान मूल्य:** ₹{price:.2f}
{signal_emoji} **सिग्नल:** **{decision}**
🎯 **विश्वास:** {confidence}%
⚠️ **जोखिम:** {risk}
📈 **अवसर स्कोर:** {opportunity}/100

🔮 **AI Prediction:**
• अंदाजित रिटर्न: **{expected_return:+.2f}%**
• लक्ष्य: ₹{target:.2f}
• Stop-loss: ₹{stop_loss:.2f}

📉 **तकनीकी:**
• RSI: {rsi}

💡 **कारण:**
{reasons_text}

⚠️ _यह शैक्षिक विश्लेषण है, निवेश सलाह नहीं।_"""
        
        # ===== MARATHI =====
        if language == 'mr':
            return f"""📊 **{symbol} - {company_name}**

💰 **सध्याची किंमत:** ₹{price:.2f}
{signal_emoji} **सिग्नल:** **{decision}**
🎯 **विश्वास:** {confidence}%
⚠️ **जोखीम:** {risk}
📈 **संधी स्कोअर:** {opportunity}/100

🔮 **AI Prediction:**
• अपेक्षित परतावा: **{expected_return:+.2f}%**
• लक्ष्य: ₹{target:.2f}
• Stop-loss: ₹{stop_loss:.2f}

📉 **तांत्रिक:**
• RSI: {rsi}

💡 **कारण:**
{reasons_text}

⚠️ _हे शैक्षणिक विश्लेषण आहे, गुंतवणूक सल्ला नाही._"""
        
        # ===== ENGLISH =====
        return f"""📊 **{symbol} - {company_name}**

💰 **Current Price:** ₹{price:.2f}
{signal_emoji} **Signal:** **{decision}**
🎯 **Confidence:** {confidence}%
⚠️ **Risk:** {risk}
📈 **Opportunity Score:** {opportunity}/100

🔮 **AI Prediction:**
• Expected Return: **{expected_return:+.2f}%**
• Target: ₹{target:.2f}
• Stop-loss: ₹{stop_loss:.2f}

📉 **Technical:**
• RSI: {rsi}

💡 **Reasons:**
{reasons_text}

⚠️ _Educational analysis, not investment advice._"""
    
    except Exception as e:
        error_msg = str(e)[:100]
        if language == 'hi':
            return f"❌ {symbol} का data उपलब्ध नहीं है।\nError: {error_msg}"
        if language == 'mr':
            return f"❌ {symbol} चा data उपलब्ध नाही.\nError: {error_msg}"
        return f"❌ Data for {symbol} is unavailable.\nError: {error_msg}"


# ============ ROUTES ============
@router.post("/", response_model=ChatResponse)
def chat(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get or create session
    if chat_request.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == chat_request.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ChatSession(
            user_id=current_user.id,
            title=chat_request.message[:50]
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Detect language & generate response
    language = detect_language(chat_request.message)
    response = generate_response(chat_request.message, language, db, current_user.id)

    # Save message
    message = ChatMessage(
        session_id=session.id,
        user_message=chat_request.message,
        assistant_response=response,
        detected_language=language
    )
    db.add(message)
    db.commit()

    return ChatResponse(
        session_id=session.id,
        response=response,
        detected_language=language
    )


@router.get("/sessions")
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "created_at": str(s.created_at)
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}/messages")
def get_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "user_message": m.user_message,
            "assistant_response": m.assistant_response,
            "detected_language": m.detected_language,
            "created_at": str(m.created_at)
        }
        for m in messages
    ]