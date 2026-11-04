"""
Seed 100+ Indian stocks into the database.
Run: python scripts/seed_stocks.py
"""
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.stock import Stock

# 100+ NSE stocks with sectors
STOCKS = [
    # Banking & Financial Services
    ("HDFCBANK", "HDFC Bank Limited", "Banking", "Private Bank", "INE040A01034"),
    ("ICICIBANK", "ICICI Bank Limited", "Banking", "Private Bank", "INE090A01021"),
    ("SBIN", "State Bank of India", "Banking", "Public Bank", "INE062A01020"),
    ("AXISBANK", "Axis Bank Limited", "Banking", "Private Bank", "INE238A01034"),
    ("KOTAKBANK", "Kotak Mahindra Bank Limited", "Banking", "Private Bank", "INE237A01028"),
    ("BAJFINANCE", "Bajaj Finance Limited", "Financial Services", "NBFC", "INE296A01024"),
    ("BAJAJFINSV", "Bajaj Finserv Limited", "Financial Services", "NBFC", "INE918I01026"),
    ("HDFCLIFE", "HDFC Life Insurance Company", "Insurance", "Life Insurance", "INE123W01016"),
    ("SBILIFE", "SBI Life Insurance Company", "Insurance", "Life Insurance", "INE913V01025"),
    ("INDUSINDBK", "IndusInd Bank Limited", "Banking", "Private Bank", "INE095A01012"),
    ("YESBANK", "Yes Bank Limited", "Banking", "Private Bank", "INE528G01035"),
    ("IDFCFIRSTB", "IDFC First Bank Limited", "Banking", "Private Bank", "INE092T01019"),
    
    # IT & Technology
    ("TCS", "Tata Consultancy Services Limited", "IT", "IT Services", "INE467B01029"),
    ("INFY", "Infosys Limited", "IT", "IT Services", "INE009A01021"),
    ("WIPRO", "Wipro Limited", "IT", "IT Services", "INE075A01020"),
    ("HCLTECH", "HCL Technologies Limited", "IT", "IT Services", "INE860A01027"),
    ("TECHM", "Tech Mahindra Limited", "IT", "IT Services", "INE669C01036"),
    ("LTIM", "LTIMindtree Limited", "IT", "IT Services", "INE214T01019"),
    ("PERSISTENT", "Persistent Systems Limited", "IT", "IT Services", "INE262H01021"),
    ("COFORGE", "Coforge Limited", "IT", "IT Services", "INE591G01017"),
    ("MPHASIS", "Mphasis Limited", "IT", "IT Services", "INE356A01018"),
    ("OFSS", "Oracle Financial Services Software", "IT", "IT Services", "INE881A01032"),
    
    # Automobile
    ("MARUTI", "Maruti Suzuki India Limited", "Automobile", "Passenger Vehicles", "INE585B01010"),
    ("TATAMOTORS", "Tata Motors Limited", "Automobile", "Passenger & Commercial", "INE155A01022"),
    ("M&M", "Mahindra & Mahindra Limited", "Automobile", "Utility Vehicles", "INE101A01026"),
    ("BAJAJ-AUTO", "Bajaj Auto Limited", "Automobile", "Two Wheelers", "INE203A01020"),
    ("EICHERMOT", "Eicher Motors Limited", "Automobile", "Two Wheelers", "INE066A01021"),
    ("HEROMOTOCO", "Hero MotoCorp Limited", "Automobile", "Two Wheelers", "INE158A01020"),
    ("TVSMOTOR", "TVS Motor Company Limited", "Automobile", "Two Wheelers", "INE925A01014"),
    ("ASHOKLEY", "Ashok Leyland Limited", "Automobile", "Commercial Vehicles", "INE208A01029"),
    ("BHARATFORG", "Bharat Forge Limited", "Automobile", "Auto Components", "INE465A01025"),
    ("MOTHERSON", "Samvardhana Motherson International", "Automobile", "Auto Components", "INE775A01035"),
    ("BOSCHLTD", "Bosch Limited", "Automobile", "Auto Components", "INE288A01013"),
    
    # FMCG
    ("HINDUNILVR", "Hindustan Unilever Limited", "FMCG", "Consumer Products", "INE030A01027"),
    ("ITC", "ITC Limited", "FMCG", "Diversified", "INE154A01025"),
    ("NESTLEIND", "Nestle India Limited", "FMCG", "Food Products", "INE239A01024"),
    ("BRITANNIA", "Britannia Industries Limited", "FMCG", "Food Products", "INE216A01030"),
    ("DABUR", "Dabur India Limited", "FMCG", "Personal Care", "INE016A01025"),
    ("GODREJCP", "Godrej Consumer Products", "FMCG", "Personal Care", "INE102A01024"),
    ("COLPAL", "Colgate-Palmolive India", "FMCG", "Personal Care", "INE259A01022"),
    ("MARICO", "Marico Limited", "FMCG", "Personal Care", "INE196A01026"),
    ("TATACONSUM", "Tata Consumer Products", "FMCG", "Food & Beverages", "INE192A01025"),
    ("UBL", "United Breweries Limited", "FMCG", "Beverages", "INE686F01025"),
    
    # Energy & Power
    ("RELIANCE", "Reliance Industries Limited", "Energy", "Refineries & Petrochemicals", "INE002A01018"),
    ("ONGC", "Oil and Natural Gas Corporation", "Energy", "Oil Exploration", "INE213A01029"),
    ("NTPC", "NTPC Limited", "Energy", "Power Generation", "INE733E01010"),
    ("POWERGRID", "Power Grid Corporation of India", "Energy", "Power Transmission", "INE752E01010"),
    ("ADANIGREEN", "Adani Green Energy Limited", "Energy", "Renewable Energy", "INE364U01010"),
    ("TATAPOWER", "Tata Power Company Limited", "Energy", "Power Generation", "INE245A01021"),
    ("BPCL", "Bharat Petroleum Corporation", "Energy", "Oil Marketing", "INE029A01011"),
    ("HPCL", "Hindustan Petroleum Corporation", "Energy", "Oil Marketing", "INE718A01015"),
    ("IOC", "Indian Oil Corporation Limited", "Energy", "Oil Marketing", "INE242A01014"),
    ("GAIL", "GAIL India Limited", "Energy", "Gas Distribution", "INE129A01019"),
    ("PETRONET", "Petronet LNG Limited", "Energy", "LNG", "INE347A01017"),
    ("ADANIPOWER", "Adani Power Limited", "Energy", "Power Generation", "INE814H01011"),
    
    # Pharma & Healthcare
    ("SUNPHARMA", "Sun Pharmaceutical Industries", "Pharma", "Pharmaceuticals", "INE044A01036"),
    ("CIPLA", "Cipla Limited", "Pharma", "Pharmaceuticals", "INE059A01026"),
    ("DRREDDY", "Dr. Reddy's Laboratories", "Pharma", "Pharmaceuticals", "INE089A01023"),
    ("DIVISLAB", "Divi's Laboratories Limited", "Pharma", "Pharmaceuticals", "INE361B01024"),
    ("LUPIN", "Lupin Limited", "Pharma", "Pharmaceuticals", "INE326A01037"),
    ("AUROPHARMA", "Aurobindo Pharma Limited", "Pharma", "Pharmaceuticals", "INE406A01037"),
    ("APOLLOHOSP", "Apollo Hospitals Enterprise", "Healthcare", "Hospitals", "INE437A01024"),
    ("FORTIS", "Fortis Healthcare Limited", "Healthcare", "Hospitals", "INE666F01028"),
    ("MAXHEALTH", "Max Healthcare Institute", "Healthcare", "Hospitals", "INE027H01010"),
    ("LAURUSLABS", "Laurus Labs Limited", "Pharma", "Pharmaceuticals", "INE669Q01014"),
    ("GRANULES", "Granules India Limited", "Pharma", "Pharmaceuticals", "INE111D01016"),
    ("ALKEM", "Alkem Laboratories Limited", "Pharma", "Pharmaceuticals", "INE737G01017"),
    
    # Metal & Mining
    ("TATASTEEL", "Tata Steel Limited", "Metal", "Steel", "INE081A01020"),
    ("JSWSTEEL", "JSW Steel Limited", "Metal", "Steel", "INE019A01038"),
    ("HINDALCO", "Hindalco Industries Limited", "Metal", "Aluminum", "INE038A01020"),
    ("VEDL", "Vedanta Limited", "Metal", "Diversified", "INE205A01025"),
    ("COALINDIA", "Coal India Limited", "Metal", "Coal", "INE522F01014"),
    ("NMDC", "NMDC Limited", "Metal", "Iron Ore", "INE584A01023"),
    ("SAIL", "Steel Authority of India", "Metal", "Steel", "INE114A01011"),
    ("JINDALSTEL", "Jindal Steel & Power", "Metal", "Steel", "INE749A01030"),
    ("NATIONALUM", "National Aluminium Company", "Metal", "Aluminum", "INE139A01034"),
    ("HINDZINC", "Hindustan Zinc Limited", "Metal", "Zinc", "INE267A01025"),
    
    # Telecom & Media
    ("BHARTIARTL", "Bharti Airtel Limited", "Telecom", "Telecom Services", "INE397D01024"),
    ("IDEA", "Vodafone Idea Limited", "Telecom", "Telecom Services", "INE669E01016"),
    ("INDUSTOWER", "Indus Towers Limited", "Telecom", "Infrastructure", "INE121J01017"),
    ("TATACOMM", "Tata Communications Limited", "Telecom", "Telecom Services", "INE151A01013"),
    ("ZOMATO", "Zomato Limited", "Tech", "Internet Platforms", "INE758T01015"),
    ("PAYTM", "One97 Communications (Paytm)", "Tech", "Fintech", "INE982J01020"),
    ("POLICYBZR", "PB Fintech (Policybazaar)", "Tech", "Fintech", "INE923B01022"),
    ("NYKAA", "FSN E-Commerce (Nykaa)", "Tech", "E-Commerce", "INE388Y01029"),
    
    # Infrastructure & Construction
    ("LT", "Larsen & Toubro Limited", "Infrastructure", "Construction", "INE018A01030"),
    ("ADANIPORTS", "Adani Ports and SEZ", "Infrastructure", "Ports", "INE742F01042"),
    ("ADANIENT", "Adani Enterprises Limited", "Infrastructure", "Diversified", "INE423A01024"),
    ("GMRINFRA", "GMR Airports Infrastructure", "Infrastructure", "Airports", "INE776C01039"),
    ("IRCTC", "Indian Railway Catering & Tourism", "Infrastructure", "Railways", "INE335Y01020"),
    ("CONCOR", "Container Corporation of India", "Infrastructure", "Logistics", "INE111A01025"),
    ("DLF", "DLF Limited", "Realty", "Real Estate", "INE271C01023"),
    ("GODREJPROP", "Godrej Properties Limited", "Realty", "Real Estate", "INE484J01027"),
    ("OBEROIRLTY", "Oberoi Realty Limited", "Realty", "Real Estate", "INE093I01010"),
    ("PRESTIGE", "Prestige Estates Projects", "Realty", "Real Estate", "INE811K01018"),
    
    # Chemicals
    ("UPL", "UPL Limited", "Chemicals", "Agrochemicals", "INE646A01019"),
    ("PIIND", "PI Industries Limited", "Chemicals", "Agrochemicals", "INE603J01030"),
    ("SRF", "SRF Limited", "Chemicals", "Diversified", "INE647A01010"),
    ("TATACHEM", "Tata Chemicals Limited", "Chemicals", "Chemicals", "INE092A01019"),
    ("DEEPAKNTR", "Deepak Nitrite Limited", "Chemicals", "Chemicals", "INE288B01029"),
    ("AARTIIND", "Aarti Industries Limited", "Chemicals", "Chemicals", "INE769A01020"),
    ("SOLARINDS", "Solar Industries India", "Chemicals", "Explosives", "INE147A01018"),
    
    # Cement
    ("ULTRACEMCO", "UltraTech Cement Limited", "Cement", "Cement", "INE481G01011"),
    ("AMBUJACEM", "Ambuja Cements Limited", "Cement", "Cement", "INE079A01024"),
    ("ACC", "ACC Limited", "Cement", "Cement", "INE012A01025"),
    ("SHREECEM", "Shree Cement Limited", "Cement", "Cement", "INE511A01022"),
    ("DALBHARAT", "Dalmia Bharat Limited", "Cement", "Cement", "INE00R191025"),
    
    # Aviation
    ("INDIGO", "InterGlobe Aviation (IndiGo)", "Aviation", "Airlines", "INE646L01027"),
    ("SPICEJET", "SpiceJet Limited", "Aviation", "Airlines", "INE092B01025"),
    
    # Additional important stocks
    ("PIDILITIND", "Pidilite Industries Limited", "Chemicals", "Adhesives", "INE320A01028"),
    ("HAVELLS", "Havells India Limited", "Electrical", "Consumer Electricals", "INE176B01034"),
    ("SIEMENS", "Siemens Limited", "Electrical", "Industrial", "INE003A01024"),
    ("ABB", "ABB India Limited", "Electrical", "Industrial", "INE117A01022"),
    ("BHEL", "Bharat Heavy Electricals", "Electrical", "Power Equipment", "INE257A01026"),
    ("BEL", "Bharat Electronics Limited", "Defense", "Defense Electronics", "INE263A01024"),
    ("HAL", "Hindustan Aeronautics Limited", "Defense", "Aerospace", "INE066F01012"),
    ("MUTHOOTFIN", "Muthoot Finance Limited", "Financial Services", "Gold Loans", "INE414G01025"),
    ("MANAPPURAM", "Manappuram Finance Limited", "Financial Services", "Gold Loans", "INE522D01027"),
    ("LICHSGFIN", "LIC Housing Finance Limited", "Financial Services", "Housing Finance", "INE115A01026"),
    ("CHOLAFIN", "Cholamandalam Investment", "Financial Services", "NBFC", "INE121A01025"),
    ("SHRIRAMFIN", "Shriram Finance Limited", "Financial Services", "NBFC", "INE722A01019"),
]


def seed_stocks():
    """Insert stocks into database."""
    db = SessionLocal()
    try:
        count = 0
        for symbol, company_name, sector, industry, isin in STOCKS:
            # Check if stock already exists
            existing = db.query(Stock).filter(Stock.symbol == symbol).first()
            if existing:
                print(f"⏭️  {symbol} already exists")
                continue
            
            # Create new stock
            stock = Stock(
                symbol=symbol,
                company_name=company_name,
                exchange="NSE",
                sector=sector,
                industry=industry,
                isin=isin,
                is_active=True
            )
            db.add(stock)
            count += 1
            print(f"✅ Added: {symbol} - {company_name}")
        
        db.commit()
        print(f"\n🎉 Successfully added {count} new stocks!")
        print(f"📊 Total stocks in database: {db.query(Stock).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_stocks()