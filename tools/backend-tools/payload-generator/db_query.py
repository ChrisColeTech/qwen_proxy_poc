#!/usr/bin/env python3
"""
Database Query Tool for Real Test Data

This tool connects to the database and retrieves real IDs that can be used
in API tests to get valid 200/201 responses instead of 404s.
"""

import psycopg2
import os
from typing import Dict, List, Optional


class DatabaseQuery:
    def __init__(self, db_url: str):
        """Initialize database connection."""
        self.db_url = db_url
        self.connection = None
        self._connect()
    
    def _connect(self):
        """Connect to the PostgreSQL database."""
        try:
            self.connection = psycopg2.connect(self.db_url)
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise
    
    def get_real_ids(self) -> Dict[str, str]:
        """Get real IDs from database tables for testing."""
        real_ids = {}
        
        queries = {
            'user_id': "SELECT id FROM users LIMIT 1",
            'puzzle_id': "SELECT id FROM puzzles LIMIT 1", 
            'game_id': "SELECT id FROM games LIMIT 1",
            'tutorial_id': "SELECT id FROM tutorials LIMIT 1",
            'achievement_id': "SELECT id FROM achievements LIMIT 1",
            'learning_path_id': "SELECT id FROM learning_paths LIMIT 1",
            'opening_eco_code': "SELECT eco_code FROM openings LIMIT 1",
        }
        
        cursor = self.connection.cursor()
        
        for key, query in queries.items():
            try:
                cursor.execute(query)
                result = cursor.fetchone()
                if result:
                    real_ids[key] = str(result[0])
                else:
                    real_ids[key] = None
                    print(f"⚠️  No data found for {key}")
            except Exception as e:
                print(f"⚠️  Error querying {key}: {e}")
                real_ids[key] = None
        
        cursor.close()
        return real_ids
    
    def get_sample_data(self, table: str, limit: int = 1) -> List[Dict]:
        """Get sample data from a specific table."""
        cursor = self.connection.cursor()
        
        try:
            # Get column names
            cursor.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = %s 
                ORDER BY ordinal_position
            """, (table,))
            
            columns = cursor.fetchall()
            if not columns:
                return []
            
            column_names = [col[0] for col in columns]
            
            # Get sample data
            cursor.execute(f"SELECT * FROM {table} LIMIT %s", (limit,))
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            sample_data = []
            for row in rows:
                sample_data.append(dict(zip(column_names, row)))
            
            return sample_data
            
        except Exception as e:
            print(f"⚠️  Error getting sample data from {table}: {e}")
            return []
        finally:
            cursor.close()
    
    def close(self):
        """Close database connection."""
        if self.connection:
            self.connection.close()


def main():
    """Main function to query database and display real IDs."""
    # Load database URL from environment or config
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend-v2', '.env')
    
    db_url = None
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    db_url = line.split('=', 1)[1].strip()
                    break
    
    if not db_url:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    try:
        db = DatabaseQuery(db_url)
        
        print("🔍 Querying database for real test IDs...")
        real_ids = db.get_real_ids()
        
        print("\n📊 Real Database IDs:")
        for key, value in real_ids.items():
            status = "✅" if value else "❌"
            print(f"  {status} {key}: {value}")
        
        # Show sample data from key tables
        print("\n📋 Sample Data Preview:")
        for table in ['users', 'puzzles', 'games']:
            sample = db.get_sample_data(table, 1)
            if sample:
                print(f"\n  {table.upper()}:")
                for key, value in sample[0].items():
                    if key in ['id', 'username', 'title', 'fen']:
                        print(f"    {key}: {value}")
        
        db.close()
        
        # Save to file for payload generator to use
        import json
        output_file = os.path.join(os.path.dirname(__file__), 'real_test_ids.json')
        with open(output_file, 'w') as f:
            json.dump(real_ids, f, indent=2, default=str)
        
        print(f"\n💾 Real IDs saved to: {output_file}")
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()