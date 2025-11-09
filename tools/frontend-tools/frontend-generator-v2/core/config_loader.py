"""
Configuration Loader
Handles loading and validation of configuration files
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any


class ConfigLoader:
    """Loads and validates configuration files"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def load_backend_config(self, config_path: Path) -> Dict[str, Any]:
        """Load backend configuration"""
        self.logger.info(f"📖 Loading backend config: {config_path}")
        
        if not config_path.exists():
            raise FileNotFoundError(f"Backend config not found: {config_path}")
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Validate required fields
            if 'endpoints' not in config:
                raise ValueError("Backend config missing 'endpoints' field")
            
            self.logger.info(f"✅ Loaded {len(config['endpoints'])} endpoints")
            return config
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in backend config: {e}")
    
    def load_template_config(self, config_path: Path) -> Dict[str, Any]:
        """Load template configuration"""
        self.logger.info(f"📖 Loading template config: {config_path}")
        
        if not config_path.exists():
            # Return default config if no custom config found
            return self._get_default_template_config()
        
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            self.logger.warning(f"Invalid template config, using defaults: {e}")
            return self._get_default_template_config()
    
    def _get_default_template_config(self) -> Dict[str, Any]:
        """Get default template configuration"""
        return {
            "page_template": "standard_page",
            "component_template": "standard_component",
            "mobile_enabled": True,
            "instructions_enabled": True
        }