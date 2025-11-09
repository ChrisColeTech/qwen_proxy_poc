#!/usr/bin/env python3
"""
JSON Formatter Module

This module handles proper JSON formatting for fields that expect JSON data types.
"""

import json
from typing import Any, Dict, List, Union


class JSONFormatter:
    def __init__(self):
        """Initialize the JSON formatter."""
        # Define fields that should be JSON formatted by field name patterns
        self.json_field_patterns = [
            'themes', 'tags', 'requirements', 'features', 'objectives', 
            'prerequisites', 'metadata', 'settings', 'preferences',
            'board_preferences', 'raw_app_meta_data', 'raw_user_meta_data',
            'content_body'
        ]
        
        # Define fields that should be JSON arrays
        self.json_array_fields = [
            'themes', 'tags', 'features', 'objectives', 'prerequisites'
        ]
        
        # Define fields that should be JSON objects
        self.json_object_fields = [
            'preferences', 'board_preferences', 'settings', 'metadata',
            'raw_app_meta_data', 'raw_user_meta_data', 'requirements',
            'content_body'
        ]
    
    def should_be_json_formatted(self, field_name: str, field_type: str) -> bool:
        """Determine if a field should be JSON formatted."""
        # Check if field type is JSON
        if field_type in ['json', 'jsonb']:
            return True
        
        # Check if field name matches JSON patterns
        field_lower = field_name.lower()
        return any(pattern in field_lower for pattern in self.json_field_patterns)
    
    def format_field_as_json(self, field_name: str, value: Any, field_type: str = None, for_api: bool = False) -> Union[str, list, dict]:
        """Format a field value as proper JSON.
        
        Args:
            field_name: Name of the field
            value: Value to format
            field_type: Type of the field
            for_api: If True, return actual data structures for API payloads.
                    If False, return JSON strings for database storage.
        """
        if value is None:
            default_value = self._get_default_json_value(field_name, for_api)
            return default_value
        
        # If already valid JSON string, parse it for API or return as-is for DB
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                return parsed if for_api else value  # Already valid JSON
            except json.JSONDecodeError:
                pass  # Continue to format it
        
        # Handle different field types
        field_lower = field_name.lower()
        
        # Handle comma-separated strings that should become arrays
        if isinstance(value, str) and ',' in value:
            if any(pattern in field_lower for pattern in self.json_array_fields):
                items = [item.strip() for item in value.split(',') if item.strip()]
                # For API payloads, return arrays directly (JSONB columns expect arrays, not strings)
                return items if for_api else json.dumps(items)
        
        # Handle specific field patterns
        if any(pattern in field_lower for pattern in self.json_array_fields):
            if isinstance(value, str):
                # Special handling for themes - replace "test_themes" with proper chess themes
                if field_lower == 'themes' and value == 'test_themes':
                    import random
                    chess_themes = random.choice([
                        ["tactics", "fork"],
                        ["endgame", "checkmate"],
                        ["opening", "development"],
                        ["middlegame", "attack"],
                        ["sacrifice", "combination"]
                    ])
                    result = chess_themes
                else:
                    result = [value]
            elif isinstance(value, list):
                result = value
            else:
                result = [str(value)]
            # For API payloads, return arrays directly (JSONB columns expect arrays, not strings)
            return result if for_api else json.dumps(result)
        
        if any(pattern in field_lower for pattern in self.json_object_fields):
            if isinstance(value, dict):
                result = value
            elif isinstance(value, str):
                # Try to create a meaningful object structure
                if 'preferences' in field_lower or 'settings' in field_lower:
                    result = {"theme": "default", "value": value}
                else:
                    result = {"data": value}
            else:
                result = {"value": str(value)}
            return result if for_api else json.dumps(result)
        
        # Default: convert to JSON string
        try:
            if for_api:
                return value  # Return raw value for API
            else:
                return json.dumps(value)
        except (TypeError, ValueError):
            if for_api:
                return str(value)
            else:
                return json.dumps(str(value))
    
    def _get_default_json_value(self, field_name: str, for_api: bool = False) -> Union[str, list, dict]:
        """Get appropriate default JSON value for a field."""
        field_lower = field_name.lower()
        
        if 'themes' in field_lower or 'tags' in field_lower:
            result = ["tactics", "fork"]  # Use proper chess themes
            return result if for_api else json.dumps(result)
        elif 'features' in field_lower:
            result = ["basic", "standard"]
            return result if for_api else json.dumps(result)
        elif 'objectives' in field_lower:
            result = ["Learn basics", "Practice"]
            return result if for_api else json.dumps(result)
        elif 'prerequisites' in field_lower:
            result = ["None"]
            return result if for_api else json.dumps(result)
        elif 'requirements' in field_lower:
            result = {"level": "beginner", "rating": 800}
            return result if for_api else json.dumps(result)
        elif 'preferences' in field_lower or 'settings' in field_lower:
            result = {"theme": "default", "notifications": True}
            return result if for_api else json.dumps(result)
        elif 'metadata' in field_lower:
            result = {"category": "general", "difficulty": "easy"}
            return result if for_api else json.dumps(result)
        else:
            result = {}
            return result if for_api else json.dumps(result)
    
    def format_payload_json_fields(self, payload: Dict[str, Any], field_types: Dict[str, str] = None, for_api: bool = False) -> Dict[str, Any]:
        """Format all JSON fields in a payload.
        
        Args:
            payload: The payload to format
            field_types: Field type information
            for_api: If True, return actual data structures for API payloads.
                    If False, return JSON strings for database storage.
        """
        if not payload:
            return payload
        
        formatted_payload = payload.copy()
        
        for field_name, value in payload.items():
            field_type = field_types.get(field_name) if field_types else None
            
            if self.should_be_json_formatted(field_name, field_type or ''):
                formatted_value = self.format_field_as_json(field_name, value, field_type, for_api)
                if formatted_value != value:
                    formatted_payload[field_name] = formatted_value
                    print(f"🔧 JSON formatted field '{field_name}': {value} -> {formatted_value}")
        
        return formatted_payload
    
    def validate_json_field(self, field_name: str, value: str) -> bool:
        """Validate that a field contains valid JSON."""
        try:
            json.loads(value)
            return True
        except (json.JSONDecodeError, TypeError):
            return False
    
    def get_json_formatting_suggestions(self, field_name: str, current_value: Any) -> List[str]:
        """Get suggestions for JSON formatting a field."""
        suggestions = []
        
        if isinstance(current_value, str) and ',' in current_value:
            suggestions.append(f"Convert comma-separated '{current_value}' to JSON array")
        
        if not self.validate_json_field(field_name, str(current_value)):
            suggestions.append(f"Convert '{current_value}' to valid JSON format")
        
        field_lower = field_name.lower()
        if any(pattern in field_lower for pattern in self.json_array_fields):
            suggestions.append("Format as JSON array")
        elif any(pattern in field_lower for pattern in self.json_object_fields):
            suggestions.append("Format as JSON object")
        
        return suggestions


if __name__ == "__main__":
    # Test the JSON formatter
    formatter = JSONFormatter()
    
    # Test different formatting scenarios
    test_cases = [
        ("themes", "tactics,fork,endgame", "jsonb"),
        ("preferences", "dark_theme", "jsonb"),
        ("requirements", {"level": "advanced"}, "jsonb"),
        ("tags", ["opening", "theory"], "jsonb"),
    ]
    
    print("Testing JSON formatter...")
    for field_name, value, field_type in test_cases:
        should_format = formatter.should_be_json_formatted(field_name, field_type)
        print(f"Field '{field_name}' should be JSON formatted: {should_format}")
        
        if should_format:
            formatted = formatter.format_field_as_json(field_name, value, field_type)
            print(f"  Original: {value}")
            print(f"  Formatted: {formatted}")
            print(f"  Valid JSON: {formatter.validate_json_field(field_name, formatted)}")
        print()