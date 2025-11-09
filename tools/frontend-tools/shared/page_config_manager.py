"""
Page Configuration Manager

A specialized module for tracking and managing generated page configurations
that serves as the source of truth for navigation and tabbar generation.

Follows Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY).
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from name_standardizer import NameStandardizer


@dataclass
class PageInfo:
    """Information about a single page."""
    id: str
    name: str
    type: str  # 'parent' or 'child'
    parent_id: Optional[str] = None
    icon: str = "Navigation"
    description: str = ""
    route: str = ""
    component_name: str = ""
    has_mobile: bool = False
    created_at: str = ""
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.route:
            self.route = f"/{self.id.lower()}"
        if not self.component_name:
            self.component_name = f"{NameStandardizer.to_pascal_case(self.name)}Page"


@dataclass 
class ProjectConfig:
    """Project-wide page configuration."""
    version: str = "1.0.0"
    generated_by: str = "mobile-pages-v2"
    last_updated: str = ""
    pages: Dict[str, PageInfo] = None
    
    def __post_init__(self):
        if self.pages is None:
            self.pages = {}
        if not self.last_updated:
            self.last_updated = datetime.now().isoformat()


class PageConfigManager:
    """
    Manages page configuration as source of truth for navigation generation.
    
    Responsibilities:
    - Load/save page configuration from/to JSON file
    - Add/remove/update page entries
    - Track parent-child relationships
    - Provide query methods for navigation generation
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.config_path = self.project_root / "pages.config.json"
        self.config: ProjectConfig = ProjectConfig()
        
        # Ensure project root exists (config goes at root level)
        self.project_root.mkdir(parents=True, exist_ok=True)
        
        # Load existing config
        self.load_config()
    
    def load_config(self) -> bool:
        """Load configuration from file. Returns True if loaded successfully."""
        if not self.config_path.exists():
            return False
            
        try:
            with open(self.config_path, 'r') as f:
                data = json.load(f)
            
            # Convert pages dict back to PageInfo objects
            pages = {}
            for page_id, page_data in data.get('pages', {}).items():
                pages[page_id] = PageInfo(**page_data)
            
            self.config = ProjectConfig(
                version=data.get('version', '1.0.0'),
                generated_by=data.get('generated_by', 'mobile-pages-v2'),
                last_updated=data.get('last_updated', ''),
                pages=pages
            )
            return True
            
        except Exception as e:
            print(f"Warning: Could not load page config: {e}")
            return False
    
    def save_config(self) -> bool:
        """Save current configuration to file. Returns True if saved successfully."""
        try:
            # Update timestamp
            self.config.last_updated = datetime.now().isoformat()
            
            # Convert PageInfo objects to dicts
            pages_dict = {}
            for page_id, page_info in self.config.pages.items():
                pages_dict[page_id] = asdict(page_info)
            
            data = {
                'version': self.config.version,
                'generated_by': self.config.generated_by,
                'last_updated': self.config.last_updated,
                'pages': pages_dict,
                'metadata': {
                    'total_pages': len(self.config.pages),
                    'parent_pages': len(self.get_parent_pages()),
                    'child_pages': len(self.get_child_pages())
                }
            }
            
            with open(self.config_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Error saving page config: {e}")
            return False
    
    def add_page(self, page_info: PageInfo) -> bool:
        """Add a new page to the configuration."""
        if page_info.id in self.config.pages:
            print(f"Warning: Page '{page_info.id}' already exists. Updating...")
        
        self.config.pages[page_info.id] = page_info
        return self.save_config()
    
    def remove_page(self, page_id: str) -> bool:
        """Remove a page from configuration."""
        if page_id not in self.config.pages:
            return False
        
        # Remove the page
        del self.config.pages[page_id]
        
        # Remove any children of this page if it was a parent
        children_to_remove = [
            child_id for child_id, child_info in self.config.pages.items()
            if child_info.parent_id == page_id
        ]
        
        for child_id in children_to_remove:
            del self.config.pages[child_id]
        
        return self.save_config()
    
    def get_page(self, page_id: str) -> Optional[PageInfo]:
        """Get a specific page by ID."""
        return self.config.pages.get(page_id)
    
    def get_parent_pages(self) -> List[PageInfo]:
        """Get all parent pages."""
        return [page for page in self.config.pages.values() if page.type == 'parent']
    
    def get_child_pages(self, parent_id: Optional[str] = None) -> List[PageInfo]:
        """Get child pages, optionally filtered by parent."""
        child_pages = [page for page in self.config.pages.values() if page.type == 'child']
        
        if parent_id:
            child_pages = [page for page in child_pages if page.parent_id == parent_id]
        
        return child_pages
    
    def get_children_for_parent(self, parent_id: str) -> List[PageInfo]:
        """Get all children for a specific parent page."""
        return self.get_child_pages(parent_id)
    
    def has_parent(self, parent_id: str) -> bool:
        """Check if a parent page exists."""
        page = self.get_page(parent_id)
        return page is not None and page.type == 'parent'
    
    def get_all_pages(self) -> Dict[str, PageInfo]:
        """Get all pages."""
        return self.config.pages.copy()
    
    def get_pages_for_navigation(self) -> List[PageInfo]:
        """Get pages that should appear in navigation (parents only)."""
        return sorted(
            self.get_parent_pages(),
            key=lambda p: p.id
        )
    
    def validate_config(self) -> List[str]:
        """Validate configuration and return list of issues."""
        issues = []
        
        for page_id, page_info in self.config.pages.items():
            # Check if child pages have valid parents
            if page_info.type == 'child' and page_info.parent_id:
                if not self.has_parent(page_info.parent_id):
                    issues.append(f"Child page '{page_id}' references non-existent parent '{page_info.parent_id}'")
            
            # Check for missing required fields
            if not page_info.name:
                issues.append(f"Page '{page_id}' missing name")
            
            if not page_info.component_name:
                issues.append(f"Page '{page_id}' missing component_name")
        
        return issues
    
    def get_config_summary(self) -> Dict[str, Any]:
        """Get a summary of the current configuration."""
        return {
            'version': self.config.version,
            'last_updated': self.config.last_updated,
            'total_pages': len(self.config.pages),
            'parent_pages': len(self.get_parent_pages()),
            'child_pages': len(self.get_child_pages()),
            'config_path': str(self.config_path),
            'config_exists': self.config_path.exists()
        }
    
    def reload_config(self) -> None:
        """Reload configuration from disk, clearing any cached data."""
        if self.config_path.exists():
            self.load_config()
        else:
            # If config doesn't exist, create empty one
            self.config = ProjectConfig()
            self.config.generated_by = "mobile-pages-v2"