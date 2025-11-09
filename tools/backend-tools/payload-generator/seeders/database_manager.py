#!/usr/bin/env python3
"""
Database Manager Module

Handles database connections, table operations, and record management.
Provides reusable database utilities for the seeding system.
"""

import os
import psycopg2
import json
from typing import Dict, List, Any, Optional, Tuple
from contextlib import contextmanager


class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self):
        self.database_url = self._get_database_url()
    
    def _get_database_url(self) -> str:
        """Get database URL from environment or .env file"""
        # Try environment variable first
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            return db_url
        
        # Try to read from .env file
        try:
            env_path = os.path.join(os.path.dirname(__file__), '../../../../backend-v2/.env')
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        return line.split('=', 1)[1]
        except FileNotFoundError:
            pass
        
        raise ValueError("No database URL found. Set DATABASE_URL environment variable or .env file.")
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = psycopg2.connect(self.database_url)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"❌ Database error: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = %s
                    );
                """, (table_name,))
                return cursor.fetchone()[0]
    
    def get_table_columns(self, table_name: str) -> List[Dict[str, str]]:
        """Get column information for a table"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position;
                """, (table_name,))
                
                columns = []
                for row in cursor.fetchall():
                    columns.append({
                        'name': row[0],
                        'type': row[1],
                        'nullable': row[2] == 'YES',
                        'default': row[3]
                    })
                return columns
    
    def record_exists(self, table_name: str, id_column: str, id_value: Any) -> bool:
        """Check if a record exists"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT EXISTS (
                        SELECT 1 FROM {table_name} WHERE {id_column} = %s
                    );
                """, (id_value,))
                return cursor.fetchone()[0]
    
    def insert_record(self, table_name: str, data: Dict[str, Any], 
                     conflict_resolution: str = "DO NOTHING") -> Optional[Any]:
        """
        Insert a record into the database with conflict resolution
        
        Args:
            table_name: Name of the table
            data: Dictionary of column_name -> value
            conflict_resolution: How to handle conflicts ("DO NOTHING", "UPDATE", custom)
            
        Returns:
            The ID of the inserted/updated record, or None if no operation occurred
        """
        if not data:
            return None
            
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Build the INSERT statement
                columns = list(data.keys())
                placeholders = ', '.join(['%s'] * len(columns))
                values = [data[col] for col in columns]
                
                # Determine the ID column (usually 'id' or first column)
                id_column = 'id' if 'id' in columns else columns[0]
                
                if conflict_resolution == "DO NOTHING":
                    query = f"""
                        INSERT INTO {table_name} ({', '.join(columns)})
                        VALUES ({placeholders})
                        ON CONFLICT ({id_column}) DO NOTHING
                        RETURNING {id_column}
                    """
                elif conflict_resolution == "UPDATE":
                    # Update all columns except the ID
                    update_columns = [col for col in columns if col != id_column]
                    update_clause = ', '.join([f"{col} = EXCLUDED.{col}" for col in update_columns])
                    
                    query = f"""
                        INSERT INTO {table_name} ({', '.join(columns)})
                        VALUES ({placeholders})
                        ON CONFLICT ({id_column}) DO UPDATE SET {update_clause}
                        RETURNING {id_column}
                    """
                else:
                    # Custom conflict resolution
                    query = f"""
                        INSERT INTO {table_name} ({', '.join(columns)})
                        VALUES ({placeholders})
                        {conflict_resolution}
                        RETURNING {id_column}
                    """
                
                try:
                    cursor.execute(query, values)
                    result = cursor.fetchone()
                    conn.commit()
                    
                    if result:
                        record_id = result[0]
                        print(f"✅ Inserted/Updated {table_name} record (ID: {record_id})")
                        return record_id
                    else:
                        print(f"ℹ️  {table_name} record already exists, skipped")
                        return None
                        
                except Exception as e:
                    conn.rollback()
                    print(f"❌ Failed to insert {table_name} record: {e}")
                    raise
    
    def get_random_existing_id(self, table_name: str, id_column: str = 'id') -> Optional[Any]:
        """Get a random existing ID from a table"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    SELECT {id_column} FROM {table_name} 
                    ORDER BY RANDOM() 
                    LIMIT 1
                """)
                result = cursor.fetchone()
                return result[0] if result else None
    
    def cleanup_test_records(self, patterns: List[str] = None):
        """Clean up test records based on patterns"""
        if patterns is None:
            patterns = ['test_%', 'testuser_%', '%@example.com', '%@test.com']
        
        tables_to_clean = [
            'users', 'user_profiles', 'user_sessions', 'games', 'historic_games',
            'puzzles', 'puzzle_attempts', 'puzzle_sources', 'openings',
            'achievements', 'user_achievements', 'content', 'user_content_progress'
        ]
        
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                for table in tables_to_clean:
                    if not self.table_exists(table):
                        continue
                        
                    for pattern in patterns:
                        try:
                            # Clean by username pattern
                            if table in ['users', 'user_profiles']:
                                cursor.execute(f"""
                                    DELETE FROM {table} 
                                    WHERE username LIKE %s OR email LIKE %s
                                """, (pattern, pattern))
                            
                            # Clean by ID pattern for other tables
                            else:
                                cursor.execute(f"""
                                    DELETE FROM {table} 
                                    WHERE id::text LIKE %s
                                """, (pattern,))
                                
                        except Exception as e:
                            print(f"⚠️  Could not clean {table}: {e}")
                            continue
                
                conn.commit()
                print("🧹 Cleaned up test records")
    
    def get_table_count(self, table_name: str) -> int:
        """Get the number of records in a table"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                return cursor.fetchone()[0]
    
    def execute_query(self, query: str, params: Tuple = None) -> List[Tuple]:
        """Execute a custom query and return results"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()