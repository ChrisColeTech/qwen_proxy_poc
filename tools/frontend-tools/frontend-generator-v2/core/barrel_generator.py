"""
Barrel Export Generator with Duplicate Detection and Cross-Folder Validation
"""

from pathlib import Path
from typing import Dict, Set, List, Tuple
import re

class BarrelExportGenerator:
    """
    Centralized barrel export generator that tracks all exports across the entire project
    to prevent duplicates and naming conflicts.
    """
    
    def __init__(self, base_path: Path):
        self.base_path = base_path
        # In-memory tracking of all exports across the entire project
        self.global_exports: Dict[str, Set[str]] = {}  # export_name -> {file_paths}
        self.domain_exports: Dict[str, Dict[str, Set[str]]] = {}  # domain -> {export_name -> {file_paths}}
        self.file_exports: Dict[str, Set[str]] = {}  # file_path -> {export_names}
        self.file_has_default: Dict[str, bool] = {}  # file_path -> has_default_export
        self.conflicts: List[Tuple[str, List[str]]] = []  # (export_name, [conflicting_file_paths])
        
    def scan_and_generate_all_barrels(self):
        """
        Scan the entire project, detect all exports, validate for conflicts,
        and generate barrel exports with proper conflict resolution.
        """
        print("🔍 Scanning project for exports...")
        
        # Phase 1: Scan all files and collect exports
        self._scan_all_files()
        
        # Phase 2: Validate for conflicts
        self._validate_conflicts()
        
        # Phase 3: Generate barrel exports with conflict resolution
        self._generate_all_barrels()
        
        # Phase 4: Report results
        self._report_results()
    
    def _scan_all_files(self):
        """Scan all TypeScript files and collect export information"""
        directories_to_scan = ['components', 'hooks', 'services', 'types', 'pages', 'utils', 'stores']
        
        for directory in directories_to_scan:
            dir_path = self.base_path / directory
            if dir_path.exists():
                self._scan_directory(dir_path, directory)
    
    def _scan_directory(self, dir_path: Path, category: str):
        """Recursively scan a directory for exports"""
        for item in dir_path.rglob("*.ts"):
            if item.name == "index.ts":  # Skip existing barrel files
                continue
                
            relative_path = str(item.relative_to(self.base_path))
            domain = self._extract_domain_from_path(relative_path)
            
            exports = self._extract_exports_from_file(item)
            
            # Track exports at different levels
            self.file_exports[relative_path] = exports
            
            # Track global exports
            for export_name in exports:
                if export_name not in self.global_exports:
                    self.global_exports[export_name] = set()
                self.global_exports[export_name].add(relative_path)
                
                # Track domain exports
                if domain not in self.domain_exports:
                    self.domain_exports[domain] = {}
                if export_name not in self.domain_exports[domain]:
                    self.domain_exports[domain][export_name] = set()
                self.domain_exports[domain][export_name].add(relative_path)
    
    def _extract_domain_from_path(self, file_path: str) -> str:
        """Extract domain from file path"""
        parts = file_path.split('/')
        if len(parts) >= 2:
            # For paths like 'types/auth/user.ts', domain is 'auth'
            # For paths like 'components/layout/Header.tsx', domain is 'layout'
            return parts[1] if len(parts) > 2 else parts[0]
        return 'root'
    
    def _to_camel_case(self, text: str) -> str:
        """Convert kebab-case or snake_case to camelCase"""
        # Handle kebab-case (action-sheet -> actionSheet)
        if '-' in text:
            parts = text.split('-')
            return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])
        # Handle snake_case (action_sheet -> actionSheet)  
        elif '_' in text:
            parts = text.split('_')
            return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])
        # Handle spaces (action sheet -> actionSheet)
        elif ' ' in text:
            parts = text.split(' ')
            return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])
        # Already single word
        else:
            return text.lower()
    
    def _extract_exports_from_file(self, file_path: Path) -> Set[str]:
        """Extract export names from a TypeScript file with proper parsing"""
        exports = set()
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove comments and strings to avoid false matches
            content = self._remove_comments_and_strings(content)
            
            # Pattern for named function/class/interface/type exports
            named_exports = re.findall(
                r'export\s+(?:declare\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)',
                content, re.MULTILINE
            )
            exports.update(named_exports)
            
            # Pattern for export { ... } statements
            export_braces = re.findall(r'export\s*\{\s*([^}]+)\s*\}', content, re.MULTILINE)
            for export_list in export_braces:
                # Handle renamed exports: export { foo as bar }
                items = re.findall(r'(\w+)(?:\s+as\s+(\w+))?', export_list)
                for original, renamed in items:
                    exports.add(renamed if renamed else original)
            
            # For default exports, use the filename as the export name
            has_default = bool(re.search(r'export\s+default\s+', content))
            relative_path = str(file_path.relative_to(self.base_path))
            self.file_has_default[relative_path] = has_default
            
            if has_default:
                # Only count one default export per file
                default_count = len(re.findall(r'export\s+default\s+', content))
                if default_count == 1:
                    component_name = file_path.stem
                    if component_name.isidentifier():
                        exports.add(component_name)
                elif default_count > 1:
                    # Multiple default exports - this is an error, treat as named exports only
                    pass
                    
        except Exception as e:
            print(f"⚠️ Error reading {file_path}: {e}")
            
        return exports
    
    def _remove_comments_and_strings(self, content: str) -> str:
        """Remove comments and string literals to avoid false export matches"""
        # Remove single-line comments
        content = re.sub(r'//.*?$', '', content, flags=re.MULTILINE)
        
        # Remove multi-line comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        
        # Remove string literals (basic approach - doesn't handle all edge cases)
        content = re.sub(r'"(?:[^"\\]|\\.)*"', '""', content)
        content = re.sub(r"'(?:[^'\\]|\\.)*'", "''", content)
        content = re.sub(r'`(?:[^`\\]|\\.)*`', '``', content)
        
        return content
    
    def _validate_conflicts(self):
        """Validate for export conflicts across domains"""
        print("🔍 Validating for conflicts...")
        
        for export_name, file_paths in self.global_exports.items():
            if len(file_paths) > 1:
                # Check if conflict is within same domain (acceptable) or cross-domain (problematic)
                domains = set()
                for file_path in file_paths:
                    domain = self._extract_domain_from_path(file_path)
                    domains.add(domain)
                
                if len(domains) > 1:
                    # Cross-domain conflict - needs resolution
                    self.conflicts.append((export_name, list(file_paths)))
    
    def _generate_all_barrels(self):
        """Generate barrel exports for all directories"""
        print("📦 Generating barrel exports...")
        
        # Generate domain-specific barrels
        for category in ['components', 'hooks', 'services', 'types', 'pages', 'utils', 'stores']:
            category_path = self.base_path / category
            if category_path.exists():
                self._generate_category_barrels(category_path, category)
    
    def _generate_category_barrels(self, category_path: Path, category: str):
        """Generate barrel exports for a category (e.g., components, types)"""
        # Generate ALL subdirectory barrels first (recursively)
        self._ensure_all_subdirectory_barrels(category_path, category)
        
        # Then generate main category barrel
        self._generate_main_category_barrel(category_path, category)
    
    def _ensure_all_subdirectory_barrels(self, base_path: Path, category: str):
        """Recursively ensure all subdirectories have barrel exports"""
        for item in base_path.iterdir():
            if item.is_dir() and not item.name.startswith('.') and item.name != '__pycache__':
                # Generate barrel for this subdirectory
                self._generate_subdirectory_barrel(item, category, item.name)
                
                # Recursively process nested subdirectories
                self._ensure_all_subdirectory_barrels(item, category)
    
    def _generate_subdirectory_barrel(self, subdir_path: Path, category: str, subdir_name: str):
        """Generate barrel export for any subdirectory"""
        exports = []
        exports.append(f"// {subdir_name.title()} barrel export")
        exports.append("")
        
        has_exports = False
        
        # Export all TypeScript files in this subdirectory
        for file_path in subdir_path.glob("*.ts*"):
            if file_path.name != "index.ts" and not file_path.name.endswith('.d.ts'):
                file_stem = file_path.stem
                
                # Check if this file has exports
                relative_path = str(file_path.relative_to(self.base_path))
                if relative_path in self.file_exports and self.file_exports[relative_path]:
                    file_exports = self.file_exports[relative_path]
                    
                    # Determine export pattern based on actual default export detection
                    has_default = self.file_has_default.get(relative_path, False)
                    
                    if has_default and len(file_exports) == 1 and file_stem in file_exports:
                        # File has exactly one export which is default and matches filename
                        exports.append(f"export {{ default as {file_stem} }} from './{file_stem}';")
                    else:
                        # Named exports only or mixed exports - use export *
                        exports.append(f"export * from './{file_stem}';")
                    
                    has_exports = True
                else:
                    # Fallback - assume it has exports
                    exports.append(f"export * from './{file_stem}';")
                    has_exports = True
        
        # Export nested subdirectories
        for nested_dir in subdir_path.iterdir():
            if nested_dir.is_dir() and not nested_dir.name.startswith('.'):
                exports.append(f"export * from './{nested_dir.name}';")
                has_exports = True
        
        # Write barrel file only if we found exports
        if has_exports and len(exports) > 2:
            index_content = "\n".join(exports)
            index_file = subdir_path / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            # Calculate relative path for display
            rel_path = subdir_path.relative_to(self.base_path)
            print(f"📦 Created {rel_path}/index.ts")
    
    def _generate_main_category_barrel(self, category_path: Path, category: str):
        """Generate main barrel for a category with proper conflict resolution"""
        exports = []
        exports.append(f"// Barrel exports for {category} with conflict resolution")
        exports.append("// Uses qualified exports only for domains with naming conflicts")
        exports.append("")
        
        # Track conflicts and resolve them
        all_domain_exports = {}
        conflicted_exports = set()
        
        # First pass: identify all exports and conflicts
        for domain_dir in sorted(category_path.iterdir()):
            if domain_dir.is_dir() and not domain_dir.name.startswith('.'):
                domain_name = domain_dir.name
                domain_key = f"{category}/{domain_name}"
                
                if domain_key in self.domain_exports:
                    all_domain_exports[domain_name] = self.domain_exports[domain_key]
                    
                    # Check for conflicts with other domains
                    for export_name in self.domain_exports[domain_key].keys():
                        for other_domain, other_exports in all_domain_exports.items():
                            if other_domain != domain_name and export_name in other_exports:
                                conflicted_exports.add(export_name)
        
        # Second pass: generate exports with proper conflict resolution
        for domain_dir in sorted(category_path.iterdir()):
            if domain_dir.is_dir() and not domain_dir.name.startswith('.'):
                domain_name = domain_dir.name
                exports.append(f"// {domain_name.title()} {category}")
                
                # Check if this domain has any conflicted exports
                domain_key = f"{category}/{domain_name}"
                has_conflicts = False
                if domain_key in self.domain_exports:
                    for export_name in self.domain_exports[domain_key].keys():
                        if export_name in conflicted_exports:
                            has_conflicts = True
                            break
                
                if has_conflicts:
                    # Use qualified export for conflicted domain
                    camel_domain_name = self._to_camel_case(domain_name)
                    camel_category = self._to_camel_case(category)
                    exports.append(f"export * as {camel_domain_name}{camel_category.title()} from './{domain_name}';")
                else:
                    # Use direct export for non-conflicted domain
                    exports.append(f"export * from './{domain_name}';")
                    
                exports.append("")
        
        # Export root-level files (these shouldn't conflict with domain files)
        for file_path in category_path.glob("*.ts"):
            if file_path.name != "index.ts":
                file_stem = file_path.stem
                exports.append(f"export * from './{file_stem}';")
        
        # Add conflict resolution comment if conflicts were found
        if conflicted_exports:
            exports.insert(2, f"// Conflicts resolved using qualified imports: {', '.join(sorted(conflicted_exports))}")
            exports.insert(3, "")
        
        # Write barrel file
        if len(exports) > 2:
            index_content = "\n".join(exports)
            index_file = category_path / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            print(f"📦 Created {category}/index.ts (resolved {len(conflicted_exports)} conflicts)")
    
    def _generate_domain_barrel(self, domain_path: Path, category: str, domain: str):
        """Generate barrel export for a domain directory"""
        exports = []
        exports.append(f"// {domain.title()} {category} barrel export")
        exports.append("")
        
        # Export all files in the domain
        for file_path in domain_path.glob("*.ts"):
            if file_path.name != "index.ts":
                file_stem = file_path.stem
                
                # Check if this file has default vs named exports
                relative_path = str(file_path.relative_to(self.base_path))
                if relative_path in self.file_exports:
                    file_exports = self.file_exports[relative_path]
                    has_default_export = self.file_has_default.get(relative_path, False)
                    
                    if has_default_export and len(file_exports) == 1 and file_stem in file_exports:
                        # File has exactly one export which is default and matches filename
                        exports.append(f"export {{ default as {file_stem} }} from './{file_stem}';")
                    else:
                        # Named exports or mixed
                        exports.append(f"export * from './{file_stem}';")
                else:
                    # Fallback
                    exports.append(f"export * from './{file_stem}';")
        
        # Write domain barrel file
        if len(exports) > 2:  # More than just header
            index_content = "\n".join(exports)
            index_file = domain_path / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            print(f"📦 Created {category}/{domain}/index.ts")
    
    def _report_results(self):
        """Report generation results and any conflicts found"""
        print(f"\n📊 Export Analysis Results:")
        print(f"   Total exports found: {len(self.global_exports)}")
        print(f"   Files scanned: {len(self.file_exports)}")
        
        if self.conflicts:
            print(f"   ⚠️  Conflicts found: {len(self.conflicts)}")
            for export_name, file_paths in self.conflicts:
                print(f"      '{export_name}' conflicts in:")
                for file_path in file_paths:
                    print(f"        - {file_path}")
        else:
            print("   ✅ No cross-domain conflicts detected")
        
        print("✅ Barrel export generation complete!")