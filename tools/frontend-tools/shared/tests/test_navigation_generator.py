"""
Tests for Navigation Generator

Comprehensive test suite for the NavigationGenerator module.
Tests template loading, variable substitution, file generation, and validation.
"""

import pytest
import tempfile
import json
import os
from pathlib import Path
from unittest.mock import patch, mock_open

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from navigation_generator import (
    NavigationGenerator, 
    NavigationConfig, 
    NavigationValidator,
    NavigationValidationError
)
from page_config_manager import PageConfigManager, PageInfo


class TestNavigationGenerator:
    """Test suite for NavigationGenerator class."""
    
    @pytest.fixture
    def temp_project(self):
        """Create a temporary project directory with test data."""
        with tempfile.TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir)
            
            # Create test page config
            config_manager = PageConfigManager(project_root)
            
            # Add test pages
            test_pages = [
                PageInfo(
                    id="worker",
                    name="Worker",
                    type="parent",
                    icon="Settings",
                    description="Worker Testing",
                    component_name="WorkerPage"
                ),
                PageInfo(
                    id="uitests", 
                    name="UI Tests",
                    type="parent",
                    icon="Target",
                    description="UI Testing Hub",
                    component_name="UITestPage"
                ),
                PageInfo(
                    id="play",
                    name="Play",
                    type="parent", 
                    icon="Play",
                    description="Play Chess",
                    component_name="PlayPage"
                )
            ]
            
            for page in test_pages:
                config_manager.add_page(page)
            
            # Add a child page for uitests
            child_page = PageInfo(
                id="dragtest",
                name="Drag Test",
                type="child",
                parent_id="uitests",
                icon="Move",
                description="Drag Test Page",
                component_name="DragTestPage"
            )
            config_manager.add_page(child_page)
            
            yield project_root, config_manager
    
    @pytest.fixture
    def temp_templates(self):
        """Create temporary template files."""
        with tempfile.TemporaryDirectory() as temp_dir:
            templates_dir = Path(temp_dir)
            
            # Create test templates
            templates = {
                "types.ts.dynamic": "export type TabId = {{TAB_IDS}}",
                "TabBar.tsx.dynamic": """import { {{ICON_IMPORTS}} } from "lucide-react";

const tabs: Tab[] = [
{{TAB_CONFIGURATIONS}}
];

export default function TabBar() {
  return (
    <div className="grid grid-cols-{{GRID_COLUMNS}}">
      {/* Child clearing: {{CHILD_PAGE_CLEARING_CONDITION}} */}
    </div>
  );
}""",
                "App.tsx.dynamic": """{{PAGE_IMPORTS}}

function App() {
  return (
    <div>
{{PAGE_ROUTING}}
    </div>
  );
}"""
            }
            
            for filename, content in templates.items():
                template_path = templates_dir / filename
                with open(template_path, 'w') as f:
                    f.write(content)
            
            yield templates_dir
    
    def test_navigation_generator_init(self, temp_project, temp_templates):
        """Test NavigationGenerator initialization."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        
        assert generator.project_root == project_root
        assert generator.templates_path == temp_templates
        assert isinstance(generator.config_manager, PageConfigManager)
    
    def test_navigation_generator_missing_templates(self, temp_project):
        """Test NavigationGenerator with missing templates."""
        project_root, _ = temp_project
        
        with tempfile.TemporaryDirectory() as empty_dir:
            with pytest.raises(FileNotFoundError):
                NavigationGenerator(project_root, Path(empty_dir))
    
    def test_generate_navigation_config(self, temp_project, temp_templates):
        """Test navigation configuration generation."""
        project_root, config_manager = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        config = generator.generate_navigation_config()
        
        # Test basic structure
        assert isinstance(config, NavigationConfig)
        assert len(config.tab_ids) == 3  # worker, uitests, play
        assert "'worker'" in config.tab_ids
        assert "'uitests'" in config.tab_ids  
        assert "'play'" in config.tab_ids
        
        # Test grid columns (3 tabs + 1 menu = 4)
        assert config.grid_columns == 4
        
        # Test icon imports
        expected_icons = {'Settings', 'Target', 'Play'}
        assert set(config.icon_imports) == expected_icons
        
        # Test child page clearing (only uitests has children)
        assert "tab.id === 'uitests'" in config.child_page_clearing_condition
        assert "worker" not in config.child_page_clearing_condition
        
        # Test page imports and routing
        assert len(config.page_imports) == 3
        assert len(config.page_routing) == 3
        assert any("WorkerPage" in imp for imp in config.page_imports)
        assert any("selectedTab === \"worker\"" in route for route in config.page_routing)
    
    def test_generate_types_ts(self, temp_project, temp_templates):
        """Test types.ts generation."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        result = generator.generate_types_ts()
        
        expected = "export type TabId = 'worker' | 'uitests' | 'play'"
        assert result == expected
    
    def test_generate_tabbar_tsx(self, temp_project, temp_templates):
        """Test TabBar.tsx generation."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        result = generator.generate_tabbar_tsx()
        
        # Check imports
        assert "import { Settings, Target, Play } from \"lucide-react\";" in result
        
        # Check grid columns
        assert "grid grid-cols-4" in result
        
        # Check tab configurations
        assert 'id: "worker"' in result
        assert 'label: "Worker"' in result
        assert 'icon: Settings' in result
        
        # Check child page clearing
        assert "tab.id === 'uitests'" in result
    
    def test_generate_app_tsx(self, temp_project, temp_templates):
        """Test App.tsx generation."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        result = generator.generate_app_tsx()
        
        # Check page imports
        assert 'import { WorkerPage } from "./pages/worker/WorkerPage";' in result
        assert 'import { UITestPage } from "./pages/uitests/UITestPage";' in result
        assert 'import { PlayPage } from "./pages/play/PlayPage";' in result
        
        # Check routing
        assert '{selectedTab === "worker" && <WorkerPage />}' in result
        assert '{selectedTab === "uitests" && <UITestPage />}' in result
        assert '{selectedTab === "play" && <PlayPage />}' in result
    
    def test_generate_all_files(self, temp_project, temp_templates):
        """Test generating all files to output directory."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        
        with tempfile.TemporaryDirectory() as output_dir:
            result = generator.generate_all_files(Path(output_dir))
            
            # Check return value
            assert 'types' in result
            assert 'tabbar' in result
            assert 'app' in result
            
            # Check files were created
            assert result['types'].exists()
            assert result['tabbar'].exists()
            assert result['app'].exists()
            
            # Check file contents
            types_content = result['types'].read_text()
            assert "export type TabId = 'worker' | 'uitests' | 'play'" in types_content
            
            tabbar_content = result['tabbar'].read_text()
            assert "grid grid-cols-4" in tabbar_content
            
            app_content = result['app'].read_text()
            assert 'import { WorkerPage }' in app_content
    
    def test_preview_changes(self, temp_project, temp_templates):
        """Test preview functionality."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        preview = generator.preview_changes()
        
        assert 'types.ts' in preview
        assert 'TabBar.tsx' in preview
        assert 'App.tsx' in preview
        
        # Check content is generated but not written to files
        assert "'worker'" in preview['types.ts']
        assert "grid-cols-4" in preview['TabBar.tsx']
        assert "WorkerPage" in preview['App.tsx']
    
    def test_get_generation_summary(self, temp_project, temp_templates):
        """Test generation summary."""
        project_root, _ = temp_project
        
        generator = NavigationGenerator(project_root, temp_templates)
        summary = generator.get_generation_summary()
        
        assert summary['total_pages'] == 3
        assert summary['grid_columns'] == 4
        assert 'Settings' in summary['icons_used']
        assert 'uitests' in summary['pages_with_children']
        assert 'worker' not in summary['pages_with_children']
    
    def test_empty_configuration(self, temp_templates):
        """Test behavior with empty page configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir)
            
            generator = NavigationGenerator(project_root, temp_templates)
            
            with pytest.raises(ValueError, match="No pages found"):
                generator.generate_navigation_config()


class TestNavigationValidator:
    """Test suite for NavigationValidator class."""
    
    @pytest.fixture
    def temp_project_for_validation(self):
        """Create temporary project for validation tests."""
        with tempfile.TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir)
            config_manager = PageConfigManager(project_root)
            yield project_root, config_manager
    
    def test_validate_empty_config(self, temp_project_for_validation):
        """Test validation with empty configuration."""
        _, config_manager = temp_project_for_validation
        
        errors = NavigationValidator.validate_config(config_manager)
        assert "No pages configured for navigation" in errors
    
    def test_validate_valid_config(self, temp_project_for_validation):
        """Test validation with valid configuration."""
        _, config_manager = temp_project_for_validation
        
        # Add valid page
        page = PageInfo(
            id="worker",
            name="Worker",
            type="parent",
            icon="Settings",
            description="Worker Testing",
            component_name="WorkerPage"
        )
        config_manager.add_page(page)
        
        errors = NavigationValidator.validate_config(config_manager)
        assert len(errors) == 0
    
    def test_validate_invalid_icon(self, temp_project_for_validation):
        """Test validation with invalid icon."""
        _, config_manager = temp_project_for_validation
        
        # Add page with invalid icon
        page = PageInfo(
            id="worker",
            name="Worker", 
            type="parent",
            icon="InvalidIcon",
            description="Worker Testing",
            component_name="WorkerPage"
        )
        config_manager.add_page(page)
        
        errors = NavigationValidator.validate_config(config_manager)
        assert any("Invalid icon 'InvalidIcon'" in error for error in errors)
    
    def test_validate_invalid_page_id(self, temp_project_for_validation):
        """Test validation with invalid page ID."""
        _, config_manager = temp_project_for_validation
        
        # Add page with invalid ID
        page = PageInfo(
            id="Worker-Page", # Invalid: contains hyphen and capital
            name="Worker",
            type="parent", 
            icon="Settings",
            description="Worker Testing",
            component_name="WorkerPage"
        )
        config_manager.add_page(page)
        
        errors = NavigationValidator.validate_config(config_manager)
        assert any("must be lowercase alphanumeric" in error for error in errors)
    
    def test_validate_invalid_page_name(self, temp_project_for_validation):
        """Test validation with invalid page name."""
        _, config_manager = temp_project_for_validation
        
        # Add page with invalid name
        page = PageInfo(
            id="worker",
            name="worker", # Invalid: doesn't start with capital
            type="parent",
            icon="Settings", 
            description="Worker Testing",
            component_name="WorkerPage"
        )
        config_manager.add_page(page)
        
        errors = NavigationValidator.validate_config(config_manager)
        assert any("must start with capital letter" in error for error in errors)
    
    def test_validate_too_many_pages(self, temp_project_for_validation):
        """Test validation with too many pages."""
        _, config_manager = temp_project_for_validation
        
        # Add 9 pages (exceeds recommended limit of 8)
        for i in range(9):
            page = PageInfo(
                id=f"page{i}",
                name=f"Page {i}",
                type="parent",
                icon="Settings",
                description=f"Page {i} description",
                component_name=f"Page{i}Component"
            )
            config_manager.add_page(page)
        
        errors = NavigationValidator.validate_config(config_manager)
        assert any("Too many pages" in error for error in errors)


def run_integration_test():
    """Integration test that runs the full generation process."""
    print("Running integration test...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        project_root = Path(temp_dir)
        
        # Create config manager and add test pages
        config_manager = PageConfigManager(project_root)
        
        test_pages = [
            PageInfo(
                id="dashboard",
                name="Dashboard", 
                type="parent",
                icon="Settings",
                description="Main Dashboard",
                component_name="DashboardPage"
            ),
            PageInfo(
                id="analytics",
                name="Analytics",
                type="parent",
                icon="Target", 
                description="Analytics View",
                component_name="AnalyticsPage"
            )
        ]
        
        for page in test_pages:
            config_manager.add_page(page)
        
        # Create templates directory
        templates_dir = project_root / "templates"
        templates_dir.mkdir()
        
        # Create minimal templates
        templates = {
            "types.ts.dynamic": "export type TabId = {{TAB_IDS}}",
            "TabBar.tsx.dynamic": "// Grid: {{GRID_COLUMNS}}, Icons: {{ICON_IMPORTS}}",
            "App.tsx.dynamic": "// Routing: {{PAGE_ROUTING}}"
        }
        
        for filename, content in templates.items():
            (templates_dir / filename).write_text(content)
        
        # Test generation
        generator = NavigationGenerator(project_root, templates_dir)
        
        # Validate first
        errors = NavigationValidator.validate_config(config_manager)
        assert len(errors) == 0, f"Validation errors: {errors}"
        
        # Generate files
        output_dir = project_root / "output"
        generated = generator.generate_all_files(output_dir)
        
        # Verify generation
        assert len(generated) == 3
        for file_path in generated.values():
            assert file_path.exists()
            assert file_path.stat().st_size > 0
        
        # Check specific content
        types_content = generated['types'].read_text()
        assert "'dashboard'" in types_content
        assert "'analytics'" in types_content
        
        print("✅ Integration test passed!")


def test_with_real_config():
    """Test navigation generation using the real config from test_real_config_output."""
    print("\n🔗 Testing with Real Config...")
    
    # Look for the real config file in test artifacts
    artifacts_dir = os.environ.get('TEST_ARTIFACTS_DIR')
    if not artifacts_dir:
        print("⚠️  No artifacts directory found, skipping real config test")
        return
    
    # Check if real config exists
    real_config_artifacts = Path(__file__).parent / "test_real_config_output_artifacts"
    config_file = real_config_artifacts / "pages.config.json"
    
    if not config_file.exists():
        print("⚠️  Real config file not found, skipping real config test")
        return
    
    print(f"📄 Using real config: {config_file}")
    
    # Create artifacts directory for this test
    nav_artifacts_dir = Path(artifacts_dir)
    nav_artifacts_dir.mkdir(exist_ok=True)
    
    # Copy the real config to our project root
    import shutil
    project_config = nav_artifacts_dir / "pages.config.json"
    shutil.copy2(config_file, project_config)
    
    # Create page config manager from the real config
    from page_config_manager import PageConfigManager
    config_manager = PageConfigManager(nav_artifacts_dir)
    
    # Use the actual templates from mobile-pages-v2
    templates_dir = Path(__file__).parent.parent.parent / "mobile-pages-v2" / "templates" / "dynamic" / "nav"
    
    if not templates_dir.exists():
        print(f"❌ Templates directory not found: {templates_dir}")
        return
    
    print(f"📂 Using templates from: {templates_dir}")
    
    # Create generator and generate files
    generator = NavigationGenerator(nav_artifacts_dir, templates_dir)
    
    # Generate navigation files
    output_dir = nav_artifacts_dir / "generated"
    generated = generator.generate_all_files(output_dir)
    
    print(f"✅ Generated {len(generated)} files using real config:")
    for name, path in generated.items():
        print(f"   • {name}: {path}")
        # Show first few lines of each generated file
        content = path.read_text()
        preview = '\n'.join(content.split('\n')[:3])
        print(f"     Preview: {preview}")
    
    return generated


if __name__ == "__main__":
    # Run integration test if script is executed directly
    run_integration_test()
    test_with_real_config()