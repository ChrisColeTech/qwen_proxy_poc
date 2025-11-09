"""
End-to-End Integration Test

Verifies that the config system is actually updated when pages are created
through the mobile-pages-v2 generator workflow.
"""

import pytest
import tempfile
import json
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "mobile-pages-v2" / "modules"))

from page_config_manager import PageConfigManager
from config_integration import ConfigIntegration

# Mock the mobile-pages-v2 modules for testing
class MockPageConfig:
    """Mock of mobile-pages-v2 PageConfig."""
    
    def __init__(self, name: str, parent: str = None, mobile: bool = False, icon: str = "Navigation", description: str = ""):
        self.name = name
        self.base_name = name
        self.page_name = f"{name}Page"
        self.page_id = name.lower()
        self.parent = parent
        self.parent_id = parent.lower() if parent else None
        self.mobile = mobile
        self.icon = icon
        self.description = description or f"Test {name} page"

class MockGenerationContext:
    """Mock of mobile-pages-v2 GenerationContext."""
    
    def __init__(self, frontend_root: Path, config: MockPageConfig):
        self.frontend_root = frontend_root
        self.config = config

class MockParentGenerator:
    """Mock parent generator that uses config integration."""
    
    def __init__(self):
        self.config_integration = None
    
    def create_parent_page(self, context: MockGenerationContext):
        """Simulate parent page creation with config integration."""
        print(f"📝 Creating parent page: {context.config.page_name}")
        
        # Initialize config integration (simulating real workflow)
        try:
            self.config_integration = ConfigIntegration(context.frontend_root)
            self.config_integration.create_config_if_missing()
        except Exception as e:
            print(f"Warning: Could not initialize config integration: {e}")
            return False
        
        # Simulate file creation (we'll skip actual file creation for test)
        # In real generator, this would create the actual page files
        
        # Register parent page in central config (this is what we're testing)
        try:
            result = self.config_integration.register_parent_page(context.config)
            if result:
                print(f"✅ Parent page '{context.config.page_name}' created and registered in config!")
            return result
        except Exception as e:
            print(f"❌ Failed to register parent page in config: {e}")
            return False

class MockChildGenerator:
    """Mock child generator that uses config integration."""
    
    def __init__(self):
        self.config_integration = None
    
    def create_child_page(self, context: MockGenerationContext):
        """Simulate child page creation with config integration."""
        if not context.config.parent:
            raise ValueError("Child pages must specify a parent")
        
        print(f"📝 Creating child page: {context.config.page_name} (parent: {context.config.parent})")
        
        # Initialize config integration (simulating real workflow)
        try:
            self.config_integration = ConfigIntegration(context.frontend_root)
            self.config_integration.create_config_if_missing()
        except Exception as e:
            print(f"Warning: Could not initialize config integration: {e}")
            return False
        
        # Simulate file creation (we'll skip actual file creation for test)
        # In real generator, this would create the actual page files
        
        # Register child page in central config (this is what we're testing)
        try:
            result = self.config_integration.register_child_page(context.config)
            if result:
                mobile_text = " with mobile variant" if context.config.mobile else ""
                print(f"✅ Child page '{context.config.page_name}' created and registered in config{mobile_text}!")
            return result
        except Exception as e:
            print(f"❌ Failed to register child page in config: {e}")
            return False


