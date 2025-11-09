"""
Smart import management utilities
"""

import re
from typing import List, Dict, Set


class ImportManager:
    """Manages TypeScript/JavaScript imports intelligently"""
    
    def __init__(self, content: str):
        self.content = content
        self.lines = content.split('\n')
        self.imports = self._parse_imports()
    
    def _parse_imports(self) -> Dict[str, Set[str]]:
        """Parse existing imports from the content"""
        imports = {}
        
        for line in self.lines:
            line = line.strip()
            
            # Match: import { A, B, C } from 'module'
            match = re.match(r'import\s*{\s*([^}]+)\s*}\s*from\s*[\'"]([^\'"]+)[\'"]', line)
            if match:
                items = [item.strip() for item in match.group(1).split(',')]
                module = match.group(2)
                if module not in imports:
                    imports[module] = set()
                imports[module].update(items)
            
            # Match: import name from 'module'
            match = re.match(r'import\s+(\w+)\s+from\s*[\'"]([^\'"]+)[\'"]', line)
            if match:
                item = match.group(1)
                module = match.group(2)
                if module not in imports:
                    imports[module] = set()
                imports[module].add(item)
        
        return imports
    
    def add_named_import(self, module: str, item: str) -> str:
        """Add a named import, avoiding duplicates"""
        if module in self.imports and item in self.imports[module]:
            # Already imported, return content unchanged
            return self.content
        
        # Add to our tracking
        if module not in self.imports:
            self.imports[module] = set()
        self.imports[module].add(item)
        
        # Find existing import for this module
        for i, line in enumerate(self.lines):
            match = re.match(r'import\s*{\s*([^}]+)\s*}\s*from\s*[\'"]' + re.escape(module) + r'[\'"]', line)
            if match:
                # Update existing import
                existing_items = [item.strip() for item in match.group(1).split(',')]
                if item not in existing_items:
                    existing_items.append(item)
                    existing_items.sort()  # Keep imports sorted
                    new_import = f"import {{ {', '.join(existing_items)} }} from '{module}'"
                    self.lines[i] = new_import
                    return '\n'.join(self.lines)
                else:
                    # Already exists
                    return self.content
        
        # No existing import for this module, add new one
        # Find the best place to insert (after other imports)
        insert_index = 0
        for i, line in enumerate(self.lines):
            if line.strip().startswith('import '):
                insert_index = i + 1
            elif line.strip() == '':
                continue
            else:
                break
        
        new_import = f"import {{ {item} }} from '{module}'"
        self.lines.insert(insert_index, new_import)
        return '\n'.join(self.lines)
    
    def has_import(self, module: str, item: str) -> bool:
        """Check if an import already exists"""
        return module in self.imports and item in self.imports[module]


def smart_add_import(content: str, module: str, item: str) -> str:
    """Smart function to add an import without duplicates"""
    manager = ImportManager(content)
    return manager.add_named_import(module, item)