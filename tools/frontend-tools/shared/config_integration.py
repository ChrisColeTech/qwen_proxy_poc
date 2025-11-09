"""
Config Integration Module

Integrates the PageConfigManager with the mobile-pages-v2 generator system.
Ensures every page creation updates the central configuration.

Follows Single Responsibility Principle (SRP) and provides clean integration points.
"""

import json
import sys
from pathlib import Path
from typing import Optional

# Import PageConfigManager from shared module
try:
    from .page_config_manager import PageConfigManager, PageInfo
except ImportError:
    from page_config_manager import PageConfigManager, PageInfo

# Import mobile-pages-v2 config types
try:
    sys.path.append(str(Path(__file__).parent.parent / "mobile-pages-v2" / "modules"))
    from config import PageConfig, GenerationContext
except ImportError:
    # Handle case when running tests or standalone
    pass


class ConfigIntegration:
    """
    Integrates PageConfigManager with mobile-pages-v2 generator.
    
    Responsibilities:
    - Convert between mobile-pages-v2 PageConfig and shared PageInfo
    - Update central config when pages are created/removed
    - Provide config queries for navigation generation
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.config_manager = PageConfigManager(project_root)
    
    def register_parent_page(self, page_config: 'PageConfig') -> bool:
        """
        Register a parent page creation with the central config.
        
        Args:
            page_config: Mobile-pages-v2 PageConfig object
            
        Returns:
            bool: True if successfully registered
        """
        page_info = self._convert_to_page_info(page_config, "parent")
        
        result = self.config_manager.add_page(page_info)
        
        if result:
            print(f"📋 Registered parent page '{page_config.page_id}' in central config")
        else:
            print(f"❌ Failed to register parent page '{page_config.page_id}' in central config")
        
        return result
    
    def register_child_page(self, page_config: 'PageConfig') -> bool:
        """
        Register a child page creation with the central config.
        
        Args:
            page_config: Mobile-pages-v2 PageConfig object
            
        Returns:
            bool: True if successfully registered
        """
        if not page_config.parent:
            raise ValueError("Child pages must have a parent specified")
        
        # Verify parent exists
        if not self.config_manager.has_parent(page_config.parent_id):
            print(f"⚠️  Warning: Parent '{page_config.parent_id}' not found in config for child '{page_config.page_id}'")
        
        page_info = self._convert_to_page_info(page_config, "child")
        page_info.parent_id = page_config.parent_id
        page_info.has_mobile = page_config.mobile
        
        result = self.config_manager.add_page(page_info)
        
        if result:
            print(f"📋 Registered child page '{page_config.page_id}' under parent '{page_config.parent_id}' in central config")
        else:
            print(f"❌ Failed to register child page '{page_config.page_id}' in central config")
        
        return result
    
    def remove_page(self, page_id: str) -> bool:
        """
        Remove a page from the central config.
        
        Args:
            page_id: ID of the page to remove
            
        Returns:
            bool: True if successfully removed
        """
        result = self.config_manager.remove_page(page_id)
        
        if result:
            print(f"📋 Removed page '{page_id}' from central config")
        else:
            print(f"❌ Failed to remove page '{page_id}' from central config")
        
        return result
    
    def get_parent_children(self, parent_id: str) -> list:
        """
        Get all children for a parent page.
        
        Args:
            parent_id: ID of the parent page
            
        Returns:
            list: List of PageInfo objects for children
        """
        return self.config_manager.get_children_for_parent(parent_id)
    
    def get_navigation_pages(self) -> list:
        """
        Get pages suitable for navigation generation.
        
        Returns:
            list: List of parent PageInfo objects sorted by creation time
        """
        return self.config_manager.get_pages_for_navigation()
    
    def has_children(self, parent_id: str) -> bool:
        """
        Check if a parent has any children.
        
        Args:
            parent_id: ID of the parent page
            
        Returns:
            bool: True if parent has children
        """
        children = self.get_parent_children(parent_id)
        return len(children) > 0
    
    def get_config_path(self) -> Path:
        """Get the path to the configuration file."""
        return self.config_manager.config_path
    
    def validate_config(self) -> list:
        """
        Validate the current configuration.
        
        Returns:
            list: List of validation issues (empty if valid)
        """
        return self.config_manager.validate_config()
    
    def get_config_summary(self) -> dict:
        """
        Get a summary of the current configuration.
        
        Returns:
            dict: Configuration summary with counts and metadata
        """
        return self.config_manager.get_config_summary()
    
    def get_page_info(self, page_id: str) -> Optional[dict]:
        """
        Get page information by ID.
        
        Args:
            page_id: ID of the page to retrieve
            
        Returns:
            dict: Page information or None if not found
        """
        page_info = self.config_manager.get_page(page_id)
        if page_info:
            return {
                'id': page_info.id,
                'name': page_info.name,
                'type': page_info.type,
                'parent_id': page_info.parent_id,
                'component_name': page_info.component_name
            }
        return None
    
    def load_config(self) -> dict:
        """
        Load the current configuration data.
        
        Returns:
            dict: Raw configuration data from pages.config.json
        """
        try:
            if not self.config_manager.config_path.exists():
                return {"pages": {}}
            
            with open(self.config_manager.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  Error loading config: {e}")
            return {"pages": {}}
    
    def _convert_to_page_info(self, page_config: 'PageConfig', page_type: str) -> PageInfo:
        """
        Convert mobile-pages-v2 PageConfig to shared PageInfo.
        
        Args:
            page_config: Mobile-pages-v2 PageConfig object
            page_type: "parent" or "child"
            
        Returns:
            PageInfo: Converted PageInfo object
        """
        return PageInfo(
            id=page_config.page_id,
            name=page_config.base_name,
            type=page_type,
            parent_id=page_config.parent_id if hasattr(page_config, 'parent_id') else None,
            icon=page_config.icon,
            description=page_config.description,
            route=f"/{page_config.page_id}",
            component_name=page_config.page_name,
            has_mobile=getattr(page_config, 'mobile', False)
        )
    
    def export_config_for_navigation(self) -> dict:
        """
        Export configuration in format suitable for navigation generation.
        
        Returns:
            dict: Configuration data structured for navigation components
        """
        nav_pages = self.get_navigation_pages()
        
        config_data = {
            "parent_pages": [],
            "tab_data": [],
            "routing_data": []
        }
        
        for page in nav_pages:
            # Parent page data
            config_data["parent_pages"].append({
                "id": page.id,
                "name": page.name,
                "component_name": page.component_name,
                "icon": page.icon,
                "description": page.description,
                "route": page.route,
                "children": [child.id for child in self.get_parent_children(page.id)]
            })
            
            # Tab data for TabBar component
            config_data["tab_data"].append({
                "id": page.id,
                "label": page.name,
                "icon": page.icon,
                "description": page.description
            })
            
            # Routing data for App.tsx
            config_data["routing_data"].append({
                "tab_id": page.id,
                "component_name": page.component_name,
                "import_path": f"./pages/{page.id}/{page.component_name}"
            })
        
        return config_data
    
    def create_config_if_missing(self) -> bool:
        """
        Create configuration file if it doesn't exist.
        
        Returns:
            bool: True if config was created or already exists
        """
        if not self.config_manager.config_path.exists():
            return self.config_manager.save_config()
        return True


# Utility functions for easy integration
def register_parent_page_creation(project_root: Path, page_config: 'PageConfig') -> bool:
    """Utility function to register parent page creation."""
    integration = ConfigIntegration(project_root)
    return integration.register_parent_page(page_config)


def register_child_page_creation(project_root: Path, page_config: 'PageConfig') -> bool:
    """Utility function to register child page creation.""" 
    integration = ConfigIntegration(project_root)
    return integration.register_child_page(page_config)


def get_navigation_config(project_root: Path) -> dict:
    """Utility function to get navigation configuration."""
    integration = ConfigIntegration(project_root)
    return integration.export_config_for_navigation()


def validate_project_config(project_root: Path) -> list:
    """Utility function to validate project configuration."""
    integration = ConfigIntegration(project_root)
    return integration.validate_config()