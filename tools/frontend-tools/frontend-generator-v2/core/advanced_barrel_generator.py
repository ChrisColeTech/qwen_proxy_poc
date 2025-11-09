"""
Advanced Barrel Generator with AST parsing, validation, and comprehensive testing
"""

import ast
import re
import json
from pathlib import Path
from typing import Dict, Set, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
import logging

class ExportType(Enum):
    DEFAULT = "default"
    NAMED = "named" 
    NAMESPACE = "namespace"
    TYPE_ONLY = "type_only"

@dataclass
class ExportInfo:
    """Detailed information about an export"""
    name: str
    export_type: ExportType
    file_path: Path
    line_number: int
    original_name: Optional[str] = None  # For renamed exports
    is_type: bool = False
    is_interface: bool = False
    is_class: bool = False
    is_function: bool = False
    is_const: bool = False

@dataclass
class FileAnalysis:
    """Complete analysis of a TypeScript file"""
    file_path: Path
    exports: List[ExportInfo] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    has_default_export: bool = False
    has_named_exports: bool = False
    syntax_errors: List[str] = field(default_factory=list)
    dependencies: Set[str] = field(default_factory=set)

@dataclass
class ConflictInfo:
    """Information about export conflicts"""
    export_name: str
    files: List[Path]
    resolution_strategy: str
    resolved: bool = False

