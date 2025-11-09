"""
Workflow Context - Shared state and data structures for the index generator
Manages exports, directories, and file contexts throughout the generation process
"""

import os
from pathlib import Path
from typing import List, Dict, Set, Optional
from dataclasses import dataclass, field


@dataclass
class ExportInfo:
    """Information about a single export from a file"""
    name: str
    is_default: bool = False
    is_named: bool = True
    is_type_only: bool = False
    file_path: str = ""
    original_line: str = ""


@dataclass
class FileContext:
    """Context information for a single file"""
    file_path: str
    file_name: str
    file_name_without_ext: str
    exports: List[ExportInfo] = field(default_factory=list)


@dataclass
class DirectoryContext:
    """Context information for a directory"""
    directory_path: str
    files: List[FileContext] = field(default_factory=list)
    subdirectories: List[str] = field(default_factory=list)
    has_index: bool = False
    needs_index: bool = False


class WorkflowContext:
    """
    Central context manager for the index generation workflow.
    Tracks all discovered exports, files, and directories.
    """
    
    def __init__(self):
        self.directories: Dict[str, DirectoryContext] = {}
        self.all_exports: Dict[str, List[ExportInfo]] = {}
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def get_directory_context(self, dir_path: str) -> DirectoryContext:
        """Get or create directory context"""
        normalized_path = os.path.normpath(dir_path).replace('\\', '/')
        
        if normalized_path not in self.directories:
            self.directories[normalized_path] = DirectoryContext(
                directory_path=normalized_path
            )
        
        return self.directories[normalized_path]
    
    def register_export(self, export_info: ExportInfo) -> None:
        """Register an export in the global export registry"""
        if export_info.name not in self.all_exports:
            self.all_exports[export_info.name] = []
        self.all_exports[export_info.name].append(export_info)
    
    def should_use_export_type(self, dir_path: str) -> bool:
        """
        Determine if a directory should use 'export type *' vs 'export *'
        Use 'export *' for directories containing interfaces with function signatures
        """
        dir_context = self.directories.get(dir_path)
        if not dir_context:
            return True
        
        # Check if any file in the directory has interfaces with function signatures
        for file_ctx in dir_context.files:
            if self._file_has_function_signatures(file_ctx.file_path):
                return False  # Use 'export *' instead of 'export type *'
        
        return True  # Safe to use 'export type *'
    
    def _file_has_function_signatures(self, file_path: str) -> bool:
        """Check if file contains interfaces with function signatures or React components"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            import re
            
            # Check for function signatures in interfaces/types
            # Match: methodName: (...) => ... inside interface blocks
            interface_pattern = r'interface\s+\w+\s*\{[^}]*\w+\s*:\s*\([^)]*\)\s*=>\s*[^;}]+[;}]'
            if re.search(interface_pattern, content, re.DOTALL):
                return True
            
            # Check for React components (function components or class components)
            # Match patterns like: export function ComponentName, export const ComponentName = () => JSX
            # or export default function ComponentName
            react_patterns = [
                r'export\s+(?:default\s+)?function\s+\w+.*?(?:return\s*<|jsx|React\.)',
                r'export\s+(?:default\s+)?(?:const|let)\s+\w+\s*[:=]\s*\([^)]*\)\s*=>\s*(?:<|\{[^}]*return\s*<)',
                r'export\s+(?:default\s+)?class\s+\w+.*?extends.*?(?:Component|PureComponent)',
                r'\.tsx?$',  # Simple heuristic: .tsx/.ts files in component directories likely contain components
            ]
            
            for pattern in react_patterns:
                if re.search(pattern, content, re.DOTALL | re.IGNORECASE):
                    return True
            
            # Additional heuristic: check file extension and directory context
            path_obj = Path(file_path)
            if path_obj.suffix in ['.tsx', '.jsx']:
                # TSX/JSX files are likely React components
                return True
            
            # Check directory name for component-related paths
            if any(dir_name in file_path.lower() for dir_name in ['component', 'page', 'layout', 'wrapper']):
                # Files in component/page directories are likely React components
                if any(keyword in content.lower() for keyword in ['jsx', 'react', 'return <', 'render']):
                    return True
            
            # Check for const/let value exports (not function or arrow function exports)
            # Match: export const/let variableName = {object} or = value (but not = () => or = function)
            const_value_pattern = r'export\s+(?:const|let)\s+\w+\s*=\s*(?![^\n]*(?:\([^)]*\)\s*=>|function\s*\()).*[{"\'\w]'
            if re.search(const_value_pattern, content, re.MULTILINE):
                return True
            
            return False
        
        except Exception:
            return False
    
    def add_error(self, message: str, context: str = "") -> None:
        """Add an error message"""
        full_message = f"{message}" + (f" ({context})" if context else "")
        self.errors.append(full_message)
        print(f"ERROR: {full_message}")
    
    def add_warning(self, message: str, context: str = "") -> None:
        """Add a warning message"""
        full_message = f"{message}" + (f" ({context})" if context else "")
        self.warnings.append(full_message)
        print(f"WARNING: {full_message}")
    
    def get_directory_export_names(self, dir_path: str) -> Set[str]:
        """Get all export names from a directory (from direct files only, not subdirectories)"""
        dir_context = self.directories.get(dir_path)
        if not dir_context:
            return set()
        
        export_names = set()
        for file_ctx in dir_context.files:
            for export in file_ctx.exports:
                export_names.add(export.name)
        
        return export_names
    
    def print_summary(self) -> None:
        """Print a summary of the workflow context"""
        print("\n=== Workflow Summary ===")
        print(f"Directories processed: {len(self.directories)}")
        print(f"Total unique exports: {len(self.all_exports)}")
        print(f"Warnings: {len(self.warnings)}")
        print(f"Errors: {len(self.errors)}")
        
        if self.errors:
            print("\nErrors:")
            for error in self.errors:
                print(f"  - {error}")