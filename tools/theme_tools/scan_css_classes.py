#!/usr/bin/env python3
"""
Tool to scan CSS files and extract all class definitions
"""
import os
import re
import click
from pathlib import Path

def extract_css_classes(css_content):
    """Extract CSS class definitions from CSS content"""
    classes = set()
    
    # Remove comments
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Pattern for CSS class selectors
    # Matches .classname, .class-name, .class_name, etc.
    # Handles complex selectors like .class1.class2, .class:hover, etc.
    pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*(?:\[[^\]]+\])?(?::[a-zA-Z0-9_-]+(?:\([^)]*\))?)*)'
    
    matches = re.findall(pattern, css_content)
    for match in matches:
        # Clean up pseudo-classes and pseudo-elements
        clean_class = re.sub(r':.*$', '', match)
        clean_class = re.sub(r'\[.*?\]', '', clean_class)
        if clean_class:
            classes.add(clean_class)
    
    # Also look for @layer and other at-rules that might contain classes
    at_rule_pattern = r'@[a-z-]+[^{]*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
    at_rule_matches = re.findall(at_rule_pattern, css_content, re.DOTALL)
    for at_rule_content in at_rule_matches:
        at_rule_classes = extract_css_classes(at_rule_content)
        classes.update(at_rule_classes)
    
    return classes

@click.command()
@click.option('--file', '-f', help='CSS file to scan', required=True)
@click.option('--output', '-o', help='Output file to write results')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def main(file, output, verbose):
    """Scan CSS file for class definitions"""
    
    if not os.path.exists(file):
        click.echo(f"Error: File {file} not found")
        return
    
    try:
        with open(file, 'r', encoding='utf-8') as f:
            css_content = f.read()
            classes = extract_css_classes(css_content)
    except Exception as e:
        click.echo(f"Error reading {file}: {e}")
        return
    
    # Sort classes for consistent output
    sorted_classes = sorted(classes)
    
    if output:
        with open(output, 'w') as f:
            for cls in sorted_classes:
                f.write(f"{cls}\n")
        click.echo(f"Found {len(sorted_classes)} CSS classes")
        click.echo(f"Results written to {output}")
    else:
        click.echo(f"Found {len(sorted_classes)} CSS classes in {file}:")
        for cls in sorted_classes:
            click.echo(f"  .{cls}")

if __name__ == '__main__':
    main()