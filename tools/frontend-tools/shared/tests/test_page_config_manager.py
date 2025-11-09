"""
Tests for Page Configuration Manager

Comprehensive test suite ensuring reliability and correctness
of the page configuration management system.
"""

import pytest
import json
import tempfile
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from page_config_manager import PageConfigManager, PageInfo, ProjectConfig


class TestPageInfo:
    """Test PageInfo dataclass functionality."""
    
    def test_page_info_creation_with_defaults(self):
        """Test PageInfo creation with minimal required fields."""
        page = PageInfo(id="test", name="TestPage", type="parent")
        
        assert page.id == "test"
        assert page.name == "TestPage"
        assert page.type == "parent"
        assert page.parent_id is None
        assert page.icon == "Navigation"
        assert page.description == ""
        assert page.route == "/test"
        assert page.component_name == "TestPagePage"
        assert page.has_mobile is False
        assert page.created_at != ""
    
    def test_page_info_creation_with_custom_values(self):
        """Test PageInfo creation with custom values."""
        page = PageInfo(
            id="custom",
            name="CustomPage", 
            type="child",
            parent_id="parent1",
            icon="Star",
            description="Custom description",
            route="/custom/route",
            component_name="CustomComponent",
            has_mobile=True,
            created_at="2024-01-01T00:00:00"
        )
        
        assert page.id == "custom"
        assert page.name == "CustomPage"
        assert page.type == "child"
        assert page.parent_id == "parent1"
        assert page.icon == "Star"
        assert page.description == "Custom description"
        assert page.route == "/custom/route"
        assert page.component_name == "CustomComponent"
        assert page.has_mobile is True
        assert page.created_at == "2024-01-01T00:00:00"


class TestProjectConfig:
    """Test ProjectConfig dataclass functionality."""
    
    def test_project_config_creation_with_defaults(self):
        """Test ProjectConfig creation with defaults."""
        config = ProjectConfig()
        
        assert config.version == "1.0.0"
        assert config.generated_by == "mobile-pages-v2"
        assert config.last_updated != ""
        assert config.pages == {}
    
    def test_project_config_creation_with_pages(self):
        """Test ProjectConfig creation with pages."""
        page1 = PageInfo(id="page1", name="Page1", type="parent")
        page2 = PageInfo(id="page2", name="Page2", type="child", parent_id="page1")
        
        config = ProjectConfig(pages={"page1": page1, "page2": page2})
        
        assert len(config.pages) == 2
        assert "page1" in config.pages
        assert "page2" in config.pages


