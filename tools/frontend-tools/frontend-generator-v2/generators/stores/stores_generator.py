"""
Stores Generator
"""

from pathlib import Path
from generators.base_generator import BaseGenerator

class StoresGenerator(BaseGenerator):
    """Generates state stores"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent / "templates" / "stores"
        self.config_dir = Path(__file__).parent.parent / "config" / "stores"
    
    def generate(self, name: str):
        """Generate state store"""
        # TODO: Implement stores generation logic
        print(f"🏪 Generating store: {name}")
        pass