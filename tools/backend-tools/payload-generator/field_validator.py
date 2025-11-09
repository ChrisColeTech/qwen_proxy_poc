#!/usr/bin/env python3
"""
Field Validator Module

This module validates and ensures all required fields are included in payloads
based on database schema constraints and API requirements.
"""

from typing import Dict, Any, List, Set
import psycopg2
import os
import random


class FieldValidator:
    def __init__(self):
        """Initialize the field validator with database schema information."""
        self.database_url = self._get_database_url()
        self.required_fields_cache = {}
        self.field_types_cache = {}
        
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
    
    def get_required_fields(self, table_name: str) -> Dict[str, str]:
        """Get required (NOT NULL) fields for a table with their types."""
        if table_name in self.required_fields_cache:
            return self.required_fields_cache[table_name]
        
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns 
                    WHERE table_name = %s 
                    ORDER BY ordinal_position;
                """, (table_name,))
                
                columns = cursor.fetchall()
                required_fields = {}
                
                for col_name, data_type, is_nullable, col_default in columns:
                    # Field is required if it's NOT NULL and has no default value
                    if is_nullable == 'NO' and col_default is None:
                        required_fields[col_name] = data_type
                
                self.required_fields_cache[table_name] = required_fields
                return required_fields
                
        except Exception as e:
            print(f"❌ Failed to get required fields for {table_name}: {e}")
            return {}
        finally:
            conn.close()
    
    def get_field_types(self, table_name: str) -> Dict[str, str]:
        """Get all field types for a table."""
        if table_name in self.field_types_cache:
            return self.field_types_cache[table_name]
        
        conn = self.connect()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        column_name,
                        data_type
                    FROM information_schema.columns 
                    WHERE table_name = %s 
                    ORDER BY ordinal_position;
                """, (table_name,))
                
                columns = cursor.fetchall()
                field_types = {}
                
                for col_name, data_type in columns:
                    field_types[col_name] = data_type
                
                self.field_types_cache[table_name] = field_types
                return field_types
                
        except Exception as e:
            print(f"❌ Failed to get field types for {table_name}: {e}")
            return {}
        finally:
            conn.close()
    
    def validate_payload(self, table_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and fix a payload to ensure all required fields are present.
        Returns the validated/fixed payload.
        """
        if not payload:
            payload = {}
        
        required_fields = self.get_required_fields(table_name)
        field_types = self.get_field_types(table_name)
        
        # Add missing required fields with appropriate default values
        for field_name, field_type in required_fields.items():
            if field_name not in payload or payload[field_name] is None:
                # Only skip ID fields if they were already resolved (present but None)
                # If they're completely missing, we need to add them
                id_fields_that_should_exist = ['achievement_id', 'user_id', 'puzzle_id', 'content_id', 'source_id']
                if field_name in id_fields_that_should_exist and field_name in payload:
                    print(f"⚠️  Skipping required field '{field_name}' - was resolved by ID resolver but is None")
                    continue
                    
                default_value = self._get_default_value_for_type(field_name, field_type, table_name)
                payload[field_name] = default_value
                print(f"📝 Added required field '{field_name}' to {table_name} payload: {default_value}")
        
        # Validate and fix existing fields
        for field_name, value in payload.copy().items():
            if field_name in field_types:
                field_type = field_types[field_name]
                fixed_value = self._fix_field_value(field_name, value, field_type, table_name)
                if fixed_value != value:
                    payload[field_name] = fixed_value
                    print(f"🔧 Fixed field '{field_name}' in {table_name} payload: {value} -> {fixed_value}")
        
        return payload
    
    def _get_default_value_for_type(self, field_name: str, field_type: str, table_name: str) -> Any:
        """Generate appropriate default values for different field types."""
        # Handle special field names first
        if field_name == 'username':
            return f"testuser_{hash(table_name) % 10000}"
        elif field_name == 'email':
            return f"test_{hash(table_name) % 10000}@example.com"
        elif field_name in ['user_id', 'userId']:
            return "569cc032-7f61-496c-9d50-5e625c0cb937"  # Use real user ID
        elif field_name == 'refresh_token':
            return f"refresh_token_{hash(table_name) % 100000}"
        elif field_name == 'ai_level':
            return 5
        elif field_name == 'current_fen':
            return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        elif field_name == 'user_color':
            return random.choice(['white', 'black'])
        elif field_name in ['white_player', 'black_player']:
            return "TestPlayer"
        elif field_name == 'name':
            return f"Test {table_name.title()}"
        elif field_name == 'fen':
            return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        elif field_name == 'source_id':
            return f"test_source_{hash(table_name) % 1000}"
        elif field_name == 'achievement_id':
            # Use one of the valid achievement IDs from the database
            # These are the achievement IDs confirmed to exist in the database
            valid_achievement_ids = ["0uCkPqrssdaD3m0Jl", "XIXsyOJ4A0768Jdfp", "ejStcB27JXWfNKBXZ"]
            return valid_achievement_ids[0]  # Use first valid achievement ID
        elif field_name == 'title':
            return f"Test {table_name.title()} Title"
        elif field_name == 'themes':
            # Generate proper chess themes as JSON string for API
            import json
            chess_themes = random.choice([
                ["tactics", "fork"],
                ["endgame", "checkmate"],
                ["opening", "development"],
                ["middlegame", "attack"],
                ["sacrifice", "combination"]
            ])
            return json.dumps(chess_themes)
        elif field_name == 'content_type':
            return random.choice(['lesson', 'exercise', 'quiz', 'video'])  # All under 15 chars
        elif field_name == 'difficulty_level':
            return random.choice(['beginner', 'medium', 'advanced'])  # Shorten to fit constraints
        elif field_name == 'status' and table_name == 'user_content_progress':
            return 'not_started'  # Use the default value from schema
        elif field_name == 'status':
            return 'active'  # Generic safe status value
        
        # Handle by data type with length constraints
        if field_type in ['character varying', 'text', 'varchar']:
            base_value = f"test_{field_name}"
            # Limit to 15 characters to ensure we stay under most varchar constraints
            if len(base_value) > 15:
                return base_value[:15]
            return base_value
        elif field_type in ['integer', 'bigint', 'smallint']:
            return 1
        elif field_type in ['boolean']:
            return True
        elif field_type in ['timestamp without time zone', 'timestamp with time zone']:
            from datetime import datetime, timezone
            # Use timezone-aware timestamp for PostgreSQL compatibility
            return datetime.now(timezone.utc).isoformat()
        elif field_type in ['uuid']:
            import uuid
            return str(uuid.uuid4())
        elif field_type == 'jsonb':
            return "{}"
        elif field_type in ['numeric', 'decimal', 'real', 'double precision']:
            return 0.0
        else:
            return f"test_{field_name}"
    
    def _fix_field_value(self, field_name: str, value: Any, field_type: str, table_name: str) -> Any:
        """Fix field values to match expected types and formats."""
        if value is None:
            # Allow nullable foreign key fields to remain None
            nullable_fk_fields = ['parent_id', 'parentId']
            if field_name in nullable_fk_fields:
                return None
            return self._get_default_value_for_type(field_name, field_type, table_name)
        
        # Handle JSON fields that are currently strings
        if field_type == 'jsonb' and isinstance(value, str):
            # Special handling for content_body - it should remain as a plain string for API use
            if field_name == 'content_body':
                return value
            try:
                import json
                # Try to parse as JSON, if it fails, wrap in quotes
                json.loads(value)
                return value
            except json.JSONDecodeError:
                return json.dumps(value)
        
        # Handle comma-separated values that should be JSON arrays
        # For API payloads, themes need to be JSON strings, not raw arrays
        if field_name in ['themes', 'tags'] and isinstance(value, str):
            import json
            if ',' in value:
                items = [item.strip() for item in value.split(',') if item.strip()]
                return json.dumps(items)  # Return JSON string for API
            elif not value.startswith('['):
                # Single value, wrap in array and stringify
                return json.dumps([value])
            else:
                # Already a JSON string, validate it
                try:
                    parsed = json.loads(value)
                    return json.dumps(parsed)  # Ensure proper JSON format
                except json.JSONDecodeError:
                    return json.dumps([value])
                    
        # Handle list values for themes/tags - convert to JSON strings for API
        if field_name in ['themes', 'tags'] and isinstance(value, list):
            import json
            return json.dumps(value)
        
        # Handle the specific case of "test_themes" and replace with proper chess themes
        if field_name == 'themes' and value == 'test_themes':
            import json
            chess_themes = random.choice([
                ["tactics", "fork"],
                ["endgame", "checkmate"],
                ["opening", "development"],
                ["middlegame", "attack"],
                ["sacrifice", "combination"]
            ])
            return json.dumps(chess_themes)
        
        # Handle status fields with specific validation
        if field_name == 'status':
            if table_name == 'user_content_progress':
                # Only allow valid status values for user_content_progress
                valid_statuses = ['not_started', 'in_progress', 'completed', 'paused']
                if value not in valid_statuses:
                    return 'not_started'
            else:
                # For other tables, ensure it's a valid generic status
                valid_generic_statuses = ['active', 'inactive', 'pending', 'completed', 'cancelled']
                if value not in valid_generic_statuses:
                    return 'active'
            return value
        
        # Handle boolean fields
        if field_type == 'boolean':
            if isinstance(value, str):
                return value.lower() in ['true', '1', 'yes', 'on']
            return bool(value)
        
        # Handle numeric fields
        if field_type in ['integer', 'bigint', 'smallint'] and isinstance(value, str):
            try:
                return int(value)
            except ValueError:
                return 1
        
        if field_type in ['numeric', 'decimal', 'real', 'double precision'] and isinstance(value, str):
            try:
                return float(value)
            except ValueError:
                return 0.0
        
        return value
    
    def get_missing_required_fields(self, table_name: str, payload: Dict[str, Any]) -> List[str]:
        """Get list of missing required fields for a payload."""
        required_fields = self.get_required_fields(table_name)
        missing = []
        
        for field_name in required_fields.keys():
            if field_name not in payload or payload[field_name] is None:
                missing.append(field_name)
        
        return missing


if __name__ == "__main__":
    # Test the field validator
    validator = FieldValidator()
    
    # Test with users table
    print("Testing field validator...")
    required = validator.get_required_fields('users')
    print(f"Required fields for users: {required}")
    
    # Test payload validation
    test_payload = {'email': 'test@example.com'}
    validated = validator.validate_payload('users', test_payload)
    print(f"Validated payload: {validated}")