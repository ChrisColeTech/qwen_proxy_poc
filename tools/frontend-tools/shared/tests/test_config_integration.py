"""
Tests for Config Integration Module

Verifies the integration between PageConfigManager and mobile-pages-v2 generator.
"""

import pytest
import tempfile
import sys
from pathlib import Path
from unittest.mock import Mock

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from config_integration import ConfigIntegration
from page_config_manager import PageInfo


class MockPageConfig:
    """Mock of mobile-pages-v2 PageConfig for testing."""
    
    def __init__(self, name: str, page_type: str = "parent", parent: str = None, mobile: bool = False):
        self.name = name
        self.base_name = name
        self.page_name = f"{name}Page"
        self.page_id = name.lower()
        self.parent = parent
        self.parent_id = parent.lower() if parent else None
        self.mobile = mobile
        self.icon = "Navigation"
        self.description = f"Test {name} page"


class TestConfigIntegration:
    """Test ConfigIntegration functionality."""
    
    @pytest.fixture
    def temp_project_root(self):
        """Create a temporary project root directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield Path(temp_dir)
    
    @pytest.fixture
    def integration(self, temp_project_root):
        """Create a ConfigIntegration instance."""
        return ConfigIntegration(temp_project_root)
    
    def test_integration_initialization(self, integration, temp_project_root):
        """Test integration initialization."""
        assert integration.project_root == temp_project_root
        assert integration.config_manager is not None
        assert integration.config_manager.config_path.parent.exists()
    
    def test_register_parent_page(self, integration):
        """Test registering a parent page."""
        mock_config = MockPageConfig("TestSection", "parent")
        
        result = integration.register_parent_page(mock_config)
        
        assert result is True
        
        # Verify page was registered
        page_info = integration.config_manager.get_page("testsection")
        assert page_info is not None
        assert page_info.name == "TestSection"
        assert page_info.type == "parent"
        assert page_info.icon == "Navigation"
        assert page_info.component_name == "TestSectionPage"
    
    def test_register_child_page(self, integration):
        """Test registering a child page."""
        # First register parent
        parent_config = MockPageConfig("TestSection", "parent")
        integration.register_parent_page(parent_config)
        
        # Then register child
        child_config = MockPageConfig("LayoutTest", "child", "TestSection", mobile=True)
        
        result = integration.register_child_page(child_config)
        
        assert result is True
        
        # Verify child was registered
        page_info = integration.config_manager.get_page("layouttest")
        assert page_info is not None
        assert page_info.name == "LayoutTest"
        assert page_info.type == "child"
        assert page_info.parent_id == "testsection"
        assert page_info.has_mobile is True
    
    def test_register_child_without_parent_warning(self, integration, capsys):
        """Test warning when registering child without existing parent."""
        child_config = MockPageConfig("OrphanChild", "child", "NonExistentParent")
        
        result = integration.register_child_page(child_config)
        
        assert result is True  # Still succeeds but warns
        
        captured = capsys.readouterr()
        assert "Warning: Parent 'nonexistentparent' not found" in captured.out
    
    def test_remove_page(self, integration):
        """Test removing a page."""
        # Add a page first
        mock_config = MockPageConfig("TestPage", "parent")
        integration.register_parent_page(mock_config)
        
        # Verify it exists
        assert integration.config_manager.get_page("testpage") is not None
        
        # Remove it
        result = integration.remove_page("testpage")
        
        assert result is True
        assert integration.config_manager.get_page("testpage") is None
    
    def test_get_parent_children(self, integration):
        """Test getting children for a parent."""
        # Register parent and children
        parent_config = MockPageConfig("TestSection", "parent")
        integration.register_parent_page(parent_config)
        
        child1_config = MockPageConfig("Child1", "child", "TestSection")
        child2_config = MockPageConfig("Child2", "child", "TestSection", mobile=True)
        integration.register_child_page(child1_config)
        integration.register_child_page(child2_config)
        
        children = integration.get_parent_children("testsection")
        
        assert len(children) == 2
        assert {child.name for child in children} == {"Child1", "Child2"}
        assert any(child.has_mobile for child in children)  # Child2 has mobile
    
    def test_get_navigation_pages(self, integration):
        """Test getting pages for navigation."""
        # Register multiple parents and children
        parent1_config = MockPageConfig("Section1", "parent")
        parent2_config = MockPageConfig("Section2", "parent")
        integration.register_parent_page(parent1_config)
        integration.register_parent_page(parent2_config)
        
        child_config = MockPageConfig("Child1", "child", "Section1")
        integration.register_child_page(child_config)
        
        nav_pages = integration.get_navigation_pages()
        
        assert len(nav_pages) == 2
        assert all(page.type == "parent" for page in nav_pages)
        assert {page.name for page in nav_pages} == {"Section1", "Section2"}
    
    def test_has_children(self, integration):
        """Test checking if parent has children."""
        # Register parent
        parent_config = MockPageConfig("TestSection", "parent")
        integration.register_parent_page(parent_config)
        
        # Initially no children
        assert integration.has_children("testsection") is False
        
        # Add child
        child_config = MockPageConfig("TestChild", "child", "TestSection")
        integration.register_child_page(child_config)
        
        # Now has children
        assert integration.has_children("testsection") is True
    
    def test_export_config_for_navigation(self, integration):
        """Test exporting configuration for navigation generation."""
        # Set up test data
        parent_config = MockPageConfig("TestSection", "parent")
        integration.register_parent_page(parent_config)
        
        child1_config = MockPageConfig("Child1", "child", "TestSection")
        child2_config = MockPageConfig("Child2", "child", "TestSection", mobile=True)
        integration.register_child_page(child1_config)
        integration.register_child_page(child2_config)
        
        config_data = integration.export_config_for_navigation()
        
        # Verify structure
        assert "parent_pages" in config_data
        assert "tab_data" in config_data
        assert "routing_data" in config_data
        
        # Verify parent page data
        parent_data = config_data["parent_pages"][0]
        assert parent_data["id"] == "testsection"
        assert parent_data["name"] == "TestSection"
        assert parent_data["icon"] == "Navigation"
        assert len(parent_data["children"]) == 2
        assert "child1" in parent_data["children"]
        assert "child2" in parent_data["children"]
        
        # Verify tab data
        tab_data = config_data["tab_data"][0]
        assert tab_data["id"] == "testsection"
        assert tab_data["label"] == "TestSection"
        assert tab_data["icon"] == "Navigation"
        
        # Verify routing data
        routing_data = config_data["routing_data"][0]
        assert routing_data["tab_id"] == "testsection"
        assert routing_data["component_name"] == "TestSectionPage"
        assert routing_data["import_path"] == "./pages/testsection/TestSectionPage"
    
    def test_create_config_if_missing(self, integration):
        """Test creating config file if missing."""
        # Remove config file if it exists
        if integration.config_manager.config_path.exists():
            integration.config_manager.config_path.unlink()
        
        assert not integration.config_manager.config_path.exists()
        
        result = integration.create_config_if_missing()
        
        assert result is True
        assert integration.config_manager.config_path.exists()
    
    def test_validate_config(self, integration):
        """Test configuration validation."""
        # Add valid parent and child
        parent_config = MockPageConfig("ValidParent", "parent")
        integration.register_parent_page(parent_config)
        
        child_config = MockPageConfig("ValidChild", "child", "ValidParent")
        integration.register_child_page(child_config)
        
        # Should have no issues
        issues = integration.validate_config()
        assert len(issues) == 0
        
        # Add invalid child (orphaned)
        orphan_info = PageInfo(
            id="orphan",
            name="OrphanChild",
            type="child",
            parent_id="nonexistent"
        )
        integration.config_manager.add_page(orphan_info)
        
        issues = integration.validate_config()
        assert len(issues) > 0
        assert any("references non-existent parent" in issue for issue in issues)
    
    def test_get_config_summary(self, integration):
        """Test getting configuration summary."""
        # Add test data
        parent_config = MockPageConfig("TestSection", "parent")
        integration.register_parent_page(parent_config)
        
        child_config = MockPageConfig("TestChild", "child", "TestSection")
        integration.register_child_page(child_config)
        
        summary = integration.get_config_summary()
        
        assert summary["total_pages"] == 2
        assert summary["parent_pages"] == 1
        assert summary["child_pages"] == 1
        assert summary["config_exists"] is True
        assert "pages.config.json" in summary["config_path"]


class TestUtilityFunctions:
    """Test utility functions."""
    
    @pytest.fixture
    def temp_project_root(self):
        """Create a temporary project root directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield Path(temp_dir)
    
    def test_register_parent_page_creation(self, temp_project_root):
        """Test utility function for registering parent page."""
        from config_integration import register_parent_page_creation
        
        mock_config = MockPageConfig("TestParent", "parent")
        
        result = register_parent_page_creation(temp_project_root, mock_config)
        
        assert result is True
        
        # Verify config file was created
        config_path = temp_project_root / "pages.config.json"
        assert config_path.exists()
    
    def test_register_child_page_creation(self, temp_project_root):
        """Test utility function for registering child page."""
        from config_integration import register_child_page_creation, register_parent_page_creation
        
        # First register parent
        parent_config = MockPageConfig("TestParent", "parent")
        register_parent_page_creation(temp_project_root, parent_config)
        
        # Then register child
        child_config = MockPageConfig("TestChild", "child", "TestParent")
        
        result = register_child_page_creation(temp_project_root, child_config)
        
        assert result is True
    
    def test_get_navigation_config(self, temp_project_root):
        """Test utility function for getting navigation config."""
        from config_integration import get_navigation_config, register_parent_page_creation
        
        # Add test data
        parent_config = MockPageConfig("TestSection", "parent")
        register_parent_page_creation(temp_project_root, parent_config)
        
        nav_config = get_navigation_config(temp_project_root)
        
        assert "parent_pages" in nav_config
        assert "tab_data" in nav_config
        assert "routing_data" in nav_config
        assert len(nav_config["parent_pages"]) == 1
    
    def test_validate_project_config(self, temp_project_root):
        """Test utility function for validating project config."""
        from config_integration import validate_project_config, register_parent_page_creation
        
        # Add valid data
        parent_config = MockPageConfig("TestParent", "parent")
        register_parent_page_creation(temp_project_root, parent_config)
        
        issues = validate_project_config(temp_project_root)
        
        assert len(issues) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])