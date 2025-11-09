"""
Navigation Generator

A specialized module for generating navigation files (types.ts, TabBar.tsx, App.tsx)
based on page configuration from PageConfigManager.

Follows Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY).
"""

import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from name_standardizer import NameStandardizer

# Import our config manager
from page_config_manager import PageConfigManager, PageInfo


@dataclass
class NavigationConfig:
    """Configuration for navigation generation."""
    tab_ids: List[str]
    icon_imports: List[str]
    tab_configurations: List[str]
    grid_columns: int
    child_page_clearing_condition: str
    page_imports: List[str]
    page_routing: List[str]
    first_tab_id: str  # For appStore default selectedTab


class NavigationGenerator:
    """
    Generates navigation files based on page configuration.
    
    Responsibilities:
    - Read page configuration from PageConfigManager
    - Generate TypeScript types for navigation
    - Generate TabBar configuration with proper grid layout
    - Generate App.tsx routing logic
    - Handle template variable substitution
    """
    
    def __init__(self, project_root: Path, templates_path: Optional[Path] = None):
        self.project_root = Path(project_root)
        self.config_manager = PageConfigManager(project_root)
        
        # Default templates path
        if templates_path is None:
            templates_path = (
                Path(__file__).parent.parent / 
                "mobile-pages-v2" / "templates" / "dynamic" / "nav"
            )
        self.templates_path = Path(templates_path)
        
        # Validate templates exist
        self._validate_templates()
    
    def _validate_templates(self) -> None:
        """Validate that all required templates exist."""
        required_templates = [
            "types.ts.dynamic",
            "TabBar.tsx.dynamic", 
            "App.tsx.dynamic"
        ]
        
        for template in required_templates:
            template_path = self.templates_path / template
            if not template_path.exists():
                raise FileNotFoundError(f"Required template not found: {template_path}")
    
    def generate_navigation_config(self) -> NavigationConfig:
        """Generate navigation configuration from page config."""
        pages = self.config_manager.get_pages_for_navigation()
        
        if not pages:
            raise ValueError("No pages found in configuration. Add pages first.")
        
        # Generate tab IDs
        tab_ids = [f"'{page.id}'" for page in pages]
        
        # Generate icon imports (unique icons only)
        icons_used = set()
        for page in pages:
            icons_used.add(page.icon)
        icon_imports = sorted(list(icons_used))
        
        # Generate tab configurations
        tab_configurations = []
        for page in pages:
            tab_config = f"""  {{
    id: "{page.id}",
    label: "{page.name}",
    icon: {page.icon},
    description: "{page.description}",
  }}"""
            tab_configurations.append(tab_config)
        
        # Calculate grid columns (tabs + 1 for menu button)
        grid_columns = len(pages) + 1
        
        # Generate child page clearing condition
        pages_with_children = [
            page.id for page in pages 
            if self.config_manager.get_children_for_parent(page.id)
        ]
        
        if pages_with_children:
            conditions = [f"tab.id === '{page_id}'" for page_id in pages_with_children]
            child_page_clearing_condition = " || ".join(conditions)
        else:
            child_page_clearing_condition = "false"
        
        # Generate page imports
        page_imports = []
        for page in pages:
            page_imports.append(f"import {{ {page.component_name} }} from \"./pages/{page.id}/{page.component_name}\";")
        
        # Generate page routing
        page_routing = []
        for page in pages:
            routing_line = f"      {{selectedTab === \"{page.id}\" && <{page.component_name} />}}"
            page_routing.append(routing_line)
        
        return NavigationConfig(
            tab_ids=tab_ids,
            icon_imports=icon_imports,
            tab_configurations=tab_configurations,
            grid_columns=grid_columns,
            child_page_clearing_condition=child_page_clearing_condition,
            page_imports=page_imports,
            page_routing=page_routing,
            first_tab_id=pages[0].id if pages else 'home'
        )
    
    def _load_template(self, template_name: str) -> str:
        """Load template content from file."""
        template_path = self.templates_path / template_name
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            raise RuntimeError(f"Failed to load template {template_name}: {e}")
    
    def _substitute_variables(self, template: str, config: NavigationConfig) -> str:
        """Substitute template variables with actual values."""
        # Define variable mappings
        substitutions = {
            'TAB_IDS': ' | '.join(config.tab_ids),
            'ICON_IMPORTS': ', '.join(config.icon_imports),
            'TAB_CONFIGURATIONS': ',\n'.join(config.tab_configurations),
            'GRID_COLUMNS': str(config.grid_columns),
            'CHILD_PAGE_CLEARING_CONDITION': config.child_page_clearing_condition,
            'PAGE_IMPORTS': '\n'.join(config.page_imports),
            'PAGE_ROUTING': '\n'.join(config.page_routing),
            'FIRST_TAB_ID': f"'{config.first_tab_id}'"
        }
        
        # Perform substitutions
        result = template
        for variable, value in substitutions.items():
            placeholder = f"{{{{{variable}}}}}"
            result = result.replace(placeholder, value)
        
        return result
    
    def generate_types_ts(self) -> str:
        """Generate types.ts content."""
        config = self.generate_navigation_config()
        template = self._load_template("types.ts.dynamic")
        return self._substitute_variables(template, config)
    
    def generate_tabbar_tsx(self) -> str:
        """Generate TabBar.tsx content."""
        config = self.generate_navigation_config()
        template = self._load_template("TabBar.tsx.dynamic")
        return self._substitute_variables(template, config)
    
    def generate_app_tsx(self) -> str:
        """Generate App.tsx content."""
        config = self.generate_navigation_config()
        template = self._load_template("App.tsx.dynamic")
        return self._substitute_variables(template, config)
    
    
    def generate_uistore_ts(self) -> str:
        """Generate uiStore.ts content with correct selectedTab."""
        config = self.generate_navigation_config()
        template = self._load_template("uiStore.ts.dynamic")
        return self._substitute_variables(template, config)
    
    def generate_app_tsx_for_location(self, app_location: Path) -> str:
        """Generate App.tsx content with correct import paths for specific location."""
        # Get base config but override import paths
        config = self.generate_navigation_config()
        
        # Get src directory (parent of the app location assumed to be src/)
        src_dir = app_location
        
        # Update page imports with correct relative paths
        pages = self.config_manager.get_parent_pages()
        page_imports = self._generate_page_imports_for_location(pages, src_dir)
        page_routing = self._generate_page_routing_with_correct_casing(pages)
        
        # Update the config with location-specific imports and routing
        nav_config = NavigationConfig(
            tab_ids=config.tab_ids,
            icon_imports=config.icon_imports,
            tab_configurations=config.tab_configurations,
            grid_columns=config.grid_columns,
            child_page_clearing_condition=config.child_page_clearing_condition,
            page_imports=page_imports,
            page_routing=page_routing,
            first_tab_id=config.first_tab_id
        )
        
        template = self._load_template("App.tsx.dynamic")
        return self._substitute_variables(template, nav_config)
    
    def _generate_page_imports_for_location(self, pages, src_dir: Path):
        """Generate page imports with correct relative paths."""
        page_imports = []
        
        # Since App.tsx will be at src/, use "./pages" path
        pages_path = "./pages"
        
        for page in pages:
            # Fix component name casing
            component_name = NameStandardizer.to_pascal_case(page.component_name)
            page_imports.append(f"import {{ {component_name} }} from \"{pages_path}/{page.id}/{component_name}\";")
        
        return page_imports
    
    
    def _generate_page_routing_with_correct_casing(self, pages):
        """Generate page routing with correct PascalCase component names."""
        page_routing = []
        for page in pages:
            component_name = NameStandardizer.to_pascal_case(page.component_name)
            routing_line = f"      {{selectedTab === \"{page.id}\" && <{component_name} />}}"
            page_routing.append(routing_line)
        return page_routing
    
    def generate_all_files(self, output_dir: Path) -> Dict[str, Path]:
        """
        Generate all navigation files and write to output directory.
        
        Args:
            output_dir: Directory to write generated files
            
        Returns:
            Dict mapping file type to generated file path
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        generated_files = {}
        
        # Generate types.ts
        types_content = self.generate_types_ts()
        types_path = output_dir / "types.ts"
        with open(types_path, 'w', encoding='utf-8') as f:
            f.write(types_content)
        generated_files['types'] = types_path
        
        # Generate TabBar.tsx
        tabbar_content = self.generate_tabbar_tsx()
        tabbar_path = output_dir / "TabBar.tsx"
        with open(tabbar_path, 'w', encoding='utf-8') as f:
            f.write(tabbar_content)
        generated_files['tabbar'] = tabbar_path
        
        # Generate App.tsx
        app_content = self.generate_app_tsx()
        app_path = output_dir / "App.tsx"
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(app_content)
        generated_files['app'] = app_path
        
        return generated_files
    
    def generate_navigation_files(self, src_dir: Path, layout_dir: Path) -> Dict[str, Path]:
        """
        Generate navigation files in their proper locations.
        
        Args:
            src_dir: Path to src/ directory (for App.tsx)
            layout_dir: Path to src/components/layout/ directory (for types.ts, TabBar.tsx)
        
        Returns:
            Dictionary mapping file types to their paths
        """
        generated_files = {}
        
        # Generate layout components in layout_dir
        types_content = self.generate_types_ts()
        types_path = layout_dir / "types.ts"
        with open(types_path, 'w', encoding='utf-8') as f:
            f.write(types_content)
        generated_files['types'] = types_path
        
        tabbar_content = self.generate_tabbar_tsx()
        tabbar_path = layout_dir / "TabBar.tsx"
        with open(tabbar_path, 'w', encoding='utf-8') as f:
            f.write(tabbar_content)
        generated_files['tabbar'] = tabbar_path
        
        # Generate App.tsx in src_dir with correct relative imports
        app_content = self.generate_app_tsx_for_location(src_dir)
        app_path = src_dir / "App.tsx"
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(app_content)
        generated_files['app'] = app_path
        
        # Generate uiStore.ts in stores directory
        uistore_content = self.generate_uistore_ts()
        stores_dir = src_dir / "stores"
        stores_dir.mkdir(exist_ok=True)
        uistore_path = stores_dir / "uiStore.ts"
        with open(uistore_path, 'w', encoding='utf-8') as f:
            f.write(uistore_content)
        generated_files['uistore'] = uistore_path
        
        return generated_files
    
    def update_project_navigation(self) -> Dict[str, Path]:
        """
        Update navigation files in the actual project.
        
        Updates:
        - src/components/layout/types.ts
        - src/components/layout/TabBar.tsx  
        - src/App.tsx
        
        Returns:
            Dict mapping file type to updated file path
        """
        src_dir = self.project_root / "src"
        if not src_dir.exists():
            raise FileNotFoundError(f"Project src directory not found: {src_dir}")
        
        updated_files = {}
        
        # Update types.ts
        types_content = self.generate_types_ts()
        types_path = src_dir / "components" / "layout" / "types.ts"
        types_path.parent.mkdir(parents=True, exist_ok=True)
        with open(types_path, 'w', encoding='utf-8') as f:
            f.write(types_content)
        updated_files['types'] = types_path
        
        # Update TabBar.tsx
        tabbar_content = self.generate_tabbar_tsx()
        tabbar_path = src_dir / "components" / "layout" / "TabBar.tsx"
        with open(tabbar_path, 'w', encoding='utf-8') as f:
            f.write(tabbar_content)
        updated_files['tabbar'] = tabbar_path
        
        # Update App.tsx
        app_content = self.generate_app_tsx()
        app_path = src_dir / "App.tsx"
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(app_content)
        updated_files['app'] = app_path
        
        return updated_files
    
    def preview_changes(self) -> Dict[str, str]:
        """
        Preview what the generated files would look like without writing them.
        
        Returns:
            Dict mapping file type to generated content
        """
        return {
            'types.ts': self.generate_types_ts(),
            'TabBar.tsx': self.generate_tabbar_tsx(),
            'App.tsx': self.generate_app_tsx()
        }
    
    def get_generation_summary(self) -> Dict[str, any]:
        """Get a summary of what would be generated."""
        config = self.generate_navigation_config()
        pages = self.config_manager.get_pages_for_navigation()
        
        return {
            'total_pages': len(pages),
            'tab_ids': config.tab_ids,
            'grid_columns': config.grid_columns,
            'icons_used': config.icon_imports,
            'pages_with_children': [
                page.id for page in pages 
                if self.config_manager.get_children_for_parent(page.id)
            ],
            'templates_path': str(self.templates_path),
            'config_path': str(self.config_manager.config_path)
        }


class NavigationValidationError(Exception):
    """Raised when navigation configuration is invalid."""
    pass


class NavigationValidator:
    """Validates navigation configuration before generation."""
    
    @staticmethod
    def validate_config(config_manager: PageConfigManager) -> List[str]:
        """
        Validate navigation configuration.
        
        Returns:
            List of validation errors (empty if valid)
        """
        errors = []
        
        # Check for pages
        pages = config_manager.get_pages_for_navigation()
        if not pages:
            errors.append("No pages configured for navigation")
            return errors
        
        # Check for valid icons
        valid_icons = {
            'Settings', 'Target', 'Coins', 'Play', 'Navigation', 'TestTube',
            'Clock', 'Brain', 'Crown', 'Sword', 'Move', 'CheckCircle',
            'RotateCcw', 'RefreshCw', 'SkipForward', 'Volume2', 'Trash2'
        }
        
        for page in pages:
            if page.icon not in valid_icons:
                errors.append(f"Invalid icon '{page.icon}' for page '{page.id}'. Must be a valid Lucide React icon.")
        
        # Check for duplicate page IDs
        page_ids = [page.id for page in pages]
        if len(page_ids) != len(set(page_ids)):
            errors.append("Duplicate page IDs found")
        
        # Check page naming conventions
        for page in pages:
            if not re.match(r'^[a-z][a-z0-9]*$', page.id):
                errors.append(f"Page ID '{page.id}' must be lowercase alphanumeric starting with letter")
            
            if not re.match(r'^[A-Z][A-Za-z0-9 ]*$', page.name):
                errors.append(f"Page name '{page.name}' must start with capital letter")
        
        # Check grid layout constraints (max ~8 tabs for mobile)
        if len(pages) > 8:
            errors.append(f"Too many pages ({len(pages)}). Maximum recommended is 8 for mobile compatibility.")
        
        return errors