"""
File Analyzer - Analyzes TypeScript/JavaScript files for export detection
Extracts export information and updates workflow context
"""

import os
import re
from pathlib import Path
from typing import List, Optional
from workflow_context import WorkflowContext, ExportInfo, FileContext


class FileAnalyzer:
    """
    Analyzes TypeScript/JavaScript files to extract export information.
    Updates the workflow context with discovered exports.
    """
    
    def __init__(self):
        self.supported_extensions = {'.ts', '.tsx', '.js', '.jsx'}
        self.exclude_patterns = [
            r'\.test\.',
            r'\.spec\.',
            r'\.d\.ts$',
            r'\.stories\.',
            r'\.config\.',
        ]
        self.setup_patterns()
    
    def setup_patterns(self):
        """Setup regex patterns for export detection"""
        self.export_patterns = {
            # Named exports: export const/function/class/interface/type Name
            'export_declaration': re.compile(
                r'^\s*export\s+(?:(interface|type|class|function|const|let|var|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)|(?:type\s+)?\{\s*([^}]+)\s*\})',
                re.MULTILINE
            ),
            
            # React components and typed exports: export const ComponentName: Type = 
            'export_typed_declaration': re.compile(
                r'^\s*export\s+(const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*[^=]+=',
                re.MULTILINE
            ),
            
            # Default exports
            'export_default_simple': re.compile(
                r'^\s*export\s+default\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*;?\s*$',
                re.MULTILINE
            ),
            'export_default_function': re.compile(
                r'^\s*export\s+default\s+function\s+([A-Za-z_$][A-Za-z0-9_$]*)',
                re.MULTILINE
            ),
            'export_default_class': re.compile(
                r'^\s*export\s+default\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)',
                re.MULTILINE
            ),
        }
    
    def is_valid_file(self, file_path: str) -> bool:
        """Check if file should be processed"""
        path = Path(file_path)
        
        # Check extension
        if path.suffix not in self.supported_extensions:
            return False
        
        # Skip index files to prevent circular references
        if path.name.startswith('index.'):
            return False
        
        # Check exclude patterns
        filename = path.name
        for pattern in self.exclude_patterns:
            if re.search(pattern, filename):
                return False
        
        return True
    
    def analyze_directory(self, context: WorkflowContext, dir_path: str) -> None:
        """
        Analyze all files in a directory and update workflow context.
        This is the main entry point for the file analyzer workflow stage.
        """
        if not os.path.exists(dir_path):
            context.add_error(f"Directory does not exist: {dir_path}")
            return
        
        try:
            entries = os.listdir(dir_path)
        except Exception as e:
            context.add_error(f"Cannot read directory: {e}", dir_path)
            return
        
        # Get directory context
        dir_context = context.get_directory_context(dir_path)
        
        # Process each file
        for entry in entries:
            entry_path = os.path.join(dir_path, entry)
            
            # Handle files
            if os.path.isfile(entry_path):
                if self.is_valid_file(entry_path):
                    file_context = self.analyze_file(context, entry_path)
                    if file_context:
                        dir_context.files.append(file_context)
            
            # Handle subdirectories
            elif (os.path.isdir(entry_path) and 
                  not entry.startswith('.') and 
                  entry != 'node_modules'):
                dir_context.subdirectories.append(entry)
        
        # Check if directory has existing index
        index_path = os.path.join(dir_path, 'index.ts')
        dir_context.has_index = os.path.exists(index_path)
        
        # Determine if directory needs an index
        dir_context.needs_index = (
            len(dir_context.files) > 0 or 
            len(dir_context.subdirectories) > 0
        )
    
    def analyze_file(self, context: WorkflowContext, file_path: str) -> Optional[FileContext]:
        """Analyze a single file and return file context"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            context.add_error(f"Cannot read file: {e}", file_path)
            return None

        path = Path(file_path)
        file_context = FileContext(
            file_path=file_path,
            file_name=path.name,
            file_name_without_ext=path.stem
        )

        # Extract exports
        exports = self.extract_exports(content, file_path)

        if not exports:
            context.add_warning(f"No exports found", file_path)
            return file_context

        # Register exports in context and file context
        for export_info in exports:
            file_context.exports.append(export_info)
            context.register_export(export_info)

        return file_context
    
    def extract_exports(self, content: str, file_path: str) -> List[ExportInfo]:
        """Extract all exports from file content"""
        exports = []
        lines = content.split('\n')
        
        # Remove comments and strings to avoid false matches
        cleaned_content = self._clean_content(content)
        
        # Find named exports
        for match in self.export_patterns['export_declaration'].finditer(cleaned_content):
            exports.extend(self._handle_named_export(match, file_path, lines, cleaned_content))
        
        # Find typed exports (like React components)
        for match in self.export_patterns['export_typed_declaration'].finditer(cleaned_content):
            exports.extend(self._handle_typed_export(match, file_path, lines, cleaned_content))
        
        # Find default exports - try all patterns
        for pattern_name in ['export_default_simple', 'export_default_function', 'export_default_class']:
            for match in self.export_patterns[pattern_name].finditer(cleaned_content):
                exports.extend(self._handle_default_export(match, file_path, lines, cleaned_content))
        
        return self._deduplicate_exports(exports)
    
    def _clean_content(self, content: str) -> str:
        """Remove comments and string literals to avoid false matches"""
        # Remove single line comments
        content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
        
        # Remove multi-line comments
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        
        # Remove string literals (basic approach)
        # Match strings more carefully - only actual quoted strings
        content = re.sub(r'([\'"])(?:(?!\1)[^\\\\]|\\\\.)*\1', '""', content)
        
        return content
    
    def _handle_named_export(self, match, file_path: str, lines: List[str], content: str) -> List[ExportInfo]:
        """Handle named export matches"""
        exports = []
        
        # Get line number for context
        line_start = content[:match.start()].count('\n')
        original_line = lines[line_start].strip() if line_start < len(lines) else ""
        
        if match.group(1) and match.group(2):
            # Direct export: export const/function/class/etc Name
            export_type = match.group(1)
            export_name = match.group(2)
            
            export_info = ExportInfo(
                name=export_name,
                is_default=False,
                is_named=True,
                is_type_only=export_type in ['interface', 'type', 'enum'],
                file_path=file_path,
                original_line=original_line
            )
            exports.append(export_info)
            
        elif match.group(3):
            # Export list: export { Name1, Name2 }
            export_list = match.group(3)
            is_type_export = 'export type {' in original_line
            
            names = self._parse_export_list(export_list)
            for name in names:
                exports.append(ExportInfo(
                    name=name,
                    is_default=False,
                    is_named=True,
                    is_type_only=is_type_export,
                    file_path=file_path,
                    original_line=original_line
                ))
        
        return exports
    
    def _handle_typed_export(self, match, file_path: str, lines: List[str], content: str) -> List[ExportInfo]:
        """Handle typed export matches (like React components)"""
        exports = []
        
        # Get line number for context
        line_start = content[:match.start()].count('\n')
        original_line = lines[line_start].strip() if line_start < len(lines) else ""
        
        export_type = match.group(1)  # const, let, var
        export_name = match.group(2)  # variable name
        
        # Check if it's a type-only export - must be explicitly declared as type
        is_type_only = original_line.startswith('export type ') or export_type in ['interface', 'type', 'enum']
        
        export_info = ExportInfo(
            name=export_name,
            is_default=False,
            is_named=True,
            is_type_only=is_type_only,
            file_path=file_path,
            original_line=original_line
        )
        exports.append(export_info)
        
        return exports
    
    def _handle_default_export(self, match, file_path: str, lines: List[str], content: str) -> List[ExportInfo]:
        """Handle default export matches"""
        exports = []
        
        # Get line number for context
        line_start = content[:match.start()].count('\n')
        original_line = lines[line_start].strip() if line_start < len(lines) else ""
        
        export_name = match.group(1)
        # More precise check for type-only exports - only check export statement itself
        is_type_only = original_line.startswith('export default interface') or original_line.startswith('export default type')
        
        exports.append(ExportInfo(
            name=export_name,
            is_default=True,
            is_named=False,
            is_type_only=is_type_only,
            file_path=file_path,
            original_line=original_line
        ))
        
        return exports
    
    def _parse_export_list(self, export_list: str) -> List[str]:
        """Parse export list into individual names"""
        names = []
        
        for item in export_list.split(','):
            item = item.strip()
            if item:
                # Handle 'as' aliases - take the alias name
                if ' as ' in item:
                    item = item.split(' as ')[1].strip()
                
                # Remove type keyword if present
                if item.startswith('type '):
                    item = item[5:].strip()
                
                if item and item.isidentifier():
                    names.append(item)
        
        return names
    
    def _deduplicate_exports(self, exports: List[ExportInfo]) -> List[ExportInfo]:
        """Remove duplicate exports from the same file"""
        seen = set()
        unique_exports = []
        
        for export in exports:
            # Create unique key based on name, default status, and type
            key = (export.name, export.is_default, export.is_type_only)
            if key not in seen:
                seen.add(key)
                unique_exports.append(export)
        
        return unique_exports