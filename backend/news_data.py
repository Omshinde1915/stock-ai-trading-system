# news_data.py
# Sample news data with symbols + full_content
# Replace with real news scraping/API later

NEWS_DATA = [
    {
        "id": 1,
        "title": "NIFTY 50 Crosses 23,500 Mark Amid Strong Banking Rally",
        "description": "Indian markets rallied today with NIFTY 50 crossing 23,500 for the first time. Banking stocks led the rally.",
        "full_content": """Indian equity markets witnessed a strong rally on Thursday with the benchmark NIFTY 50 index crossing the 23,500 mark for the first time in history. The rally was led by banking and financial services stocks.

HDFC Bank gained 2.3% to close at Rs.1,680, while ICICI Bank surged 2.1% to Rs.1,245. Other banking majors like Axis Bank and Kotak Mahindra Bank also posted gains of over 1.5%.

Market analysts attribute this rally to strong FII inflows, positive global cues from US markets, better-than-expected quarterly results, and expectations of a rate cut in the upcoming RBI policy meeting.

However, experts advise caution at current levels as valuations are stretched. Investors should focus on quality stocks with strong fundamentals.""",
        "source": "Economic Times",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.85,
        "published_at": "2026-10-09T10:30:00",
        "url": "#",
        "symbols": ["HDFCBANK", "ICICIBANK", "AXISBANK", "KOTAKBANK"],
    },
    {
        "id": 2,
        "title": "RBI Keeps Interest Rates Unchanged, Signals Stable Policy",
        "description": "The Reserve Bank of India maintained status quo on repo rate at 6.5%. Governor emphasized inflation control.",
        "full_content": """The Reserve Bank of India (RBI) in its bi-monthly monetary policy review decided to keep the repo rate unchanged at 6.5% for the tenth consecutive time.

The Monetary Policy Committee (MPC) voted 5-1 in favor of maintaining status quo. The RBI Governor emphasized that the central bank remains focused on bringing inflation down to the 4% target while supporting economic growth.

Key highlights:
- Repo rate: Unchanged at 6.5%
- Reverse repo rate: Unchanged at 3.35%
- CRR: Unchanged at 4.5%
- GDP growth projection: 7.2% for FY25
- Inflation projection: 4.5% for FY25

Market participants welcomed the decision as it provides stability and predictability. Banking stocks gained marginally after the announcement.""",
        "source": "Business Standard",
        "sentiment": "NEUTRAL",
        "sentiment_score": 0.10,
        "published_at": "2026-10-09T09:00:00",
        "url": "#",
        "symbols": ["HDFCBANK", "ICICIBANK", "SBIN"],
    },
    {
        "id": 3,
        "title": "IT Sector Under Pressure as US Clients Defer Projects",
        "description": "Major IT companies including TCS, Infosys face headwinds as US clients postpone spending.",
        "full_content": """The Indian IT sector is facing significant headwinds as major clients in the United States are deferring discretionary spending amid economic uncertainty.

Top IT companies including TCS, Infosys, Wipro, and HCL Technologies have reported slower deal wins and longer sales cycles in the recent quarter.

Key challenges facing the sector:
1. Reduced IT budgets by US clients
2. Project deferrals and cancellations
3. Pricing pressure
4. Currency headwinds
5. Increased competition from AI-based solutions

Analysts expect IT companies to report muted growth in the coming quarters. However, they believe the long-term outlook remains positive due to digital transformation demand, cloud migration projects, and AI opportunities.""",
        "source": "Mint",
        "sentiment": "NEGATIVE",
        "sentiment_score": -0.65,
        "published_at": "2026-10-09T08:15:00",
        "url": "#",
        "symbols": ["TCS", "INFY", "WIPRO", "HCLTECH"],
    },
    {
        "id": 4,
        "title": "Reliance Industries Reports Strong Q3 Results",
        "description": "RIL posted 12% YoY growth in net profit driven by retail and telecom segments.",
        "full_content": """Reliance Industries Limited (RIL) reported strong Q3 FY25 results with consolidated net profit growing 12% year-on-year to Rs.19,641 crore.

Key highlights:
- Revenue: Rs.2.43 lakh crore (up 10% YoY)
- EBITDA: Rs.43,000 crore (up 15% YoY)
- Net Profit: Rs.19,641 crore (up 12% YoY)
- Jio Subscribers: Added 5 million, total base at 470 million
- Retail Business: Revenue up 18% YoY

Segment performance:
- Oil-to-Chemicals (O2C): Stable performance
- Jio (Digital Services): Strong growth in ARPU
- Retail: Continued expansion, 18,000+ stores
- Oil and Gas: Higher production

Markets reacted positively with RIL stock gaining 3% in early trade.""",
        "source": "Moneycontrol",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.78,
        "published_at": "2026-10-09T07:45:00",
        "url": "#",
        "symbols": ["RELIANCE"],
    },
    {
        "id": 5,
        "title": "TCS Wins $500 Million Deal from European Bank",
        "description": "Tata Consultancy Services bags multi-year digital transformation contract.",
        "full_content": """Tata Consultancy Services (TCS) has won a $500 million multi-year contract from a leading European bank for digital transformation services.

The deal spans across core banking modernization, cloud migration, and AI-driven customer experience platforms. TCS will deploy a dedicated team of over 2,000 engineers across Europe and India.

This win comes as a strong positive for TCS after the recent IT sector slowdown concerns. The company's order book remains robust with strong deal wins across BFSI vertical.

TCS stock is expected to open higher on this news. Analysts maintain a 'Buy' rating with a target price of Rs.4,200.""",
        "source": "Economic Times",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.82,
        "published_at": "2026-10-09T07:00:00",
        "url": "#",
        "symbols": ["TCS"],
    },
    {
        "id": 6,
        "title": "Auto Sales Show Mixed Trends in September",
        "description": "Passenger vehicle sales grew 8% while two-wheeler sales declined 3%.",
        "full_content": """The Indian auto industry witnessed mixed sales trends in September 2024, with passenger vehicles (PV) outperforming two-wheelers.

Passenger Vehicles:
- Overall PV sales: Up 8% YoY
- Maruti Suzuki: 1.85 lakh units (up 10%)
- Hyundai: 65,000 units (up 6%)
- Tata Motors: 45,000 units (up 5%)

Two-Wheelers:
- Overall 2W sales: Down 3% YoY
- Hero MotoCorp: 5.5 lakh units (down 2%)
- Bajaj Auto: 3.5 lakh units (down 4%)
- TVS: 3.2 lakh units (up 1%)

Analysts expect sales to pick up in the festive season from October to December.""",
        "source": "Autocar India",
        "sentiment": "NEUTRAL",
        "sentiment_score": 0.15,
        "published_at": "2026-10-08T18:00:00",
        "url": "#",
        "symbols": ["MARUTI", "HYUNDAI", "TATAMOTORS", "HEROMOTOCO", "BAJAJ-AUTO"],
    },
    {
        "id": 7,
        "title": "Adani Group Stocks Recover After Recent Selloff",
        "description": "Adani Group stocks bounced back with gains of 3-5%.",
        "full_content": """Adani Group stocks staged a smart recovery today after facing selling pressure in recent sessions. Major group stocks gained 3-5% on value buying by institutional investors.

Stock Performance:
- Adani Enterprises: Up 5.2%
- Adani Ports: Up 4.1%
- Adani Green: Up 3.8%
- Adani Power: Up 3.5%
- Adani Total Gas: Up 3.2%

The recovery came after the group announced reduction in debt by Rs.15,000 crore, strong operational performance, new orders in infrastructure, and plans to expand renewable energy capacity.

Analysts at major brokerages said the recent correction has made valuations attractive. Some have upgraded the stocks to Buy with revised targets.""",
        "source": "Financial Express",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.55,
        "published_at": "2026-10-08T16:00:00",
        "url": "#",
        "symbols": ["ADANIENT", "ADANIPORTS", "ADANIGREEN", "ADANIPOWER"],
    },
    {
        "id": 8,
        "title": "Infosys Announces 1:1 Bonus Share Issue",
        "description": "Infosys board approves bonus issue and special dividend for shareholders.",
        "full_content": """Infosys Limited announced a 1:1 bonus share issue along with a special dividend of Rs.10 per share. The board approved the proposal in its meeting held today.

The record date for the bonus issue is expected to be in November 2026. Shareholders holding shares as of the record date will be eligible for the bonus shares.

This move is expected to improve liquidity and make the stock more accessible to retail investors. Infosys also reported strong Q2 results with revenue growth of 8% YoY.

Infosys stock jumped 4% on this announcement. Analysts see this as a positive sign for shareholder value creation.""",
        "source": "Mint",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.72,
        "published_at": "2026-10-08T14:30:00",
        "url": "#",
        "symbols": ["INFY"],
    },
    {
        "id": 9,
        "title": "HDFC Bank Q2 Net Profit Rises 15% YoY",
        "description": "Strong loan growth and improved asset quality drive HDFC Bank's profits.",
        "full_content": """HDFC Bank reported a 15% year-on-year growth in net profit for Q2 FY26, driven by strong loan growth and improved asset quality.

Key highlights:
- Net Profit: Rs.16,800 crore (up 15% YoY)
- Net Interest Income: Rs.30,500 crore (up 12% YoY)
- Gross NPA: 1.24% (improved from 1.32%)
- Net NPA: 0.32%
- Loan Growth: 14% YoY
- Deposit Growth: 18% YoY

The bank's management guided for continued growth momentum in the coming quarters. Digital initiatives and retail lending remain key focus areas.

HDFC Bank stock gained 1.5% after the results.""",
        "source": "Business Standard",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.76,
        "published_at": "2026-10-08T12:00:00",
        "url": "#",
        "symbols": ["HDFCBANK"],
    },
    {
        "id": 10,
        "title": "Tata Motors Reports Strong JLR Sales Growth",
        "description": "Jaguar Land Rover sales up 22% YoY driven by strong demand for EVs.",
        "full_content": """Tata Motors' luxury arm Jaguar Land Rover (JLR) reported a 22% year-on-year growth in global sales, driven by strong demand for electric vehicles and premium SUVs.

Sales Highlights:
- Total JLR sales: 1.2 lakh units (up 22%)
- Range Rover: 25,000 units
- Defender: 18,000 units
- EVs: 15,000 units (up 45%)

The company attributed this growth to strong demand in North America, Europe, and China. The new Range Rover Electric has received an overwhelming response with pre-orders crossing 50,000 units.

Tata Motors stock gained 2.8% following the announcement. Analysts maintain a positive outlook with a target price of Rs.1,100.""",
        "source": "Autocar India",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.68,
        "published_at": "2026-10-08T10:00:00",
        "url": "#",
        "symbols": ["TATAMOTORS"],
    },
    {
        "id": 11,
        "title": "Wipro Loses Major Contract to Accenture",
        "description": "Wipro loses a $200 million contract to rival Accenture, raising concerns about competitiveness.",
        "full_content": """Wipro has reportedly lost a major $200 million contract to global rival Accenture. The contract was for managing IT infrastructure for a Fortune 500 client.

This is seen as a setback for Wipro, which has been struggling to win large deals in recent quarters. The company's revenue growth has been slower compared to peers TCS and Infosys.

Key concerns:
1. Intense competition from global players
2. Pricing pressure in traditional services
3. Slow adoption of AI-based offerings
4. Leadership churn in key verticals

Analysts have downgraded Wipro stock to 'Hold' with reduced target price. The company needs to accelerate its transformation to remain competitive.""",
        "source": "Moneycontrol",
        "sentiment": "NEGATIVE",
        "sentiment_score": -0.58,
        "published_at": "2026-10-08T08:00:00",
        "url": "#",
        "symbols": ["WIPRO"],
    },
    {
        "id": 12,
        "title": "SBI Reports Record Quarterly Profit",
        "description": "State Bank of India posts highest-ever quarterly profit of Rs.18,500 crore.",
        "full_content": """State Bank of India (SBI), the country's largest lender, reported its highest-ever quarterly net profit of Rs.18,500 crore for Q2 FY26, up 22% YoY.

Key highlights:
- Net Profit: Rs.18,500 crore (up 22%)
- Net Interest Income: Rs.42,000 crore (up 14%)
- Gross NPA: 2.14% (improved from 2.45%)
- Net NPA: 0.58%
- Credit Growth: 15% YoY
- Deposit Growth: 12% YoY

The bank's strong performance was driven by robust loan growth across retail, SME, and corporate segments. Provision coverage ratio improved to 75%.

SBI stock jumped 3.5% on the results. Analysts have raised target prices citing strong fundamentals.""",
        "source": "Economic Times",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.80,
        "published_at": "2026-10-07T16:00:00",
        "url": "#",
        "symbols": ["SBIN"],
    },
    {
        "id": 13,
        "title": "Bharti Airtel Adds 3 Million Subscribers",
        "description": "Airtel continues strong subscriber growth, narrows gap with Jio.",
        "full_content": """Bharti Airtel added 3 million new subscribers in September 2026, continuing its strong growth momentum in the Indian telecom market.

Key metrics:
- Total subscribers: 380 million
- 4G/5G subscribers: 260 million
- ARPU: Rs.235 (up 8% YoY)
- Postpaid subscribers: 45 million

The company's 5G rollout is progressing well with coverage across 5,000+ towns. Airtel remains focused on premiumization and improving ARPU through value-added services.

Airtel stock gained 1.8% on this news. Analysts see continued growth potential with 5G monetization.""",
        "source": "Business Standard",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.65,
        "published_at": "2026-10-07T14:00:00",
        "url": "#",
        "symbols": ["BHARTIARTL"],
    },
    {
        "id": 14,
        "title": "Pharma Sector Faces Regulatory Heat from US FDA",
        "description": "Multiple Indian pharma companies receive warning letters from US FDA.",
        "full_content": """The Indian pharmaceutical sector is facing increased regulatory scrutiny from the US FDA. In the last quarter, at least 5 major Indian pharma companies received warning letters for manufacturing deficiencies.

Affected companies:
- Sun Pharma: Form 483 at Halol plant
- Dr. Reddy's: Warning letter for Duvvada facility
- Cipla: Observations at Goa plant
- Lupin: Issues at Aurangabad facility

The FDA has flagged issues related to data integrity, contamination control, and quality management systems. These could impact US sales for the affected companies.

Analysts advise caution on pharma stocks with high US exposure. Companies with clean regulatory records are better positioned.""",
        "source": "PharmaBiz",
        "sentiment": "NEGATIVE",
        "sentiment_score": -0.52,
        "published_at": "2026-10-07T10:00:00",
        "url": "#",
        "symbols": ["SUNPHARMA", "DRREDDY", "CIPLA", "LUPIN"],
    },
    {
        "id": 15,
        "title": "Bajaj Finance Reports Strong AUM Growth",
        "description": "Bajaj Finance's assets under management cross Rs.4 lakh crore milestone.",
        "full_content": """Bajaj Finance reported strong business updates for Q2 FY26 with assets under management (AUM) crossing the Rs.4 lakh crore milestone.

Key highlights:
- AUM: Rs.4.05 lakh crore (up 28% YoY)
- New loans disbursed: 9.5 million
- Customer franchise: 88 million (up 22%)
- Deposit book: Rs.65,000 crore
- Net NPA: 0.42%

The NBFC major continues to outperform peers with strong growth across consumer, SME, and commercial lending segments. Digital transformation initiatives are driving operational efficiency.

Bajaj Finance stock gained 2.5% on the update. Analysts remain bullish with a target price of Rs.9,500.""",
        "source": "Moneycontrol",
        "sentiment": "POSITIVE",
        "sentiment_score": 0.75,
        "published_at": "2026-10-07T08:00:00",
        "url": "#",
        "symbols": ["BAJFINANCE"],
    },
]