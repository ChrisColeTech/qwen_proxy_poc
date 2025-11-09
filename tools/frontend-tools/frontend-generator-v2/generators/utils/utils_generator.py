"""
Utils Generator
"""

from pathlib import Path
from generators.base_generator import BaseGenerator

class UtilsGenerator(BaseGenerator):
    """Generates utility functions"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent / "templates" / "utils"
        self.config_dir = Path(__file__).parent.parent / "config" / "utils"
    
    def generate(self, name: str):
        """Generate utility functions"""
        # TODO: Implement utils generation logic
        print(f"🔧 Generating utils: {name}")
        pass