class TestEndToEndIntegration:
    """Test end-to-end integration with config updates."""
    
    @pytest.fixture
    def temp_project_root(self):
        """Create a temporary project root directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir)
            # Create src directory structure like a real project
            (project_root / "src" / "pages").mkdir(parents=True, exist_ok=True)
            (project_root / "src" / "components").mkdir(parents=True, exist_ok=True)
            (project_root / "src" / "hooks").mkdir(parents=True, exist_ok=True)
            yield project_root
    
    def test_parent_page_creation_updates_config(self, temp_project_root):
        """Test that creating a parent page updates the config."""
        # Setup
        config_path = temp_project_root / "pages.config.json"
        assert not config_path.exists()  # Config doesn't exist initially
        
        # Create parent page using mock generator
        parent_config = MockPageConfig(
            name="TestSection",
            icon="Settings", 
            description="UI Testing Section"
        )
        context = MockGenerationContext(temp_project_root, parent_config)
        
        generator = MockParentGenerator()
        result = generator.create_parent_page(context)
        
        # Verify creation succeeded
        assert result is True
        
        # Verify config file was created
        assert config_path.exists()
        
        # Verify config contains the parent page
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        assert "pages" in config_data
        assert "testsection" in config_data["pages"]
        
        page_data = config_data["pages"]["testsection"]
        assert page_data["id"] == "testsection"
        assert page_data["name"] == "TestSection"
        assert page_data["type"] == "parent"
        assert page_data["icon"] == "Settings"
        assert page_data["component_name"] == "TestSectionPage"
        
        # Verify metadata
        assert config_data["metadata"]["total_pages"] == 1
        assert config_data["metadata"]["parent_pages"] == 1
        assert config_data["metadata"]["child_pages"] == 0
    
    def test_child_page_creation_updates_config(self, temp_project_root):
        """Test that creating a child page updates the config."""
        # First create parent
        parent_config = MockPageConfig(
            name="TestSection",
            icon="Settings"
        )
        parent_context = MockGenerationContext(temp_project_root, parent_config)
        
        parent_generator = MockParentGenerator()
        parent_result = parent_generator.create_parent_page(parent_context)
        assert parent_result is True
        
        # Then create child
        child_config = MockPageConfig(
            name="LayoutTest", 
            parent="TestSection",
            mobile=True,
            description="Layout testing component"
        )
        child_context = MockGenerationContext(temp_project_root, child_config)
        
        child_generator = MockChildGenerator()
        child_result = child_generator.create_child_page(child_context)
        
        # Verify child creation succeeded
        assert child_result is True
        
        # Verify config was updated
        config_path = temp_project_root / "pages.config.json"
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        # Verify parent still exists
        assert "testsection" in config_data["pages"]
        parent_data = config_data["pages"]["testsection"]
        assert parent_data["type"] == "parent"
        
        # Verify child was added
        assert "layouttest" in config_data["pages"]
        child_data = config_data["pages"]["layouttest"]
        assert child_data["id"] == "layouttest"
        assert child_data["name"] == "LayoutTest"
        assert child_data["type"] == "child"
        assert child_data["parent_id"] == "testsection"
        assert child_data["has_mobile"] is True
        assert child_data["component_name"] == "LayoutTestPage"
        
        # Verify metadata was updated
        assert config_data["metadata"]["total_pages"] == 2
        assert config_data["metadata"]["parent_pages"] == 1
        assert config_data["metadata"]["child_pages"] == 1
    
    def test_multiple_page_creation_workflow(self, temp_project_root):
        """Test creating multiple pages and verifying config stays consistent."""
        parent_generator = MockParentGenerator()
        child_generator = MockChildGenerator()
        
        # Step 1: Create first parent
        parent1_config = MockPageConfig(
            name="TestSection",
            icon="Settings",
            description="UI Testing Section"
        )
        parent1_context = MockGenerationContext(temp_project_root, parent1_config)
        result1 = parent_generator.create_parent_page(parent1_context)
        assert result1 is True
        
        # Step 2: Create second parent
        parent2_config = MockPageConfig(
            name="Gaming", 
            icon="Gamepad",
            description="Gaming Components"
        )
        parent2_context = MockGenerationContext(temp_project_root, parent2_config)
        result2 = parent_generator.create_parent_page(parent2_context)
        assert result2 is True
        
        # Step 3: Create children for first parent
        child1_config = MockPageConfig(
            name="LayoutTest",
            parent="TestSection", 
            mobile=True,
            description="Layout testing"
        )
        child1_context = MockGenerationContext(temp_project_root, child1_config)
        result3 = child_generator.create_child_page(child1_context)
        assert result3 is True
        
        child2_config = MockPageConfig(
            name="DragTest",
            parent="TestSection",
            mobile=False,
            description="Drag and drop testing"
        )
        child2_context = MockGenerationContext(temp_project_root, child2_config)
        result4 = child_generator.create_child_page(child2_context)
        assert result4 is True
        
        # Step 4: Create child for second parent
        child3_config = MockPageConfig(
            name="BlackjackGame",
            parent="Gaming",
            mobile=True,
            description="Blackjack card game"
        )
        child3_context = MockGenerationContext(temp_project_root, child3_config)
        result5 = child_generator.create_child_page(child3_context)
        assert result5 is True
        
        # Verify final config state
        config_path = temp_project_root / "pages.config.json"
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        # Verify all pages exist
        expected_pages = ["testsection", "gaming", "layouttest", "dragtest", "blackjackgame"]
        for page_id in expected_pages:
            assert page_id in config_data["pages"], f"Page {page_id} not found in config"
        
        # Verify parent-child relationships
        testsection_children = [
            page for page in config_data["pages"].values() 
            if page.get("parent_id") == "testsection"
        ]
        gaming_children = [
            page for page in config_data["pages"].values()
            if page.get("parent_id") == "gaming"
        ]
        
        assert len(testsection_children) == 2
        assert len(gaming_children) == 1
        
        # Verify mobile flags
        layout_test = config_data["pages"]["layouttest"]
        drag_test = config_data["pages"]["dragtest"]
        blackjack = config_data["pages"]["blackjackgame"]
        
        assert layout_test["has_mobile"] is True
        assert drag_test["has_mobile"] is False
        assert blackjack["has_mobile"] is True
        
        # Verify metadata
        assert config_data["metadata"]["total_pages"] == 5
        assert config_data["metadata"]["parent_pages"] == 2
        assert config_data["metadata"]["child_pages"] == 3
        
        # Verify navigation export works
        integration = ConfigIntegration(temp_project_root)
        nav_config = integration.export_config_for_navigation()
        
        assert len(nav_config["parent_pages"]) == 2
        assert len(nav_config["tab_data"]) == 2
        assert len(nav_config["routing_data"]) == 2
        
        # Verify parent-child relationships in export
        testsection_parent = next(p for p in nav_config["parent_pages"] if p["id"] == "testsection")
        gaming_parent = next(p for p in nav_config["parent_pages"] if p["id"] == "gaming")
        
        assert len(testsection_parent["children"]) == 2
        assert len(gaming_parent["children"]) == 1
        assert "layouttest" in testsection_parent["children"]
        assert "dragtest" in testsection_parent["children"]
        assert "blackjackgame" in gaming_parent["children"]
    
    def test_config_persistence_across_generator_runs(self, temp_project_root):
        """Test that config persists and accumulates across multiple generator runs."""
        # First run: Create parent
        parent_config = MockPageConfig(name="TestSection", icon="Settings")
        parent_context = MockGenerationContext(temp_project_root, parent_config)
        
        generator1 = MockParentGenerator()
        generator1.create_parent_page(parent_context)
        
        # Simulate new generator instance (like separate CLI invocation)
        child_config = MockPageConfig(name="LayoutTest", parent="TestSection", mobile=True)
        child_context = MockGenerationContext(temp_project_root, child_config)
        
        generator2 = MockChildGenerator()
        generator2.create_child_page(child_context)
        
        # Verify both pages exist in config
        config_path = temp_project_root / "pages.config.json"
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        
        assert len(config_data["pages"]) == 2
        assert "testsection" in config_data["pages"]
        assert "layouttest" in config_data["pages"]
        assert config_data["pages"]["layouttest"]["parent_id"] == "testsection"
        
        # Verify metadata
        assert config_data["metadata"]["total_pages"] == 2
        assert config_data["metadata"]["parent_pages"] == 1
        assert config_data["metadata"]["child_pages"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])