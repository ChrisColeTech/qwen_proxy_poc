"""
TypeScript Index Generator Package

A modular system for generating TypeScript barrel export files (index.ts).
Follows the Single Responsibility Principle with separate modules for each concern.

Modules:
- workflow_context: Shared state and data structures
- file_analyzer: File analysis and export detection
- export_generator: Index file content generation
- validator: Pre/post generation validation
- index_generator: Main orchestrator

Usage:
    python index_generator.py path/to/source/directory
"""

__version__ = "2.0.0"
__author__ = "Claude Code Assistant"

from .workflow_context import WorkflowContext, ExportInfo, FileContext, DirectoryContext
from .file_analyzer import FileAnalyzer
from .export_generator import ExportGenerator
from .validator import Validator
from .index_generator import IndexGenerator

__all__ = [
    'WorkflowContext',
    'ExportInfo', 
    'FileContext',
    'DirectoryContext',
    'FileAnalyzer',
    'ExportGenerator', 
    'Validator',
    'IndexGenerator'
]