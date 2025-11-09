"""
Base generator class
"""

from pathlib import Path
from core.base import BaseScaffolder

class BaseGenerator(BaseScaffolder):
    """Base generator for all file generation"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
    
    def generate(self):
        """Override in subclasses"""
        raise NotImplementedError("Subclasses must implement generate()")