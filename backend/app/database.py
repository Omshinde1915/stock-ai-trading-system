"""
Database connection & session management.
Supports SQLite and SQL Server LocalDB.
"""
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Ensure backend/.env is loaded regardless of working directory
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Check SQLite configuration (defaults to true for portable setup)
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL or USE_SQLITE or DATABASE_URL.startswith("sqlite"):
    db_file = Path(__file__).resolve().parent.parent / "stock_trading.db"
    DATABASE_URL = f"sqlite:///{db_file.as_posix()}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
        connect_args={
            "timeout": 30,
        },
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    from app.models import (
        user,
        stock,
        watchlist,
        portfolio,
        prediction,
        chat,
        news,
        agent_log,
        scheduled_order,
    )
    Base.metadata.create_all(bind=engine)
    try:
        print("[OK] Database tables created successfully!")
    except UnicodeEncodeError:
        print("Database tables created successfully!")


def test_connection():
    """Test database connection."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            try:
                print("[OK] Database connection successful!")
            except UnicodeEncodeError:
                print("Database connection successful!")
            return True
    except Exception as e:
        try:
            print(f"[FAIL] Connection failed: {e}")
        except UnicodeEncodeError:
            print("Connection failed.")
        return False