class AdvancedBarrelGenerator:
    """Advanced barrel generator with comprehensive analysis and testing"""
    
    def __init__(self, base_path: Path, verbose: bool = True):
        self.base_path = base_path
        self.verbose = verbose
        
        # In-memory data structures for tracking
        self.file_analyses: Dict[Path, FileAnalysis] = {}
        self.export_registry: Dict[str, List[ExportInfo]] = {}
        self.conflicts: List[ConflictInfo] = []
        self.barrel_files: Dict[Path, str] = {}
        
        # Statistics and validation
        self.stats = {
            'files_analyzed': 0,
            'exports_found': 0,
            'conflicts_detected': 0,
            'conflicts_resolved': 0,
            'barrels_generated': 0
        }
        
        # Setup logging
        self.logger = self._setup_logging()
        
    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging"""
        logger = logging.getLogger('AdvancedBarrelGenerator')
        logger.setLevel(logging.DEBUG if self.verbose else logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '🔍 %(levelname)s [%(name)s] %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
        
    def analyze_file(self, file_path: Path) -> FileAnalysis:
        """Comprehensive analysis of a TypeScript file using multiple parsing strategies"""
        self.logger.debug(f"Analyzing file: {file_path}")
        
        analysis = FileAnalysis(file_path=file_path)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Strategy 1: Regex-based parsing (fast, handles most cases)
            self._parse_with_regex(content, analysis)
            
            # Strategy 2: Line-by-line analysis for complex cases
            self._parse_line_by_line(content, analysis)
            
            # Strategy 3: Validate and cross-check results
            self._validate_analysis(analysis)
            
            self.file_analyses[file_path] = analysis
            self.stats['files_analyzed'] += 1
            self.stats['exports_found'] += len(analysis.exports)
            
        except Exception as e:
            self.logger.error(f"Failed to analyze {file_path}: {e}")
            analysis.syntax_errors.append(str(e))
            
        return analysis
        
    def _parse_with_regex(self, content: str, analysis: FileAnalysis):
        """Fast regex-based parsing for common export patterns"""
        # Remove comments and strings
        clean_content = self._clean_content(content)
        
        # Default exports
        default_matches = re.findall(
            r'export\s+default\s+(?:(?:function|class|interface)\s+(\w+)|(\w+))',
            clean_content, re.MULTILINE
        )
        for match in default_matches:
            name = match[0] or match[1] or analysis.file_path.stem
            analysis.exports.append(ExportInfo(
                name=name,
                export_type=ExportType.DEFAULT,
                file_path=analysis.file_path,
                line_number=self._find_line_number(content, f"export default.*{name}")
            ))
            analysis.has_default_export = True
            
        # Named exports - function/class/interface declarations
        named_patterns = [
            (r'export\s+(?:declare\s+)?function\s+(\w+)', True, False, True, False),
            (r'export\s+(?:declare\s+)?class\s+(\w+)', False, True, False, False),
            (r'export\s+(?:declare\s+)?interface\s+(\w+)', False, False, False, False),
            (r'export\s+(?:declare\s+)?type\s+(\w+)', False, False, False, False),
            (r'export\s+const\s+(\w+)', False, False, False, True),
        ]
        
        for pattern, is_func, is_class, is_func_flag, is_const in named_patterns:
            matches = re.findall(pattern, clean_content, re.MULTILINE)
            for name in matches:
                analysis.exports.append(ExportInfo(
                    name=name,
                    export_type=ExportType.NAMED,
                    file_path=analysis.file_path,
                    line_number=self._find_line_number(content, pattern.replace('(\\w+)', name)),
                    is_function=is_func_flag,
                    is_class=is_class,
                    is_const=is_const
                ))
                analysis.has_named_exports = True
                
        # Export { ... } statements
        export_braces = re.findall(r'export\s*\{\s*([^}]+)\s*\}', clean_content)
        for export_list in export_braces:
            items = re.findall(r'(\w+)(?:\s+as\s+(\w+))?', export_list)
            for original, renamed in items:
                final_name = renamed if renamed else original
                analysis.exports.append(ExportInfo(
                    name=final_name,
                    export_type=ExportType.NAMED,
                    file_path=analysis.file_path,
                    line_number=self._find_line_number(content, f"export.*{original}"),
                    original_name=original if renamed else None
                ))
                analysis.has_named_exports = True
                
    def _parse_line_by_line(self, content: str, analysis: FileAnalysis):
        """Detailed line-by-line parsing for complex cases"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Skip comments and empty lines
            if not line or line.startswith('//') or line.startswith('/*'):
                continue
                
            # Check for complex export patterns that regex might miss
            if 'export' in line and ('=' in line or 'from' in line):
                self.logger.debug(f"Complex export found at line {i}: {line}")
                # Handle re-exports, complex assignments, etc.
                
    def _clean_content(self, content: str) -> str:
        """Remove comments and strings to avoid false matches"""
        # Remove single-line comments
        content = re.sub(r'//.*?$', '', content, flags=re.MULTILINE)
        # Remove multi-line comments  
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        # Remove string literals
        content = re.sub(r'"(?:[^"\\\\]|\\\\.)*"', '""', content)
        content = re.sub(r"'(?:[^'\\\\]|\\\\.)*'", "''", content)
        content = re.sub(r'`(?:[^`\\\\]|\\\\.)*`', '``', content)
        return content
        
    def _to_camel_case(self, text: str) -> str:
        """Convert text to camelCase"""
        # If already camelCase or no separators, return as-is
        if not re.search(r'[-_\s\.]+', text):
            return text
        
        words = re.split(r'[-_\s\.]+', text)
        if not words:
            return text
        return words[0].lower() + ''.join(word.capitalize() for word in words[1:])
    
    def _detect_priority_subdirectories(self, subdirectories):
        """Detect subdirectories that contain commonly used types and should get priority"""
        priority_subdirs = set()
        
        # Define commonly used type patterns that should get priority
        priority_patterns = {
            'auth': ['AuthState', 'AuthActions', 'User', 'LoginRequest', 'RegisterRequest'],
            'core': ['ApiResponse', 'Config', 'BaseEntity'],
            'ui': ['ComponentProps', 'Theme', 'ButtonProps']
        }
        
        for subdir in subdirectories:
            subdir_name = subdir.name.lower()
            
            # Check if this subdirectory matches known priority patterns
            for priority_key, expected_types in priority_patterns.items():
                if priority_key in subdir_name:
                    # Verify the subdirectory actually contains the expected types
                    if self._subdirectory_contains_types(subdir, expected_types):
                        priority_subdirs.add(subdir.name)
                        self.logger.info(f"Detected priority subdirectory: {subdir.name} (contains {expected_types})")
                        break
        
        return priority_subdirs
    
    def _subdirectory_contains_types(self, subdir_path, expected_types):
        """Check if a subdirectory contains the expected type definitions"""
        try:
            # Look for TypeScript/JavaScript files in the subdirectory
            for file_path in subdir_path.iterdir():
                if file_path.is_file() and file_path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
                    try:
                        content = file_path.read_text(encoding='utf-8')
                        # Count how many expected types are found in this file
                        found_types = 0
                        for type_name in expected_types:
                            # Look for interface, type, or class definitions
                            if re.search(rf'\b(?:export\s+)?(?:interface|type|class)\s+{type_name}\b', content):
                                found_types += 1
                        
                        # If we find at least half of the expected types, consider it a priority
                        if found_types >= len(expected_types) / 2:
                            return True
                    except (UnicodeDecodeError, PermissionError):
                        continue
            return False
        except (OSError, PermissionError):
            return False
    
    def _is_type_only_file(self, file_path):
        """Check if a file contains only type definitions (interfaces, types, enums)"""
        try:
            content = file_path.read_text(encoding='utf-8')
            # Remove comments and strings to avoid false matches
            content = self._clean_content(content)
            
            # Check for type-only patterns
            type_patterns = [
                r'\bexport\s+(?:interface|type|enum)\s+\w+',
                r'\bexport\s+\{\s*type\s+',
                r'\bexport\s+type\s+\{'
            ]
            
            # Check for value patterns that would make it NOT type-only
            value_patterns = [
                r'\bexport\s+(?:const|let|var|function|class)\s+\w+',
                r'\bexport\s+default\s+(?:function|class|\w+)',
                r'\bexport\s+\{[^}]*\w+(?:\s+as\s+\w+)?[^}]*\}(?!\s*from)',  # Named exports without 'from'
            ]
            
            # Count type vs value exports
            type_exports = 0
            value_exports = 0
            
            for pattern in type_patterns:
                type_exports += len(re.findall(pattern, content, re.MULTILINE))
            
            for pattern in value_patterns:
                value_exports += len(re.findall(pattern, content, re.MULTILINE))
            
            # File is type-only if it has type exports and no value exports
            is_type_only = type_exports > 0 and value_exports == 0
            
            # Additional check: files ending with .d.ts are always type-only
            if file_path.name.endswith('.d.ts'):
                is_type_only = True
            
            # However, if we detected value exports, respect that over filename conventions
            # This prevents .types.ts files with constants from being incorrectly marked as type-only
            if value_exports > 0:
                is_type_only = False
                self.logger.debug(f"File {file_path.name} has {value_exports} value exports, treating as mixed file")
            
            return is_type_only
            
        except (UnicodeDecodeError, PermissionError, OSError):
            return False
    
    def _is_type_only_directory(self, directory_path):
        """Check if a directory contains only type-only files"""
        try:
            ts_files = [f for f in directory_path.iterdir() 
                       if f.is_file() and f.suffix in ['.ts', '.tsx'] and f.name != 'index.ts']
            
            if not ts_files:
                return False
            
            # Directory is type-only if ALL its TypeScript files are type-only
            return all(self._is_type_only_file(f) for f in ts_files)
            
        except (OSError, PermissionError):
            return False
    
    def _find_consumer_files(self, base_directory):
        """Find all TypeScript files that might import from barrels"""
        consumer_files = []
        try:
            for file_path in base_directory.rglob("*.ts"):
                if file_path.name == "index.ts":  # Skip barrel files
                    continue
                consumer_files.append(file_path)
            for file_path in base_directory.rglob("*.tsx"):
                if file_path.name == "index.tsx":  # Skip barrel files  
                    continue
                consumer_files.append(file_path)
        except (OSError, PermissionError):
            pass
        return consumer_files
    
    def _analyze_import_statement(self, line):
        """Parse an import statement and return import details"""
        import re
        
        # Match various import patterns
        patterns = [
            # import { A, B } from 'module'
            r"import\s*\{\s*([^}]+)\s*\}\s*from\s*['\"]([^'\"]+)['\"]",
            # import A from 'module'
            r"import\s+(\w+)\s+from\s*['\"]([^'\"]+)['\"]",
            # import type { A, B } from 'module'
            r"import\s+type\s*\{\s*([^}]+)\s*\}\s*from\s*['\"]([^'\"]+)['\"]",
            # import * as A from 'module'
            r"import\s*\*\s*as\s+(\w+)\s+from\s*['\"]([^'\"]+)['\"]"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, line.strip())
            if match:
                imports, module = match.groups()
                import_type = "named" if "{" in line else "default" if "* as" not in line else "namespace"
                has_type_keyword = "import type" in line
                
                if import_type == "named":
                    import_list = [imp.strip() for imp in imports.split(",")]
                else:
                    import_list = [imports.strip()]
                
                return {
                    "type": import_type,
                    "imports": import_list,
                    "module": module,
                    "has_type_keyword": has_type_keyword,
                    "original_line": line
                }
        return None
    
    def _fix_consumer_imports(self, base_directory):
        """Find and fix import issues in consumer files"""
        print("🔧 Analyzing and fixing consumer imports...")
        
        consumer_files = self._find_consumer_files(base_directory)
        fixes_applied = 0
        
        for consumer_file in consumer_files:
            try:
                content = consumer_file.read_text(encoding='utf-8')
                lines = content.splitlines()
                modified = False
                new_lines = []
                
                for line in lines:
                    new_line = line
                    
                    # Skip non-import lines
                    if not line.strip().startswith("import"):
                        new_lines.append(line)
                        continue
                    
                    import_info = self._analyze_import_statement(line)
                    if not import_info:
                        new_lines.append(line)
                        continue
                    
                    module = import_info["module"]
                    
                    # Fix 1: Type-only imports from type-only barrels
                    if self._should_use_type_import(module, import_info["imports"], base_directory):
                        if not import_info["has_type_keyword"] and import_info["type"] == "named":
                            # Convert to type import
                            imports_str = ", ".join(import_info["imports"])
                            new_line = f"import type {{ {imports_str} }} from '{module}';"
                            modified = True
                            self.logger.debug(f"Fixed type import in {consumer_file.name}: {imports_str}")
                    
                    # Fix 2: Default imports from components with no default export
                    if import_info["type"] == "default":
                        if self._should_use_named_import(module, import_info["imports"][0], base_directory):
                            # Convert default import to named import
                            component_name = import_info["imports"][0]
                            new_line = f"import {{ {component_name} }} from '{module}';"
                            modified = True
                            self.logger.debug(f"Fixed default import in {consumer_file.name}: {component_name}")
                    
                    new_lines.append(new_line)
                
                if modified:
                    # Write back the fixed content
                    fixed_content = "\n".join(new_lines)
                    consumer_file.write_text(fixed_content, encoding='utf-8')
                    fixes_applied += 1
                    self.logger.info(f"Fixed imports in {consumer_file.name}")
                    
            except (UnicodeDecodeError, PermissionError, OSError) as e:
                self.logger.warning(f"Could not process consumer file {consumer_file}: {e}")
        
        if fixes_applied > 0:
            print(f"✅ Applied import fixes to {fixes_applied} consumer files")
        else:
            print("ℹ️  No consumer import fixes needed")
    
    def _should_use_type_import(self, module_path, imports, base_directory):
        """Check if imports should use 'import type' based on barrel export pattern"""
        try:
            # Resolve relative import to actual barrel file
            # This is a simplified resolution - in practice would need full path resolution
            if module_path.startswith("../") or module_path.startswith("./"):
                # For this implementation, we'll check common patterns
                if "types" in module_path:
                    # Check if the barrel uses 'export type *' pattern
                    barrel_path = self._resolve_barrel_path(module_path, base_directory)
                    if barrel_path and barrel_path.exists():
                        barrel_content = barrel_path.read_text()
                        # If barrel uses type-only exports, consumer should use type imports
                        return "export type *" in barrel_content
            return False
        except (OSError, UnicodeDecodeError):
            return False
    
    def _should_use_named_import(self, module_path, import_name, base_directory):
        """Check if default import should be converted to named import"""
        try:
            # Resolve the actual component file
            component_path = self._resolve_component_path(module_path, base_directory)
            if component_path and component_path.exists():
                content = component_path.read_text()
                # Check if component has default export
                has_default = "export default" in content
                # Check if component has named export with same name
                has_named = f"export const {import_name}" in content or f"export function {import_name}" in content
                
                # If no default but has named, should use named import
                return not has_default and has_named
            return False
        except (OSError, UnicodeDecodeError):
            return False
    
    def _resolve_barrel_path(self, module_path, base_directory):
        """Resolve relative module path to actual barrel file path"""
        # Simplified resolution - would need full path resolution in practice
        try:
            # Remove leading ./ or ../
            clean_path = module_path.replace("../", "").replace("./", "")
            potential_barrel = base_directory / clean_path / "index.ts"
            return potential_barrel if potential_barrel.exists() else None
        except:
            return None
    
    def _resolve_component_path(self, module_path, base_directory):
        """Resolve relative module path to actual component file path"""
        try:
            # Remove leading ./ or ../
            clean_path = module_path.replace("../", "").replace("./", "")
            
            # Try .tsx first, then .ts
            for ext in [".tsx", ".ts"]:
                potential_file = base_directory / (clean_path + ext)
                if potential_file.exists():
                    return potential_file
            return None
        except:
            return None
    
    def _should_be_type_only_file(self, file_path):
        """Check if a file should be type-only (ignoring invalid export default)"""
        try:
            content = file_path.read_text(encoding='utf-8')
            content = self._clean_content(content)
            
            # Check for type-only patterns (same as _is_type_only_file but ignore export default)
            type_patterns = [
                r'\bexport\s+(?:interface|type|enum)\s+\w+',
                r'\bexport\s+\{\s*type\s+',
                r'\bexport\s+type\s+\{'
            ]
            
            # Check for value patterns (excluding export default which we want to remove)
            value_patterns = [
                r'\bexport\s+(?:const|let|var|function|class)\s+\w+',
                r'\bexport\s+\{[^}]*\w+(?:\s+as\s+\w+)?[^}]*\}(?!\s*from)',  # Named exports without 'from'
            ]
            
            # Count type vs value exports (excluding export default)
            type_exports = 0
            value_exports = 0
            
            for pattern in type_patterns:
                type_exports += len(re.findall(pattern, content, re.MULTILINE))
            
            for pattern in value_patterns:
                value_exports += len(re.findall(pattern, content, re.MULTILINE))
            
            # File should be type-only if it has type exports and no value exports
            should_be_type_only = type_exports > 0 and value_exports == 0
            
            # Additional check: files ending with .types.ts are usually type-only
            if file_path.name.endswith('.types.ts') or file_path.name.endswith('.d.ts'):
                should_be_type_only = True
            
            return should_be_type_only
            
        except (UnicodeDecodeError, PermissionError, OSError):
            return False
    
    def _fix_type_only_files(self, directory):
        """Remove invalid 'export default' from files that should be type-only"""
        fixes_applied = 0
        
        try:
            ts_files = list(directory.glob("*.ts"))
            for file_path in ts_files:
                if file_path.name == "index.ts":  # Skip barrel files
                    continue
                
                self.logger.debug(f"Checking if {file_path.name} should be type-only...")
                if self._should_be_type_only_file(file_path):
                    content = file_path.read_text(encoding='utf-8')
                    
                    # Check for invalid export default
                    if "export default" in content:
                        self.logger.info(f"Found invalid 'export default' in should-be-type-only file: {file_path.name}")
                        # Remove export default lines
                        lines = content.splitlines()
                        new_lines = []
                        modified = False
                        
                        for line in lines:
                            if line.strip().startswith("export default"):
                                # Skip this line (remove the export default)
                                modified = True
                                self.logger.info(f"Removing line: {line.strip()}")
                            else:
                                new_lines.append(line)
                        
                        if modified:
                            # Write back the cleaned content
                            fixed_content = "\n".join(new_lines)
                            file_path.write_text(fixed_content, encoding='utf-8')
                            fixes_applied += 1
                            self.logger.info(f"Fixed type-only file: {file_path.name}")
                    else:
                        self.logger.debug(f"Should-be-type-only file {file_path.name} has no export default")
                else:
                    self.logger.debug(f"File {file_path.name} should not be type-only")
                            
        except (OSError, UnicodeDecodeError, PermissionError) as e:
            self.logger.warning(f"Could not fix type-only files: {e}")
        
        if fixes_applied > 0:
            self.logger.info(f"Fixed {fixes_applied} type-only files by removing invalid 'export default'")
        else:
            self.logger.debug(f"No type-only files needed fixing in {directory}")
        
        return fixes_applied

    def _detect_and_fix_missing_exports(self):
        """Detect and fix missing exports based on import usage patterns"""
        fixes_applied = 0
        
        self.logger.info("Detecting missing exports across all files...")
        
        # Step 1: Scan all files for import statements to find what should be exported
        required_exports = {}  # {file_path: {export_name}}
        
        for file_path in list(self.base_path.rglob("*.tsx")) + list(self.base_path.rglob("*.ts")):
            if file_path.name in ["index.tsx", "index.ts"]:  # Skip barrel files
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Look for named imports like: import { baseThemes, SomeType } from "../../path/file"
                import_pattern = r'import\s*\{\s*([^}]+)\}\s*from\s*["\']([^"\']+)["\']'
                matches = re.findall(import_pattern, content)
                
                for imports_str, import_path in matches:
                    # Resolve relative import path to actual file
                    resolved_path = self._resolve_import_path(file_path, import_path)
                    if resolved_path and resolved_path.exists():
                        # Parse imported names
                        imported_names = [name.strip().replace('type ', '') for name in imports_str.split(',')]
                        imported_names = [name for name in imported_names if name and not name.startswith('type')]
                        
                        if resolved_path not in required_exports:
                            required_exports[resolved_path] = set()
                        required_exports[resolved_path].update(imported_names)
                        
            except (OSError, UnicodeDecodeError) as e:
                self.logger.warning(f"Could not scan imports in {file_path}: {e}")
        
        # Step 2: Check each file for missing exports and add them
        for target_file, needed_exports in required_exports.items():
            if self._add_missing_exports_to_file(target_file, needed_exports):
                fixes_applied += 1
                
        if fixes_applied > 0:
            self.logger.info(f"Added missing exports to {fixes_applied} files")
        else:
            self.logger.debug("No missing exports detected")
            
        return fixes_applied
    
    def _resolve_import_path(self, importing_file: Path, import_path: str) -> Path:
        """Resolve relative import path to absolute file path"""
        try:
            if not import_path.startswith('.'):
                # Not a relative import, skip
                return None
                
            # Handle .tsx/.ts file resolution
            base_path = importing_file.parent
            resolved = base_path / import_path
            
            # Try different extensions
            for ext in ['.tsx', '.ts']:
                candidate = resolved.with_suffix(ext)
                if candidate.exists():
                    return candidate
                    
            # Try as directory with index file
            index_candidate = resolved / 'index.tsx'
            if index_candidate.exists():
                return index_candidate
                
            index_candidate = resolved / 'index.ts'  
            if index_candidate.exists():
                return index_candidate
                
        except Exception as e:
            self.logger.debug(f"Could not resolve import path {import_path}: {e}")
            
        return None
    
    def _add_missing_exports_to_file(self, file_path: Path, needed_exports: set) -> bool:
        """Add missing exports to a specific file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Find what's currently exported
            current_exports = set()
            
            # Look for named exports: export { name1, name2 }
            named_export_pattern = r'export\s*\{\s*([^}]+)\}'
            matches = re.findall(named_export_pattern, content)
            for match in matches:
                names = [name.strip() for name in match.split(',')]
                current_exports.update(names)
            
            # Look for direct exports: export const/function/type name
            direct_export_pattern = r'export\s+(?:const|function|type|interface|class)\s+(\w+)'
            matches = re.findall(direct_export_pattern, content)
            current_exports.update(matches)
            
            # Find variables that exist but aren't exported
            missing_exports = set()
            for needed_name in needed_exports:
                if needed_name not in current_exports:
                    # Check if the variable/function exists in the file
                    var_patterns = [
                        rf'^\s*const\s+{re.escape(needed_name)}\s*[:=]',
                        rf'^\s*function\s+{re.escape(needed_name)}\s*\(',
                        rf'^\s*type\s+{re.escape(needed_name)}\s*=',
                        rf'^\s*interface\s+{re.escape(needed_name)}\s*\{{',
                        rf'^\s*class\s+{re.escape(needed_name)}\s*\{{'
                    ]
                    
                    if any(re.search(pattern, content, re.MULTILINE) for pattern in var_patterns):
                        missing_exports.add(needed_name)
                        self.logger.info(f"Found missing export '{needed_name}' in {file_path.name}")
            
            # Add missing exports
            if missing_exports:
                # Add export statement at the end
                export_statement = f"\nexport {{ {', '.join(sorted(missing_exports))} }};\n"
                modified_content = content + export_statement
                
                file_path.write_text(modified_content, encoding='utf-8')
                self.logger.info(f"Added missing exports to {file_path.name}: {', '.join(sorted(missing_exports))}")
                return True
                
        except (OSError, UnicodeDecodeError) as e:
            self.logger.warning(f"Could not fix missing exports in {file_path}: {e}")
            
        return False

    def _fix_type_only_imports(self):
        """Detect and fix imports that should be type-only when verbatimModuleSyntax is enabled"""
        fixes_applied = 0
        
        self.logger.info("Detecting and fixing type-only imports...")
        
        # Scan all TypeScript files for imports that should be type-only
        for file_path in list(self.base_path.rglob("*.tsx")) + list(self.base_path.rglob("*.ts")):
            if file_path.name in ["index.tsx", "index.ts"]:  # Skip barrel files
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                
                # Find all regular imports that might need to be type-only
                if self._fix_file_type_imports(file_path, content):
                    fixes_applied += 1
                    
            except (OSError, UnicodeDecodeError) as e:
                self.logger.warning(f"Could not scan file for type-only imports: {file_path}: {e}")
        
        if fixes_applied > 0:
            self.logger.info(f"Fixed type-only imports in {fixes_applied} files")
        else:
            self.logger.debug("No type-only import fixes needed")
            
        return fixes_applied
    
    def _fix_file_type_imports(self, file_path: Path, content: str) -> bool:
        """Fix type-only imports in a specific file"""
        modified = False
        lines = content.splitlines()
        new_lines = []
        
        for line in lines:
            # Look for regular imports: import { Type1, Type2 } from '...'
            import_match = re.match(r'^(\s*)import\s*\{\s*([^}]+)\}\s*from\s*(["\'][^"\']+["\']);?\s*$', line.strip())
            
            if import_match:
                indent, imports_str, from_path = import_match.groups()
                
                # Parse the imported names
                imported_names = [name.strip() for name in imports_str.split(',')]
                
                # Determine which imports are type-only vs value imports
                type_only_imports = []
                value_imports = []
                
                for name in imported_names:
                    clean_name = name.strip()
                    
                    # Skip if already a type import
                    if clean_name.startswith('type '):
                        type_only_imports.append(clean_name)
                        continue
                    
                    # Check if this import is used only as a type in the file
                    if self._is_import_used_only_as_type(content, clean_name):
                        type_only_imports.append(clean_name)
                        self.logger.info(f"Converting '{clean_name}' to type-only import in {file_path.name}")
                        modified = True
                    else:
                        value_imports.append(clean_name)
                
                # Reconstruct the import line(s)
                new_import_lines = []
                
                # Add type-only imports
                if type_only_imports:
                    type_imports_str = ', '.join(type_only_imports)
                    new_import_lines.append(f"{indent}import type {{ {type_imports_str} }} from {from_path};")
                
                # Add value imports  
                if value_imports:
                    value_imports_str = ', '.join(value_imports)
                    new_import_lines.append(f"{indent}import {{ {value_imports_str} }} from {from_path};")
                
                # If we have both types, add them as separate lines, otherwise use the single line
                if len(new_import_lines) > 1 or (len(new_import_lines) == 1 and type_only_imports):
                    new_lines.extend(new_import_lines)
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)
        
        # Write back the modified content if changes were made
        if modified:
            new_content = '\n'.join(new_lines)
            file_path.write_text(new_content, encoding='utf-8')
            self.logger.info(f"Fixed type-only imports in {file_path.name}")
            
        return modified
    
    def _is_import_used_only_as_type(self, content: str, import_name: str) -> bool:
        """Determine if an import is used only as a type annotation"""
        
        # Remove the import lines from content to avoid false positives
        content_without_imports = re.sub(r'^\s*import\s+.*$', '', content, flags=re.MULTILINE)
        
        # Find all occurrences of the import name
        import_occurrences = list(re.finditer(rf'\b{re.escape(import_name)}\b', content_without_imports))
        
        if not import_occurrences:
            self.logger.debug(f"Import {import_name} not found in file content")
            return False
        
        type_usage_count = 0
        value_usage_count = 0
        
        for match in import_occurrences:
            start_pos = match.start()
            end_pos = match.end()
            
            # Get context around the match (50 chars before and after)
            context_start = max(0, start_pos - 50)
            context_end = min(len(content_without_imports), end_pos + 50)
            context = content_without_imports[context_start:context_end]
            
            # Position of the import name within this context
            local_start = start_pos - context_start
            local_end = end_pos - context_start
            
            # Check what comes immediately before and after the import name
            before_context = context[:local_start].strip()
            after_context = context[local_end:].strip()
            
            # Determine if this usage is type-only or value usage
            is_type_usage = (
                # Type annotation patterns - but NOT JSX usage
                before_context.endswith(': ') or
                (before_context.endswith('<') and not before_context.strip().endswith('<')) or  # Generic, not JSX
                before_context.endswith(' | ') or
                before_context.endswith('| ') or
                after_context.startswith(' |') or
                after_context.startswith('[]') or
                after_context.startswith(' | ') or
                'useState<' in before_context[-20:] or
                'useCallback<' in before_context[-20:] or
                'Promise<' in before_context[-20:] or
                'Array<' in before_context[-20:] or
                'extends ' in before_context[-20:] or
                'implements ' in before_context[-20:]
            )
            
            is_value_usage = (
                # Value usage patterns
                after_context.startswith('(') or  # function call
                after_context.startswith('.') or  # property access
                before_context.endswith('new ') or
                before_context.endswith('= ') and not after_context.startswith('[') and not after_context.startswith('<') or
                before_context.endswith('return ') and not after_context.startswith('<') or
                before_context.endswith('[') and after_context.startswith(']') or
                before_context.endswith('{') and after_context.startswith('}') or
                # JSX component usage - this is the key fix!
                before_context.strip().endswith('<') or  # JSX opening tag: <ComponentName
                (before_context.strip().endswith('<') and after_context.startswith(' ')) or  # <Component props
                after_context.startswith(' className=') or  # JSX with className
                after_context.startswith(' class=') or  # JSX with class
                after_context.startswith(' style=') or  # JSX with style
                after_context.startswith(' id=') or  # JSX with id
                'className=' in after_context[:20] or  # JSX component with className
                '/>' in after_context[:20] or  # Self-closing JSX
                '>' in after_context[:10] and not after_context.startswith('>') or  # JSX closing
                # Additional JSX patterns
                re.search(r'^[a-zA-Z][a-zA-Z0-9]*\s*=', after_context) or  # JSX props
                re.search(r'<\s*$', before_context[-5:])  # JSX opening bracket
            )
            
            if is_type_usage:
                type_usage_count += 1
                self.logger.debug(f"Found type usage of {import_name}: ...{before_context[-20:]}{import_name}{after_context[:20]}...")
            elif is_value_usage:
                value_usage_count += 1
                self.logger.debug(f"Found value usage of {import_name}: ...{before_context[-20:]}{import_name}{after_context[:20]}...")
            else:
                # Ambiguous usage - be conservative
                self.logger.debug(f"Ambiguous usage of {import_name}: ...{before_context[-20:]}{import_name}{after_context[:20]}...")
                value_usage_count += 1
        
        # If we found any value usage, it's not type-only
        if value_usage_count > 0:
            self.logger.debug(f"{import_name} has {value_usage_count} value usages, not converting to type-only")
            return False
        
        # If we only found type usage, convert to type-only
        if type_usage_count > 0:
            self.logger.debug(f"{import_name} has only {type_usage_count} type usages, converting to type-only")
            return True
        
        # If no clear patterns found, be conservative and don't convert
        self.logger.debug(f"No clear usage pattern for {import_name}, keeping as regular import")
        return False
        
    def _find_line_number(self, content: str, pattern: str) -> int:
        """Find line number for a pattern match"""
        try:
            match = re.search(pattern, content, re.MULTILINE)
            if match:
                return content[:match.start()].count('\n') + 1
        except:
            pass
        return 1
        
    def _validate_analysis(self, analysis: FileAnalysis):
        """Validate analysis results and detect inconsistencies"""
        # Check for multiple default exports
        default_exports = [e for e in analysis.exports if e.export_type == ExportType.DEFAULT]
        if len(default_exports) > 1:
            analysis.syntax_errors.append(f"Multiple default exports detected: {[e.name for e in default_exports]}")
            
        # Check for duplicate named exports
        named_exports = [e.name for e in analysis.exports if e.export_type == ExportType.NAMED]
        if len(named_exports) != len(set(named_exports)):
            duplicates = [name for name in named_exports if named_exports.count(name) > 1]
            analysis.syntax_errors.append(f"Duplicate named exports: {duplicates}")
            
        # Check for conflicts between default and named exports with same name
        all_export_names = [e.name for e in analysis.exports]
        if len(all_export_names) != len(set(all_export_names)):
            duplicates = [name for name in all_export_names if all_export_names.count(name) > 1]
            analysis.syntax_errors.append(f"Export name conflicts (default vs named): {duplicates}")
            
    def build_export_registry(self):
        """Build comprehensive registry of all exports"""
        self.logger.info("Building export registry...")
        
        for analysis in self.file_analyses.values():
            # Deduplicate exports by (name, file_path) to avoid false conflicts
            seen_exports = set()
            for export in analysis.exports:
                export_key = (export.name, export.file_path)
                if export_key in seen_exports:
                    continue  # Skip duplicate
                seen_exports.add(export_key)
                
                if export.name not in self.export_registry:
                    self.export_registry[export.name] = []
                self.export_registry[export.name].append(export)
                
        # Detect conflicts
        for export_name, export_list in self.export_registry.items():
            if len(export_list) > 1:
                # Check for cross-directory conflicts
                directories = set(e.file_path.parent for e in export_list)
                if len(directories) > 1:
                    conflict = ConflictInfo(
                        export_name=export_name,
                        files=[e.file_path for e in export_list],
                        resolution_strategy="qualified_import"
                    )
                    self.conflicts.append(conflict)
                    self.stats['conflicts_detected'] += 1
                
                # Check for within-directory conflicts (multiple files in same directory)
                elif len(export_list) > 1:
                    # Multiple files in the same directory export the same name
                    conflict = ConflictInfo(
                        export_name=export_name,
                        files=[e.file_path for e in export_list],
                        resolution_strategy="qualified_import_within_dir"
                    )
                    self.conflicts.append(conflict)
                    self.stats['conflicts_detected'] += 1
                    self.logger.warning(f"Within-directory conflict detected: {export_name} in {export_list[0].file_path.parent}")
                    
        self.logger.info(f"Export registry built: {len(self.export_registry)} unique exports, {len(self.conflicts)} conflicts")
        
    def fix_individual_file_exports(self, file_path: Path):
        """Fix individual files to support both default and named imports"""
        try:
            if file_path not in self.file_analyses:
                self.analyze_file(file_path)
            
            analysis = self.file_analyses[file_path]
            
            # Only fix files that have default exports but no named exports
            if analysis.has_default_export and not analysis.has_named_exports:
                content = file_path.read_text(encoding='utf-8')
                
                # Find the default export line
                default_export_match = None
                for export in analysis.exports:
                    if export.export_type == ExportType.DEFAULT:
                        default_export_match = export
                        break
                
                if default_export_match:
                    component_name = default_export_match.name
                    
                    # Check if we already added the named export
                    if f"export {{ {component_name} }};" in content:
                        return False  # Already fixed
                    
                    # Add named export right after the default export
                    default_export_line = f"export default {component_name};"
                    if default_export_line in content:
                        new_content = content.replace(
                            default_export_line,
                            f"{default_export_line}\nexport {{ {component_name} }};"
                        )
                        
                        file_path.write_text(new_content, encoding='utf-8')
                        self.logger.info(f"Fixed individual file exports: {file_path.name}")
                        
                        # Re-analyze the file after modification
                        self.analyze_file(file_path)
                        return True
                        
        except Exception as e:
            self.logger.warning(f"Failed to fix individual file exports for {file_path}: {e}")
        
        return False

    def generate_barrel(self, directory: Path) -> str:
        """Generate optimized barrel export for a directory"""
        self.logger.info(f"Generating barrel for: {directory}")
        
        # First, fix any type-only files by removing invalid 'export default' (recursive)
        fixed_files = self._fix_type_only_files(directory)
        subdirs_fixed = []
        for subdir in directory.iterdir():
            if subdir.is_dir() and not subdir.name.startswith('.'):
                subdir_fixed = self._fix_type_only_files(subdir)
                if subdir_fixed > 0:
                    subdirs_fixed.append(subdir)
                    fixed_files += subdir_fixed
        
        # If any type-only fixes were applied, we need to clear cached analyses
        # so they get re-analyzed with the updated content
        if fixed_files > 0:
            self.logger.info(f"Clearing analysis cache after fixing {fixed_files} type-only files")
            # Clear file analyses for any files we modified
            self.file_analyses.clear()
            
            # If subdirectories were fixed, regenerate their barrels first
            for subdir in subdirs_fixed:
                if (subdir / "index.ts").exists():
                    self.logger.info(f"Regenerating barrel for fixed subdirectory: {subdir.name}")
                    updated_barrel = self.generate_barrel(subdir)
                    # Write the updated barrel
                    barrel_path = subdir / "index.ts"
                    barrel_path.write_text(updated_barrel, encoding='utf-8')
        
        exports = []
        exports.append(f"// Auto-generated barrel export for {directory.name}")
        exports.append("// Generated by AdvancedBarrelGenerator")
        exports.append("")
        
        # Collect all files in directory
        ts_files = list(directory.glob("*.ts"))
        tsx_files = list(directory.glob("*.tsx"))
        all_files = [f for f in ts_files + tsx_files if f.name != "index.ts"]
        
        # First, fix individual files to support named imports
        files_fixed = 0
        for file_path in all_files:
            if self.fix_individual_file_exports(file_path):
                files_fixed += 1
        
        if files_fixed > 0:
            self.logger.info(f"Fixed {files_fixed} individual files to support named imports")
        
        # Collect all subdirectories
        subdirectories = [d for d in directory.iterdir() if d.is_dir() and not d.name.startswith('.')]
        
        # Group files by export patterns
        default_only_files = []
        named_only_files = []
        mixed_files = []
        
        for file_path in all_files:
            if file_path not in self.file_analyses:
                self.analyze_file(file_path)
                
            analysis = self.file_analyses[file_path]
            
            if analysis.has_default_export and not analysis.has_named_exports:
                default_only_files.append(file_path)
            elif analysis.has_named_exports and not analysis.has_default_export:
                named_only_files.append(file_path)
            elif analysis.has_default_export and analysis.has_named_exports:
                mixed_files.append(file_path)
                
        # Check for global conflicts before generating any exports
        directory_conflicts = [
            c for c in self.conflicts 
            if any(f.parent == directory for f in c.files)
        ]
        
        root_level_conflicting_exports = set()
        if directory_conflicts:
            # Find exports that conflict between root files and subdirectories
            for conflict in directory_conflicts:
                root_files = [f for f in conflict.files if f.parent == directory]
                subdir_files = [f for f in conflict.files if f.parent != directory and f.parent.parent == directory]
                
                if root_files and subdir_files:
                    # This export conflicts between root and subdirectory
                    root_level_conflicting_exports.add(conflict.export_name)
                    self.logger.info(f"Root-subdirectory conflict detected: {conflict.export_name}")
        
        # Check for within-directory conflicts (files in same directory with same exports)
        within_directory_conflicts = set()
        directory_files = [f for f in all_files if f.parent == directory]
        
        for conflict in self.conflicts:
            # Check if multiple files in this directory export the same thing
            conflicting_files_in_dir = [f for f in conflict.files if f.parent == directory]
            if len(conflicting_files_in_dir) > 1:
                within_directory_conflicts.add(conflict.export_name)
                self.logger.warning(f"Within-directory conflict detected: {conflict.export_name} in {len(conflicting_files_in_dir)} files in {directory.name}")
        
        # Generate exports with optimal patterns, excluding conflicting files
        if named_only_files:
            exports.append("// Named exports only")
            for file_path in sorted(named_only_files):
                # Check if this file has any conflicting exports (root-subdirectory OR within-directory)
                file_analysis = self.file_analyses.get(file_path)
                has_root_conflicts = (file_analysis and 
                                     any(export.name in root_level_conflicting_exports 
                                         for export in file_analysis.exports))
                has_within_conflicts = (file_analysis and 
                                       any(export.name in within_directory_conflicts 
                                           for export in file_analysis.exports))
                
                if has_root_conflicts:
                    self.logger.info(f"Skipping conflicting root file: {file_path.name}")
                    # Mark related conflicts as resolved
                    for conflict in directory_conflicts:
                        if file_path in conflict.files:
                            conflict.resolved = True
                elif has_within_conflicts:
                    # Use qualified import for files with within-directory conflicts
                    safe_name = self._to_camel_case(file_path.stem)
                    is_type_only = self._is_type_only_file(file_path)
                    if is_type_only:
                        exports.append(f"export type * as {safe_name} from './{file_path.stem}';")
                        self.logger.info(f"Using qualified type import for conflicting file: {file_path.name} as {safe_name}")
                    else:
                        exports.append(f"export * as {safe_name} from './{file_path.stem}';")
                        self.logger.info(f"Using qualified import for conflicting file: {file_path.name} as {safe_name}")
                    # Mark related conflicts as resolved
                    for conflict in self.conflicts:
                        if conflict.export_name in within_directory_conflicts and file_path in conflict.files:
                            conflict.resolved = True
                else:
                    is_type_only = self._is_type_only_file(file_path)
                    if is_type_only:
                        exports.append(f"export type * from './{file_path.stem}';")
                        self.logger.debug(f"Applied type-only export for file: {file_path.name}")
                    else:
                        exports.append(f"export * from './{file_path.stem}';")
            exports.append("")
            
        if default_only_files:
            exports.append("// Default exports")
            for file_path in sorted(default_only_files):
                # Use the actual component name instead of converted filename
                component_name = file_path.stem  # Keep original case: MobileChessBoard
                # Sanitize component name for imports using camelCase
                safe_export_name = self._to_camel_case(component_name)
                # Standard barrel pattern - only named exports from barrels
                # This supports: import { ComponentName } from './barrel'
                exports.append(f"export {{ default as {safe_export_name} }} from './{file_path.stem}';")
            exports.append("")
            
        if mixed_files:
            exports.append("// Mixed exports (default + named)")
            for file_path in sorted(mixed_files):
                analysis = self.file_analyses[file_path]
                
                # Check if this file has within-directory conflicts
                file_analysis = self.file_analyses.get(file_path)
                has_within_conflicts = (file_analysis and 
                                       any(export.name in within_directory_conflicts 
                                           for export in file_analysis.exports))
                
                if has_within_conflicts:
                    # Use qualified import for files with within-directory conflicts
                    safe_name = self._to_camel_case(file_path.stem)
                    is_type_only = self._is_type_only_file(file_path)
                    if is_type_only:
                        exports.append(f"export type * as {safe_name} from './{file_path.stem}';")
                        self.logger.info(f"Using qualified type import for conflicting mixed file: {file_path.name} as {safe_name}")
                    else:
                        exports.append(f"export * as {safe_name} from './{file_path.stem}';")
                        self.logger.info(f"Using qualified import for conflicting mixed file: {file_path.name} as {safe_name}")
                    
                    # Mark related conflicts as resolved
                    for conflict in self.conflicts:
                        if conflict.export_name in within_directory_conflicts and file_path in conflict.files:
                            conflict.resolved = True
                else:
                    # Export named exports with standard wildcard (no conflicts)
                    exports.append(f"export * from './{file_path.stem}';")
                    
                    # Handle default export with standard barrel pattern
                    default_export = next((e for e in analysis.exports if e.export_type == ExportType.DEFAULT), None)
                    if default_export:
                        component_name = file_path.stem  # Keep original case
                        # Sanitize component name for exports using camelCase
                        safe_export_name = self._to_camel_case(component_name)
                        
                        # Check if there's already a named export with the same name to avoid conflicts
                        named_export_names = {e.name for e in analysis.exports if e.export_type == ExportType.NAMED}
                        
                        if safe_export_name not in named_export_names:
                            # Use standard barrel pattern - only named exports from barrels
                            exports.append(f"export {{ default as {safe_export_name} }} from './{file_path.stem}';")
                        else:
                            self.logger.debug(f"Skipping default alias '{safe_export_name}' for {file_path.name} - conflicts with named export")
            
            exports.append("")
            
        # Export from subdirectories with duplicate validation
        if subdirectories:
            exports.append("// Subdirectory exports")
            
            # Track exports to detect conflicts between files and subdirectories
            all_export_names = set()
            
            # Collect all file exports
            for file_path in all_files:
                if file_path in self.file_analyses:
                    analysis = self.file_analyses[file_path]
                    for export in analysis.exports:
                        all_export_names.add(export.name)
            
            # Check for conflicts and apply resolution strategy
            subdirectory_conflicts = []
            conflicting_subdirs = set()
            
            # Track exports from each subdirectory to detect cross-subdirectory conflicts
            subdirectory_exports = {}  # {subdir_name: set(export_names)}
            
            # First pass: Collect all exports from subdirectory files (not just barrels)
            for subdir in sorted(subdirectories):
                subdir_export_names = set()
                
                # Analyze all TypeScript files in the subdirectory
                ts_files = list(subdir.glob("*.ts")) + list(subdir.glob("*.tsx"))
                ts_files = [f for f in ts_files if f.name != "index.ts"]  # Exclude barrel files
                
                for ts_file in ts_files:
                    if ts_file not in self.file_analyses:
                        self.analyze_file(ts_file)
                    
                    analysis = self.file_analyses[ts_file]
                    for export in analysis.exports:
                        subdir_export_names.add(export.name)
                        self.logger.debug(f"Found export '{export.name}' in {subdir.name}/{ts_file.name}")
                
                subdirectory_exports[subdir.name] = subdir_export_names
                self.logger.debug(f"Subdirectory {subdir.name} exports: {subdir_export_names}")
            
            # Second pass: Detect conflicts between subdirectories and with root files
            for subdir in sorted(subdirectories):
                subdir_export_names = subdirectory_exports.get(subdir.name, set())
                
                for export_name in subdir_export_names:
                    # Check against existing exports from current directory files
                    if export_name in all_export_names:
                        subdirectory_conflicts.append((export_name, subdir.name))
                        conflicting_subdirs.add(subdir.name)
                        self.logger.debug(f"Root-subdirectory conflict: {export_name} in {subdir.name}")
                    
                    # Check against other subdirectories for cross-subdirectory conflicts
                    for other_subdir, other_exports in subdirectory_exports.items():
                        if other_subdir != subdir.name and export_name in other_exports:
                            # Cross-subdirectory conflict detected
                            subdirectory_conflicts.append((export_name, subdir.name))
                            subdirectory_conflicts.append((export_name, other_subdir))
                            conflicting_subdirs.add(subdir.name)
                            conflicting_subdirs.add(other_subdir)
                            self.logger.warning(f"Cross-subdirectory conflict: {export_name} in {subdir.name} and {other_subdir}")
                    
                    all_export_names.add(export_name)
            
            # Apply conflict resolution strategy
            if subdirectory_conflicts:
                self.logger.warning(f"Subdirectory export conflicts detected in {directory}: {subdirectory_conflicts}")
                
                # Check if there are conflicts between subdirectories or with root files
                conflicting_exports = set(c[0] for c in subdirectory_conflicts)
                has_conflicts = len(subdirectory_conflicts) > 0
                
                if has_conflicts:
                    # Strategy: Prioritize commonly used types, qualify others
                    # Check for priority subdirectories (like 'auth' with commonly used types)
                    priority_subdirs = self._detect_priority_subdirectories(subdirectories)
                    self.logger.info(f"Applying conflict resolution strategy for {directory}")
                    
                    for subdir in sorted(subdirectories):
                        # Check if directory contains only type definitions
                        is_type_only = self._is_type_only_directory(subdir)
                        
                        if subdir.name in priority_subdirs:
                            # Priority subdirs get regular exports even if they have conflicts
                            if is_type_only:
                                exports.append(f"export type * from './{subdir.name}';")
                                self.logger.debug(f"Applied type-only export for priority {subdir.name}")
                            else:
                                exports.append(f"export * from './{subdir.name}';")
                                self.logger.debug(f"Applied regular export for priority {subdir.name}")
                            
                            # Mark conflicts as resolved for this priority subdir
                            for conflict in self.conflicts:
                                if conflict.export_name in conflicting_exports and any(f.parent.name == subdir.name for f in conflict.files):
                                    conflict.resolved = True
                                    self.logger.debug(f"Marked conflict '{conflict.export_name}' as resolved for priority {subdir.name}")
                        elif subdir.name in conflicting_subdirs:
                            # Non-priority conflicting subdirs get qualified imports
                            safe_name = self._to_camel_case(subdir.name)
                            if is_type_only:
                                exports.append(f"export type * as {safe_name} from './{subdir.name}';")
                                self.logger.debug(f"Applied qualified type-only import for conflicting {subdir.name} as {safe_name}")
                            else:
                                exports.append(f"export * as {safe_name} from './{subdir.name}';")
                                self.logger.debug(f"Applied qualified import for conflicting {subdir.name} as {safe_name}")
                            
                            # Mark conflicts as resolved 
                            for conflict in self.conflicts:
                                if conflict.export_name in conflicting_exports and any(f.parent.name == subdir.name for f in conflict.files):
                                    conflict.resolved = True
                                    self.logger.debug(f"Marked conflict '{conflict.export_name}' as resolved for {subdir.name}")
                        else:
                            # Use regular export for non-conflicting subdirs
                            if is_type_only:
                                exports.append(f"export type * from './{subdir.name}';")
                                self.logger.debug(f"Applied type-only export for non-conflicting {subdir.name}")
                            else:
                                exports.append(f"export * from './{subdir.name}';")
                                self.logger.debug(f"Applied regular export for non-conflicting {subdir.name}")
                else:
                    # Fallback: export all subdirectories normally
                    for subdir in sorted(subdirectories):
                        is_type_only = self._is_type_only_directory(subdir)
                        if is_type_only:
                            exports.append(f"export type * from './{subdir.name}';")
                            self.logger.debug(f"Applied type-only fallback export for {subdir.name}")
                        else:
                            exports.append(f"export * from './{subdir.name}';")
            else:
                # No conflicts - export all subdirectories normally
                for subdir in sorted(subdirectories):
                    is_type_only = self._is_type_only_directory(subdir)
                    if is_type_only:
                        exports.append(f"export type * from './{subdir.name}';")
                        self.logger.debug(f"Applied type-only export for {subdir.name}")
                    else:
                        exports.append(f"export * from './{subdir.name}';")
                    
            # Final conflict logging
            if subdirectory_conflicts:
                resolved_conflicts = [c for c in self.conflicts if c.resolved]
                self.logger.info(f"Conflicts resolved: {len(resolved_conflicts)}/{len(self.conflicts)}")
                
            exports.append("")
        
        # Add default export if there's a single component with default export
        component_files = len(default_only_files) + len(mixed_files)
        if component_files == 1 and not subdirectories:
            # Single component scenario - make it the default export of the barrel
            if mixed_files:
                single_file = list(mixed_files)[0]
                exports.append(f"// Default export for single component barrel")
                exports.append(f"export {{ default as default }} from './{single_file.stem}';")
            elif default_only_files:
                single_file = list(default_only_files)[0]
                exports.append(f"// Default export for single component barrel")
                exports.append(f"export {{ default as default }} from './{single_file.stem}';")
            
        barrel_content = "\n".join(exports)
        self.barrel_files[directory] = barrel_content
        self.stats['barrels_generated'] += 1
        
        # After generating the barrel, fix any consumer import issues
        # TODO: Re-enable consumer import fixing after debugging
        # self._fix_consumer_imports(directory.parent)
        
        return barrel_content
        
    def validate_barrel_consistency(self, barrel_path: Path) -> List[str]:
        """Validate that a generated barrel has no duplicate exports"""
        validation_errors = []
        
        if not barrel_path.exists():
            return ["Barrel file does not exist"]
            
        try:
            with open(barrel_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract all export statements
            export_patterns = [
                r'export\s*\*\s*from\s*[\'"]([^\'\"]+)[\'"]',  # export * from './file'
                r'export\s*\{\s*default\s+as\s+(\w+)\s*\}',    # export { default as name }
                r'export\s*\{\s*([^}]+)\s*\}',                # export { name1, name2 }
                r'export\s+(?:function|class|interface|type|const|let|var)\s+(\w+)',  # direct exports
            ]
            
            exported_names = set()
            duplicate_sources = []
            
            for pattern in export_patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match[0] else match[1]
                    
                    # Handle comma-separated exports
                    if ',' in match:
                        names = [n.strip() for n in match.split(',')]
                        for name in names:
                            name = name.split(' as ')[-1].strip()  # Handle renamed exports
                            if name in exported_names:
                                duplicate_sources.append(name)
                            exported_names.add(name)
                    else:
                        if match in exported_names:
                            duplicate_sources.append(match)
                        exported_names.add(match)
            
            if duplicate_sources:
                validation_errors.append(f"Duplicate exports detected: {duplicate_sources}")
                
        except Exception as e:
            validation_errors.append(f"Error validating barrel: {e}")
            
        return validation_errors
        
    def create_test_environment(self):
        """Create comprehensive test environment for validation"""
        test_dir = Path(__file__).parent / "barrel_tests"
        test_dir.mkdir(exist_ok=True)
        
        # Test case 1: Default exports only
        (test_dir / "default_only").mkdir(exist_ok=True)
        
        with open(test_dir / "default_only" / "ComponentA.tsx", "w") as f:
            f.write("""import React from 'react';