class TestPageConfigManager:
    """Test PageConfigManager functionality."""
    
    @pytest.fixture
    def temp_project_root(self):
        """Create a temporary project root directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield Path(temp_dir)
    
    @pytest.fixture
    def config_manager(self, temp_project_root):
        """Create a PageConfigManager instance with temporary directory."""
        return PageConfigManager(temp_project_root)
    
    def test_config_manager_initialization(self, config_manager, temp_project_root):
        """Test config manager initialization."""
        expected_config_path = temp_project_root / "pages.config.json"
        
        assert config_manager.project_root == temp_project_root
        assert config_manager.config_path == expected_config_path
        assert config_manager.project_root.exists()
        assert isinstance(config_manager.config, ProjectConfig)
    
    def test_add_parent_page(self, config_manager):
        """Test adding a parent page."""
        page = PageInfo(
            id="testsection",
            name="TestSection", 
            type="parent",
            icon="Settings",
            description="Test section for components"
        )
        
        result = config_manager.add_page(page)
        
        assert result is True
        assert config_manager.config_path.exists()
        
        # Verify page was added
        retrieved_page = config_manager.get_page("testsection")
        assert retrieved_page is not None
        assert retrieved_page.id == "testsection"
        assert retrieved_page.name == "TestSection"
        assert retrieved_page.type == "parent"
        assert retrieved_page.icon == "Settings"
    
    def test_add_child_page(self, config_manager):
        """Test adding a child page with parent."""
        # First add parent
        parent = PageInfo(id="parent1", name="Parent1", type="parent")
        config_manager.add_page(parent)
        
        # Then add child
        child = PageInfo(
            id="child1",
            name="Child1",
            type="child", 
            parent_id="parent1",
            has_mobile=True
        )
        
        result = config_manager.add_page(child)
        
        assert result is True
        
        # Verify child was added
        retrieved_child = config_manager.get_page("child1")
        assert retrieved_child is not None
        assert retrieved_child.parent_id == "parent1"
        assert retrieved_child.has_mobile is True
    
    def test_get_parent_pages(self, config_manager):
        """Test retrieving parent pages."""
        # Add mixed pages
        parent1 = PageInfo(id="parent1", name="Parent1", type="parent")
        parent2 = PageInfo(id="parent2", name="Parent2", type="parent")
        child1 = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        
        config_manager.add_page(parent1)
        config_manager.add_page(parent2)
        config_manager.add_page(child1)
        
        parent_pages = config_manager.get_parent_pages()
        
        assert len(parent_pages) == 2
        assert all(page.type == "parent" for page in parent_pages)
        assert {page.id for page in parent_pages} == {"parent1", "parent2"}
    
    def test_get_child_pages(self, config_manager):
        """Test retrieving child pages."""
        # Add mixed pages
        parent1 = PageInfo(id="parent1", name="Parent1", type="parent")
        child1 = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        child2 = PageInfo(id="child2", name="Child2", type="child", parent_id="parent1")
        
        config_manager.add_page(parent1)
        config_manager.add_page(child1)
        config_manager.add_page(child2)
        
        all_children = config_manager.get_child_pages()
        parent1_children = config_manager.get_child_pages("parent1")
        
        assert len(all_children) == 2
        assert len(parent1_children) == 2
        assert all(page.type == "child" for page in all_children)
        assert all(page.parent_id == "parent1" for page in parent1_children)
    
    def test_get_children_for_parent(self, config_manager):
        """Test getting children for specific parent."""
        # Add pages
        parent1 = PageInfo(id="parent1", name="Parent1", type="parent")
        parent2 = PageInfo(id="parent2", name="Parent2", type="parent")
        child1 = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        child2 = PageInfo(id="child2", name="Child2", type="child", parent_id="parent1")
        child3 = PageInfo(id="child3", name="Child3", type="child", parent_id="parent2")
        
        for page in [parent1, parent2, child1, child2, child3]:
            config_manager.add_page(page)
        
        parent1_children = config_manager.get_children_for_parent("parent1")
        parent2_children = config_manager.get_children_for_parent("parent2")
        
        assert len(parent1_children) == 2
        assert len(parent2_children) == 1
        assert {child.id for child in parent1_children} == {"child1", "child2"}
        assert parent2_children[0].id == "child3"
    
    def test_remove_page(self, config_manager):
        """Test removing a page."""
        page = PageInfo(id="test", name="Test", type="parent")
        config_manager.add_page(page)
        
        # Verify page exists
        assert config_manager.get_page("test") is not None
        
        # Remove page
        result = config_manager.remove_page("test")
        
        assert result is True
        assert config_manager.get_page("test") is None
    
    def test_remove_parent_removes_children(self, config_manager):
        """Test that removing a parent also removes its children."""
        parent = PageInfo(id="parent1", name="Parent1", type="parent")
        child1 = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        child2 = PageInfo(id="child2", name="Child2", type="child", parent_id="parent1")
        
        config_manager.add_page(parent)
        config_manager.add_page(child1)
        config_manager.add_page(child2)
        
        # Verify all pages exist
        assert len(config_manager.get_all_pages()) == 3
        
        # Remove parent
        result = config_manager.remove_page("parent1")
        
        assert result is True
        assert config_manager.get_page("parent1") is None
        assert config_manager.get_page("child1") is None
        assert config_manager.get_page("child2") is None
        assert len(config_manager.get_all_pages()) == 0
    
    def test_load_save_config_persistence(self, config_manager):
        """Test that configuration persists across load/save operations."""
        # Add some pages
        parent = PageInfo(id="parent1", name="Parent1", type="parent", icon="Star")
        child = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1", has_mobile=True)
        
        config_manager.add_page(parent)
        config_manager.add_page(child)
        
        # Create new manager instance with same path
        new_manager = PageConfigManager(config_manager.project_root)
        
        # Verify data was loaded
        assert len(new_manager.get_all_pages()) == 2
        
        retrieved_parent = new_manager.get_page("parent1")
        retrieved_child = new_manager.get_page("child1")
        
        assert retrieved_parent is not None
        assert retrieved_parent.icon == "Star"
        assert retrieved_child is not None
        assert retrieved_child.has_mobile is True
        assert retrieved_child.parent_id == "parent1"
    
    def test_get_pages_for_navigation(self, config_manager):
        """Test getting pages suitable for navigation."""
        # Add pages with different creation times
        parent1 = PageInfo(id="parent1", name="Parent1", type="parent", created_at="2024-01-01T00:00:00")
        parent2 = PageInfo(id="parent2", name="Parent2", type="parent", created_at="2024-01-02T00:00:00")
        child1 = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        
        config_manager.add_page(parent1)
        config_manager.add_page(parent2)
        config_manager.add_page(child1)
        
        nav_pages = config_manager.get_pages_for_navigation()
        
        # Should only return parent pages, sorted by creation time
        assert len(nav_pages) == 2
        assert all(page.type == "parent" for page in nav_pages)
        assert nav_pages[0].id == "parent1"  # Created first
        assert nav_pages[1].id == "parent2"  # Created second
    
    def test_validate_config(self, config_manager):
        """Test configuration validation."""
        # Add valid parent
        parent = PageInfo(id="parent1", name="Parent1", type="parent")
        config_manager.add_page(parent)
        
        # Add child with valid parent
        valid_child = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        config_manager.add_page(valid_child)
        
        # Add child with invalid parent
        invalid_child = PageInfo(id="child2", name="Child2", type="child", parent_id="nonexistent")
        config_manager.add_page(invalid_child)
        
        # Add page with missing name
        invalid_page = PageInfo(id="invalid", name="", type="parent")
        config_manager.add_page(invalid_page)
        
        issues = config_manager.validate_config()
        
        assert len(issues) == 2
        assert any("references non-existent parent" in issue for issue in issues)
        assert any("missing name" in issue for issue in issues)
    
    def test_get_config_summary(self, config_manager):
        """Test getting configuration summary."""
        # Add some pages
        parent = PageInfo(id="parent1", name="Parent1", type="parent")
        child = PageInfo(id="child1", name="Child1", type="child", parent_id="parent1")
        
        config_manager.add_page(parent)
        config_manager.add_page(child)
        
        summary = config_manager.get_config_summary()
        
        assert summary['version'] == "1.0.0"
        assert summary['total_pages'] == 2
        assert summary['parent_pages'] == 1
        assert summary['child_pages'] == 1
        assert summary['config_exists'] is True
        assert "pages.config.json" in summary['config_path']
    
    def test_has_parent(self, config_manager):
        """Test checking if parent exists."""
        parent = PageInfo(id="parent1", name="Parent1", type="parent")
        child = PageInfo(id="child1", name="Child1", type="child")
        
        config_manager.add_page(parent)
        config_manager.add_page(child)
        
        assert config_manager.has_parent("parent1") is True
        assert config_manager.has_parent("child1") is False
        assert config_manager.has_parent("nonexistent") is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])