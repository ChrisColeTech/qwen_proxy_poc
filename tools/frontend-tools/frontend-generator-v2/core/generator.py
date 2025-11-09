"""
Frontend Generator V2 - Main Generator Class
Domain-first approach following V4's proven patterns
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

from .config_loader import ConfigLoader
from .domain_mapper import DomainMapper
from generators.base_generator import BaseGenerator


class FrontendGeneratorV2:
    """Main generator class that orchestrates the generation process"""
    
    def __init__(self, output_path: Path, config_path: Path, verbose: bool = False):
        self.output_path = output_path
        self.config_path = config_path
        self.verbose = verbose
        
        # Setup logging
        self._setup_logging()
        
        # Initialize components
        self.config_loader = ConfigLoader()
        self.domain_mapper = DomainMapper()
        self.backend_config = None
        
        self.logger = logging.getLogger(__name__)
        
    def _setup_logging(self):
        """Setup logging configuration"""
        level = logging.DEBUG if self.verbose else logging.INFO
        logging.basicConfig(
            level=level,
            format='%(levelname)s - %(name)s - %(message)s'
        )
    
    def generate_all(self, dry_run: bool = False):
        """Generate complete frontend application"""
        self.logger.info("🚀 Starting Frontend Generation V2")
        
        # Load backend configuration
        self._load_backend_config()
        
        # Get domain mappings
        domains = self.domain_mapper.get_domain_mappings(self.backend_config)
        
        self.logger.info(f"📊 Found {len(domains)} domains to generate")
        
        if dry_run:
            self._show_generation_plan(domains)
            return
        
        # Generate each domain
        for domain_name, endpoints in domains.items():
            self.generate_domain(domain_name, endpoints, dry_run=False)
        
        self.logger.info("✅ All domains generated successfully")
    
    def generate_domain(self, domain_name: str, endpoints: List[str] = None, dry_run: bool = False):
        """Generate specific domain"""
        if endpoints is None:
            # Load backend config if not already loaded
            if not self.backend_config:
                self._load_backend_config()
            
            # Get endpoints for this domain
            domains = self.domain_mapper.get_domain_mappings(self.backend_config)
            endpoints = domains.get(domain_name, [])
        
        self.logger.info(f"🔧 Generating {domain_name} domain with {len(endpoints)} endpoints")
        
        if dry_run:
            self._show_domain_plan(domain_name, endpoints)
            return
        
        # TODO: Implement actual generation using generators
        # This will be filled in phase 2
        pass
    
    def _load_backend_config(self):
        """Load backend configuration file"""
        self.logger.info(f"📖 Loading backend config from {self.config_path}")
        
  
        with open(self.config_path, 'r') as f:
            self.backend_config = json.load(f)
        
        endpoints = self.backend_config.get('endpoints', {})
        self.logger.info(f"📖 Loaded {len(endpoints)} endpoints")
    
    def _show_generation_plan(self, domains: Dict[str, List[str]]):
        """Show what would be generated (dry run)"""
        print("🔍 Generation Plan:")
        for domain_name, endpoints in domains.items():
            print(f"  📁 {domain_name}:")
            for endpoint in endpoints:
                print(f"    - {endpoint}")
    
    def _show_domain_plan(self, domain_name: str, endpoints: List[str]):
        """Show what would be generated for a domain (dry run)"""
        print(f"🔍 Domain Plan for {domain_name}:")
        for endpoint in endpoints:
            print(f"  - {endpoint}")