const ComponentA = () => <div>A</div>;
export default ComponentA;
""")
            
        with open(test_dir / "default_only" / "ComponentB.tsx", "w") as f:
            f.write("""import React from 'react';

export default function ComponentB() {
  return <div>B</div>;
}
""")
            
        # Test case 2: Named exports only
        (test_dir / "named_only").mkdir(exist_ok=True)
        
        with open(test_dir / "named_only" / "utils.ts", "w") as f:
            f.write("""export function utilA() { return 'A'; }
export const utilB = () => 'B';
export class UtilClass {}
export interface UtilInterface {}
""")
            
        with open(test_dir / "named_only" / "constants.ts", "w") as f:
            f.write("""export const CONSTANT_A = 'A';
export const CONSTANT_B = 'B';
export type MyType = string;
""")
            
        # Test case 3: Mixed exports
        (test_dir / "mixed").mkdir(exist_ok=True)
        
        with open(test_dir / "mixed" / "service.ts", "w") as f:
            f.write("""export interface ServiceConfig {}
export class ServiceClass {}

const service = new ServiceClass();
export default service;
""")
            
        # Test case 4: Hierarchical structure (like types/)
        (test_dir / "hierarchical").mkdir(exist_ok=True)
        (test_dir / "hierarchical" / "chess").mkdir(exist_ok=True)
        (test_dir / "hierarchical" / "audio").mkdir(exist_ok=True)
        
        # Main file in root
        with open(test_dir / "hierarchical" / "puzzle.types.ts", "w") as f:
            f.write("""export interface Puzzle { id: string; }""")
            
        # Chess subdirectory
        with open(test_dir / "hierarchical" / "chess" / "chess.types.ts", "w") as f:
            f.write("""export type PieceColor = 'white' | 'black';
