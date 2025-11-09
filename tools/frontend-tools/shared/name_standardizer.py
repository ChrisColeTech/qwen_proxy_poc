"""
Name standardizer using proven algorithms instead of homebrew hacks.

This implementation combines:
1. WordSegment - trillion-word corpus for known compound detection
2. Compound-word-splitter - for artificial compounds
3. Proper linguistic analysis instead of hardcoded rules
"""

from __future__ import annotations
import re
from typing import List
from wordsegment import load, segment
# Note: compound_word_splitter has import issues, using WordSegment for now

# Load the trillion-word corpus data
load()

class NameStandardizer:
    """
    Name standardizer using proven compound word segmentation algorithms.
    
    Uses a hybrid approach:
    - WordSegment for natural language compounds (trillion-word corpus)
    - Custom logic for artificial UI compounds (testcenter, gamecenter, etc.)
    """
    
    # Common UI/domain suffixes that indicate artificial compounds
    UI_SUFFIXES = [
        'center', 'area', 'page', 'wrapper', 'actions', 'hook', 'store', 
        'config', 'nav', 'navigation', 'list', 'item', 'detail', 'view',
        'button', 'card', 'modal', 'sheet', 'drawer', 'panel', 'manager',
        'service', 'provider', 'settings', 'profile', 'user', 'admin',
        'dash', 'board'
    ]
    
    @staticmethod
    def _is_artificial_compound(word: str) -> bool:
        """Check if this looks like an artificial UI compound (testcenter, playarea, etc.)"""
        word_lower = word.lower()
        
        # Check if it ends with a UI suffix
        for suffix in NameStandardizer.UI_SUFFIXES:
            if word_lower.endswith(suffix) and len(word_lower) > len(suffix):
                return True
        
        # Check if WordSegment thinks it should be split but it's not a real word
        segments = segment(word_lower)
        if len(segments) > 1:
            # If it naturally splits into multiple parts, it's likely artificial
            return True
            
        return False
    
    @staticmethod
    def _split_to_words(name: str) -> List[str]:
        """Split name into constituent words using proven algorithms."""
        if not name or not isinstance(name, str):
            return []
        
        # Normalize delimiters first
        normalized = re.sub(r'[^a-zA-Z0-9]+', ' ', name.strip())
        parts = normalized.split()
        
        tokens: List[str] = []
        
        for part in parts:
            if not part:
                continue
                
            # Handle pure numbers
            if part.isdigit():
                tokens.append(part)
                continue
            
            # Handle acronyms (all caps, length > 1)
            if part.isupper() and len(part) > 1:
                tokens.append(part)
                continue
            
            # Handle mixed case (already properly segmented)
            if any(c.isupper() for c in part[1:]):
                # Split on camelCase boundaries
                camel_split = re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\b)', part)
                tokens.extend(camel_split)
                continue
            
            # For lowercase strings, check if they're artificial compounds
            if part.islower():
                if NameStandardizer._is_artificial_compound(part):
                    # Use WordSegment for artificial compounds
                    segments = segment(part)
                    tokens.extend(segments)
                else:
                    # Keep as single word (it's a real English word)
                    tokens.append(part)
            else:
                tokens.append(part)
        
        return [t for t in tokens if t.strip()]
    
    @staticmethod
    def to_pascal_case(name: str) -> str:
        """Convert to PascalCase using proven segmentation."""
        words = NameStandardizer._split_to_words(name)
        parts: List[str] = []
        
        for word in words:
            if word.isdigit():
                parts.append(word)
            elif word.isupper() and len(word) > 1:
                parts.append(word)  # Keep acronyms as-is
            else:
                parts.append(word.lower().capitalize())
        
        return ''.join(parts)
    
    @staticmethod
    def to_camel_case(name: str) -> str:
        """Convert to camelCase."""
        pascal = NameStandardizer.to_pascal_case(name)
        return pascal[:1].lower() + pascal[1:] if pascal else ""
    
    @staticmethod
    def to_kebab_case(name: str) -> str:
        """Convert to kebab-case."""
        words = NameStandardizer._split_to_words(name)
        return '-'.join(w.lower() for w in words if w)
    
    @staticmethod
    def to_snake_case(name: str) -> str:
        """Convert to snake_case."""
        words = NameStandardizer._split_to_words(name)
        return '_'.join(w.lower() for w in words if w)
    
    @staticmethod
    def to_directory_name(name: str) -> str:
        """Convert to directory name (kebab-case)."""
        return NameStandardizer.to_kebab_case(name).strip('-')
    
    @staticmethod
    def to_file_name(name: str, suffix: str = "") -> str:
        """Convert to file name (PascalCase)."""
        base = NameStandardizer.to_pascal_case(name)
        if suffix:
            suffix_clean = re.sub(r'^[-_]+', '', suffix)
            return f"{base}{NameStandardizer.to_pascal_case(suffix_clean)}"
        return base
    
    @staticmethod
    def to_component_name(name: str) -> str:
        """Convert to React component name."""
        return NameStandardizer.to_file_name(name, "Page")
    
    @staticmethod
    def to_hook_name(name: str, action_type: str = "Actions") -> str:
        """Convert to React hook name."""
        return f"use{NameStandardizer.to_pascal_case(name)}{NameStandardizer.to_pascal_case(action_type)}"
    
    @staticmethod
    def to_constant_name(name: str) -> str:
        """Convert to CONSTANT_NAME."""
        return NameStandardizer.to_snake_case(name).upper()