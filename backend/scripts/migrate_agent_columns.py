"""
Migration script - Add P&L columns to agent tables.
Run: python scripts/migrate_agent_columns.py
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text


def run_migrations():
    """Add new columns for P&L tracking."""
    migrations = [
        ("agent_logs", "pnl", "ALTER TABLE agent_logs ADD pnl DECIMAL(15,2) NULL"),
        ("agent_logs", "pnl_pct", "ALTER TABLE agent_logs ADD pnl_pct DECIMAL(8,2) NULL"),
        ("agent_configs", "total_invested", "ALTER TABLE agent_configs ADD total_invested DECIMAL(15,2) DEFAULT 0"),
        ("agent_configs", "total_realized_pnl", "ALTER TABLE agent_configs ADD total_realized_pnl DECIMAL(15,2) DEFAULT 0"),
        ("agent_configs", "winning_trades", "ALTER TABLE agent_configs ADD winning_trades INT DEFAULT 0"),
        ("agent_configs", "losing_trades", "ALTER TABLE agent_configs ADD losing_trades INT DEFAULT 0"),
    ]

    print("=" * 60)
    print("🔄 Running Agent P&L Migration")
    print("=" * 60)

    with engine.connect() as conn:
        for table, column, sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"✅ Added: {table}.{column}")
            except Exception as e:
                error_msg = str(e)[:80]
                if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                    print(f"⏭️  Skipped: {table}.{column} (already exists)")
                else:
                    print(f"⚠️  Error on {table}.{column}: {error_msg}")

    print()
    print("=" * 60)
    print("✅ Migration complete!")
    print("=" * 60)


if __name__ == "__main__":
    run_migrations()