export type PieceType = 'king' | 'queen';""")
            
        with open(test_dir / "hierarchical" / "chess" / "computer-opponent.types.ts", "w") as f:
            f.write("""export interface ComputerConfig { difficulty: number; }""")
            
        # Audio subdirectory  
        with open(test_dir / "hierarchical" / "audio" / "audio.types.ts", "w") as f:
            f.write("""export interface AudioConfig { volume: number; }""")
            
        # Test case 5: Duplicate exports within same directory
        (test_dir / "duplicates").mkdir(exist_ok=True)
        
        with open(test_dir / "duplicates" / "fileA.ts", "w") as f:
            f.write("""export const Utils = 'A';
export interface Config { name: string; }""")
            
        with open(test_dir / "duplicates" / "fileB.ts", "w") as f:
            f.write("""export const Utils = 'B';  // Duplicate!
export const Helper = 'B';""")
            
        # Test case 6: Cross-domain conflicts
        (test_dir / "conflicts").mkdir(exist_ok=True)
        (test_dir / "conflicts" / "domain1").mkdir(exist_ok=True)
        (test_dir / "conflicts" / "domain2").mkdir(exist_ok=True)
        
        with open(test_dir / "conflicts" / "domain1" / "shared.ts", "w") as f:
            f.write("""export const SharedUtil = 'domain1';""")
            
        with open(test_dir / "conflicts" / "domain2" / "shared.ts", "w") as f:
            f.write("""export const SharedUtil = 'domain2';""")
            
        self.logger.info(f"Test environment created at: {test_dir}")
        return test_dir
        
    def run_tests(self):
        """Run comprehensive tests on the barrel generation system"""
        self.logger.info("Running barrel generation tests...")
        
        test_dir = self.create_test_environment()
        
        test_results = []
        
        # Test each scenario
        for test_case in ['default_only', 'named_only', 'mixed', 'hierarchical', 'duplicates']:
            case_dir = test_dir / test_case
            
            # Analyze files (including subdirectories)
            for file_path in case_dir.rglob("*.ts*"):
                if file_path.name != "index.ts":
                    self.analyze_file(file_path)
                    
            # For hierarchical test, also generate subdirectory barrels
            if test_case == 'hierarchical':
                for subdir in case_dir.iterdir():
                    if subdir.is_dir():
                        sub_barrel = self.generate_barrel(subdir)
                        sub_barrel_file = subdir / "index.ts"
                        with open(sub_barrel_file, "w") as f:
                            f.write(sub_barrel)
                
            # Generate barrel
            barrel_content = self.generate_barrel(case_dir)
            
            # Write and test barrel
            barrel_file = case_dir / "index.ts"
            with open(barrel_file, "w") as f:
                f.write(barrel_content)
                
            # Validate the generated barrel
            validation_errors = self.validate_barrel_consistency(barrel_file)
            
            test_results.append({
                'test_case': test_case,
                'barrel_generated': True,
                'content_length': len(barrel_content),
                'files_processed': len(list(case_dir.glob("*.ts*"))) - 1,  # -1 for index.ts
                'validation_errors': validation_errors
            })
            
        # Test conflict resolution
        self.build_export_registry()
        
        self.logger.info("Test Results:")
        for result in test_results:
            self.logger.info(f"  {result['test_case']}: {result}")
            
        return test_results
        
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        return {
            'statistics': self.stats,
            'conflicts': [
                {
                    'export_name': c.export_name,
                    'file_count': len(c.files),
                    'files': [str(f) for f in c.files],
                    'resolution_strategy': c.resolution_strategy
                } for c in self.conflicts
            ],
            'file_analyses': len(self.file_analyses),
            'export_registry_size': len(self.export_registry),
            'validation_errors': sum(len(a.syntax_errors) for a in self.file_analyses.values())
        }