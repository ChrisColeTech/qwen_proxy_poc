#!/usr/bin/env python3
"""
Database ID Fetcher Module

This module queries the database for existing valid IDs and provides them
to the payload generator, overriding any seeder-generated IDs.
"""

import psycopg2
import os
from typing import Dict, List, Any


class DatabaseIDFetcher:
    def __init__(self):
        """Initialize the database ID fetcher."""
        self.database_url = self._get_database_url()
        self.connection = None
        
    def _get_database_url(self) -> str:
        """Get database URL from environment or .env file"""
        # Try environment variable first
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            return db_url
        
        # Try to read from .env file
        try:
            env_path = os.path.join(os.path.dirname(__file__), '../../../backend-v2/.env')
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        return line.split('=', 1)[1]
        except FileNotFoundError:
            pass
        
        raise ValueError("No database URL found. Set DATABASE_URL environment variable or .env file.")
    
    def connect(self):
        """Create database connection"""
        if not self.connection:
            try:
                self.connection = psycopg2.connect(self.database_url)
            except Exception as e:
                print(f"❌ Failed to connect to database: {e}")
                raise
        return self.connection
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def fetch_existing_ids(self, table_name: str, limit: int = 10) -> List[str]:
        """Fetch existing IDs from a table."""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT id FROM {table_name} LIMIT %s", (limit,))
                return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            print(f"❌ Failed to fetch IDs from {table_name}: {e}")
            return []
    
    def get_all_existing_ids(self) -> Dict[str, Any]:
        """Fetch all required existing IDs from the database."""
        print("🔍 Fetching existing IDs from database...")
        
        existing_ids = {}
        
        # Fetch user IDs
        user_ids = self.fetch_existing_ids('users', 5)
        if user_ids:
            existing_ids['user_ids'] = user_ids
            existing_ids['user_id'] = user_ids[0]
            print(f"✅ Found {len(user_ids)} user IDs")
        
        # Fetch puzzle IDs
        puzzle_ids = self.fetch_existing_ids('puzzles', 10)
        if puzzle_ids:
            existing_ids['puzzle_ids'] = puzzle_ids
            existing_ids['puzzle_id'] = puzzle_ids[0]
            print(f"✅ Found {len(puzzle_ids)} puzzle IDs")
        
        # Fetch achievement IDs
        achievement_ids = self.fetch_existing_ids('achievements', 5)
        if achievement_ids:
            existing_ids['achievement_ids'] = achievement_ids
            existing_ids['achievement_id'] = achievement_ids[0]
            print(f"✅ Found {len(achievement_ids)} achievement IDs")
        
        # Fetch content IDs
        content_ids = self.fetch_existing_ids('content', 6)
        if content_ids:
            existing_ids['content_ids'] = content_ids
            existing_ids['content_id'] = content_ids[0]
            print(f"✅ Found {len(content_ids)} content IDs")
        
        # Fetch game IDs
        game_ids = self.fetch_existing_ids('games', 8)
        if game_ids:
            existing_ids['game_ids'] = game_ids
            existing_ids['game_id'] = game_ids[0]
            print(f"✅ Found {len(game_ids)} game IDs")
        
        # Fetch user profile IDs
        profile_ids = self.fetch_existing_ids('user_profiles', 3)
        if profile_ids:
            existing_ids['profile_ids'] = profile_ids
            existing_ids['profile_id'] = profile_ids[0]
            print(f"✅ Found {len(profile_ids)} profile IDs")
        
        # Fetch session IDs
        session_ids = self.fetch_existing_ids('user_sessions', 3)
        if session_ids:
            existing_ids['session_ids'] = session_ids
            existing_ids['session_id'] = session_ids[0]
            print(f"✅ Found {len(session_ids)} session IDs")
        
        # Fetch historic game IDs
        historic_game_ids = self.fetch_existing_ids('historic_games', 4)
        if historic_game_ids:
            existing_ids['historic_game_ids'] = historic_game_ids
            existing_ids['historic_game_id'] = historic_game_ids[0]
            print(f"✅ Found {len(historic_game_ids)} historic game IDs")
        
        # Fetch opening IDs
        opening_ids = self.fetch_existing_ids('openings', 5)
        if opening_ids:
            existing_ids['opening_ids'] = opening_ids
            existing_ids['opening_id'] = opening_ids[0]
            print(f"✅ Found {len(opening_ids)} opening IDs")
        
        # Fetch puzzle source IDs
        puzzle_source_ids = self.fetch_existing_ids('puzzle_sources', 3)
        if puzzle_source_ids:
            existing_ids['puzzle_source_ids'] = puzzle_source_ids
            existing_ids['puzzle_source_id'] = puzzle_source_ids[0]
            print(f"✅ Found {len(puzzle_source_ids)} puzzle source IDs")
        
        # Fetch puzzle attempt IDs
        puzzle_attempt_ids = self.fetch_existing_ids('puzzle_attempts', 15)
        if puzzle_attempt_ids:
            existing_ids['puzzle_attempt_ids'] = puzzle_attempt_ids
            existing_ids['puzzle_attempt_id'] = puzzle_attempt_ids[0]
            print(f"✅ Found {len(puzzle_attempt_ids)} puzzle attempt IDs")
        
        # Fetch user achievement IDs
        user_achievement_ids = self.fetch_existing_ids('user_achievements', 10)
        if user_achievement_ids:
            existing_ids['user_achievement_ids'] = user_achievement_ids
            existing_ids['user_achievement_id'] = user_achievement_ids[0]
            print(f"✅ Found {len(user_achievement_ids)} user achievement IDs")
        
        # Fetch progress IDs
        progress_ids = self.fetch_existing_ids('user_content_progress', 12)
        if progress_ids:
            existing_ids['progress_ids'] = progress_ids
            existing_ids['progress_id'] = progress_ids[0]
            print(f"✅ Found {len(progress_ids)} progress IDs")
        
        # Add legacy IDs that don't have database tables
        existing_ids.update({
            'tutorial_id': 'legacy-tutorial-001',
            'learning_path_id': 'legacy-path-001',
            'ai_opponent_id': 'legacy-ai-001',
            'subscription_id': 'legacy-sub-001',
            'opening_eco_code': 'B92',
            'learning_module_id': 'legacy-module-001',
            'study_plan_id': 'legacy-plan-001',
            'enrollment_id': 'legacy-enrollment-001'
        })
        
        print(f"🎯 Successfully fetched {len(existing_ids)} ID groups from database")
        return existing_ids


if __name__ == "__main__":
    # Test the database ID fetcher
    fetcher = DatabaseIDFetcher()
    try:
        ids = fetcher.get_all_existing_ids()
        print("✅ Database ID fetcher test successful")
        print(f"Sample IDs: {list(ids.keys())[:5]}")
    finally:
        fetcher.close()