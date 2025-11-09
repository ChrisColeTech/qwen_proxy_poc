#!/usr/bin/env python3
"""
ID Resolver Module

This module resolves and provides correct database IDs for foreign key relationships
and ensures that referenced entities actually exist in the database.
"""

import json
import os
import psycopg2
from typing import Dict, Any, Optional, List
import uuid


class IDResolver:
    def __init__(self):
        """Initialize the ID resolver with real database IDs."""
        self.database_url = self._get_database_url()
        self.real_ids = self._load_real_ids()
        self.existing_ids_cache = {}
        
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
        try:
            return psycopg2.connect(self.database_url)
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            raise
    
    def _load_real_ids(self) -> Dict[str, str]:
        """Load real database IDs from real_test_ids.json"""
        real_ids_path = os.path.join(os.path.dirname(__file__), 'real_test_ids.json')
        try:
            with open(real_ids_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print("⚠️  real_test_ids.json not found, using placeholder IDs")
            return {}
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing real_test_ids.json: {e}")
            return {}
    
    def get_existing_ids(self, table_name: str, limit: int = 10) -> List[str]:
        """Get existing IDs from a table."""
        cache_key = f"{table_name}_{limit}"
        if cache_key in self.existing_ids_cache:
            return self.existing_ids_cache[cache_key]
        
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT id FROM {table_name} LIMIT %s", (limit,))
                ids = [row[0] for row in cursor.fetchall()]
                self.existing_ids_cache[cache_key] = ids
                return ids
        except Exception as e:
            print(f"❌ Failed to get existing IDs from {table_name}: {e}")
            return []
        finally:
            conn.close()
    
    def resolve_id_field(self, field_name: str, entity_name: str, current_value: Any = None) -> str:
        """
        Resolve an ID field to use an actual database ID.
        
        Args:
            field_name: The name of the field (e.g., 'user_id', 'puzzle_id')
            entity_name: The entity being created (e.g., 'user_profiles', 'games')
            current_value: Current value if any
            
        Returns:
            A valid database ID
        """
        # Handle primary key 'id' field
        if field_name == 'id':
            return self._generate_or_get_primary_key(entity_name, current_value)
        
        # Handle foreign key fields
        if field_name in ['user_id', 'userId']:
            return self.real_ids.get('user_id', self._generate_uuid())
        
        elif field_name in ['puzzle_id', 'puzzleId']:
            return self.real_ids.get('puzzle_id', self._generate_uuid())
        
        elif field_name in ['game_id', 'gameId']:
            return self.real_ids.get('game_id', self._generate_uuid())
        
        elif field_name in ['achievement_id', 'achievementId']:
            # Use real_ids first, then query database for existing achievement IDs
            if 'achievement_id' in self.real_ids:
                return self.real_ids['achievement_id']
            # If no real_ids, get from database
            existing_achievements = self.get_existing_ids('achievements', 1)
            return existing_achievements[0] if existing_achievements else self._generate_random_string()
        
        elif field_name in ['learning_path_id', 'pathId']:
            return self.real_ids.get('learning_path_id', self._generate_random_string())
        
        elif field_name in ['ai_opponent_id', 'opponentId']:
            return self.real_ids.get('ai_opponent_id', self._generate_random_string())
        
        elif field_name in ['historic_game_id', 'historicGameId']:
            return self.real_ids.get('historic_game_id', self._generate_uuid())
        
        elif field_name in ['subscription_id', 'subscriptionId']:
            return self.real_ids.get('subscription_id', self._generate_random_string())
        
        elif field_name in ['content_id', 'contentId']:
            # Get a random existing content ID from database
            real_content_id = self._get_random_existing_id('content', 'id')
            return real_content_id if real_content_id else self.real_ids.get('content_id', 'test-content-001')
        
        elif field_name == 'source_id':
            return self.real_ids.get('puzzle_source_id', 'test-puzzle-source-001')
        
        elif field_name in ['parent_id', 'parentId']:
            return None  # Parent IDs can often be null
        
        # Handle entity-specific ID patterns
        elif field_name.endswith('_id') or field_name.endswith('Id'):
            # Try to map to a known entity
            base_name = field_name.replace('_id', '').replace('Id', '')
            
            # Look for matching real IDs
            for key, value in self.real_ids.items():
                if base_name.lower() in key.lower():
                    return value
            
            # Generate appropriate ID based on pattern
            if base_name in ['white_player', 'black_player']:
                return self.real_ids.get('user_id', self._generate_uuid())
            else:
                return self._generate_uuid()
        
        return current_value or self._generate_uuid()
    
    def _generate_or_get_primary_key(self, entity_name: str, current_value: Any = None) -> str:
        """Generate or get a primary key for an entity."""
        if current_value:
            return str(current_value)
        
        # Use existing IDs from real_test_ids if available
        entity_singular = entity_name.rstrip('s')  # Remove trailing 's'
        
        id_key = f"{entity_singular}_id"
        if id_key in self.real_ids:
            return self.real_ids[id_key]
        
        # Generate based on entity type
        if entity_name in ['users', 'puzzles', 'games', 'historic_games']:
            return self._generate_uuid()
        else:
            return self._generate_random_string()
    
    def _generate_uuid(self) -> str:
        """Generate a UUID string."""
        return str(uuid.uuid4())
    
    def _generate_random_string(self, length: int = 17) -> str:
        """Generate a random string ID."""
        import random
        import string
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
    
    def resolve_all_ids_in_payload(self, entity_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve all ID fields in a payload to use real database IDs.
        
        Args:
            entity_name: The entity being created (e.g., 'user_profiles')
            payload: The payload dictionary
            
        Returns:
            Updated payload with resolved IDs
        """
        if not payload:
            return payload
        
        resolved_payload = payload.copy()
        
        for field_name, value in payload.items():
            if self._is_id_field(field_name):
                resolved_id = self.resolve_id_field(field_name, entity_name, value)
                if resolved_id != value:
                    resolved_payload[field_name] = resolved_id
                    print(f"🔧 Resolved ID field '{field_name}' in {entity_name}: {value} -> {resolved_id}")
        
        return resolved_payload
    
    def _is_id_field(self, field_name: str) -> bool:
        """Check if a field name represents an ID field."""
        field_lower = field_name.lower()
        return (
            field_lower == 'id' or 
            field_lower.endswith('_id') or 
            field_lower.endswith('id') or
            field_name in ['userId', 'puzzleId', 'gameId', 'achievementId', 'pathId', 
                          'opponentId', 'subscriptionId', 'contentId', 'parentId']
        )
    
    def verify_id_exists(self, table_name: str, id_value: str) -> bool:
        """Verify that an ID exists in the specified table."""
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT 1 FROM {table_name} WHERE id = %s LIMIT 1", (id_value,))
                return cursor.fetchone() is not None
        except Exception as e:
            print(f"❌ Failed to verify ID {id_value} in {table_name}: {e}")
            return False
        finally:
            conn.close()
    
    def _get_random_existing_id(self, table_name: str, column_name: str = 'id') -> Optional[str]:
        """Get a random existing ID from the specified table."""
        import random
        existing_ids = self.get_existing_ids(table_name, 10)  # Get up to 10 IDs
        return random.choice(existing_ids) if existing_ids else None
    
    def get_valid_foreign_key_id(self, referenced_table: str, field_name: str) -> Optional[str]:
        """Get a valid foreign key ID from the referenced table."""
        # First try to use real IDs
        if referenced_table == 'users' and 'user_id' in self.real_ids:
            return self.real_ids['user_id']
        elif referenced_table == 'puzzles' and 'puzzle_id' in self.real_ids:
            return self.real_ids['puzzle_id']
        elif referenced_table == 'games' and 'game_id' in self.real_ids:
            return self.real_ids['game_id']
        elif referenced_table == 'achievements' and 'achievement_id' in self.real_ids:
            return self.real_ids['achievement_id']
        
        # Fall back to querying existing IDs
        existing_ids = self.get_existing_ids(referenced_table, 1)
        return existing_ids[0] if existing_ids else None


if __name__ == "__main__":
    # Test the ID resolver
    resolver = IDResolver()
    
    print("Testing ID resolver...")
    print(f"Real IDs loaded: {list(resolver.real_ids.keys())}")
    
    # Test ID resolution
    test_payload = {
        'id': 'test-id',
        'user_id': 'fake-user-id',
        'puzzle_id': 'fake-puzzle-id',
        'parent_id': 'fake-parent-id'
    }
    
    resolved = resolver.resolve_all_ids_in_payload('user_profiles', test_payload)
    print(f"Original payload: {test_payload}")
    print(f"Resolved payload: {resolved}")
    
    # Test specific ID resolution
    user_id = resolver.resolve_id_field('user_id', 'user_profiles')
    print(f"Resolved user_id: {user_id}")