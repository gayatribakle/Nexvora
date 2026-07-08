"""
Database Cleanup Script - Removes all data except Government Schemes
Cleans 23 tables, preserves schemes table structure and data
"""
import os
import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "data" / "safety_monitor.db"

# Tables to clean (all except schemes)
TABLES_TO_CLEAN = [
    "users",
    "workers",
    "sites",
    "worker_images",
    "employee_embeddings",
    "cameras",
    "uploaded_videos",
    "violations",
    "evidence",
    "violation_review_queue",
    "fines",
    "alerts",
    "penalty_rules",
    "safety_history",
    "trainings",
    "worker_trainings",
    "quizzes",
    "quiz_attempts",
    "reports",
    "emergency_alerts",
    "system_logs",
    "notification_history",
    "worker_schemes",  # Cleaning this since workers will be deleted
]

# Table to preserve
TABLES_TO_PRESERVE = ["schemes"]

def cleanup_database():
    """Delete all data from specified tables"""
    if not DB_PATH.exists():
        print(f"❌ Database not found: {DB_PATH}")
        return False
    
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Get list of existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {row[0] for row in cursor.fetchall()}
        
        print("🗑️  Starting database cleanup...")
        print(f"📊 Database: {DB_PATH}\n")
        
        # Clean specified tables
        cleaned_count = 0
        for table in TABLES_TO_CLEAN:
            if table in existing_tables:
                try:
                    cursor.execute(f"DELETE FROM {table}")
                    deleted_rows = cursor.rowcount
                    print(f"  ✅ {table:<30} - Deleted {deleted_rows} records")
                    cleaned_count += 1
                except sqlite3.Error as e:
                    print(f"  ⚠️  {table:<30} - Error: {e}")
            else:
                print(f"  ⏭️  {table:<30} - Table not found (skipped)")
        
        # Verify preserved tables
        print(f"\n📌 Preserved tables:")
        for table in TABLES_TO_PRESERVE:
            if table in existing_tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  ✅ {table:<30} - {count} records preserved")
            else:
                print(f"  ⏭️  {table:<30} - Not found")
        
        # Commit changes
        conn.commit()
        
        # Show final stats
        print(f"\n📈 Summary:")
        print(f"  • Tables cleaned: {cleaned_count}")
        print(f"  • Tables preserved: {len(TABLES_TO_PRESERVE)}")
        print(f"\n✅ Database cleanup completed successfully!")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = cleanup_database()
    exit(0 if success else 1)
