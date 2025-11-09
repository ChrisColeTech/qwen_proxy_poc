#!/usr/bin/env python3
"""
Layer-Aware CSS Analysis Tool - Respects @layer semantics for proper categorization
"""
import os
import json
import click
import re
from pathlib import Path
from scan_tsx_classes import extract_classes_from_tsx
from extract_used_css import extract_custom_classes_from_tsx

def parse_layer_aware_css(css_content):
    """Parse CSS respecting @layer semantics"""
    foundational_content = []  # @layer base + @tailwind + @keyframes
    component_rules = []       # @layer components content  
    utility_rules = []         # @layer utilities content
    standalone_rules = []      # Rules outside of layers
    
    # Remove comments but preserve structure
    processed_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Extract @tailwind directives (always foundational)
    tailwind_matches = re.findall(r'(@tailwind[^;]*;)', processed_content)
    foundational_content.extend(tailwind_matches)
    
    # Extract @keyframes (always foundational)
    keyframe_pattern = r'(@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\})'
    keyframe_matches = re.findall(keyframe_pattern, processed_content, re.DOTALL)
    foundational_content.extend(keyframe_matches)
    
    # Parse @layer blocks with semantic awareness
    layer_start_pattern = r'@layer\s+([^{]*)\{'
    pos = 0
    
    while True:
        match = re.search(layer_start_pattern, processed_content[pos:])
        if not match:
            break
        
        layer_name = match.group(1).strip()  # base, components, utilities
        start = pos + match.start()
        brace_start = pos + match.end() - 1
        
        # Count braces to find matching closing brace
        brace_count = 1
        i = brace_start + 1
        while i < len(processed_content) and brace_count > 0:
            if processed_content[i] == '{':
                brace_count += 1
            elif processed_content[i] == '}':
                brace_count -= 1
            i += 1
        
        if brace_count == 0:
            # Extract the complete @layer block
            layer_block = processed_content[start:i]
            layer_content = processed_content[brace_start + 1:i - 1]
            
            # Categorize based on layer semantic meaning
            if layer_name == 'base':
                # @layer base = foundational infrastructure
                foundational_content.append(layer_block)
            elif layer_name == 'components':
                # @layer components = component classes (analyze for usage)
                component_rules.append({
                    'full_block': layer_block,
                    'content': layer_content,
                    'rules': extract_rules_from_content(layer_content)
                })
            elif layer_name == 'utilities':
                # @layer utilities = utility classes (analyze for usage)  
                utility_rules.append({
                    'full_block': layer_block,
                    'content': layer_content,
                    'rules': extract_rules_from_content(layer_content)
                })
            else:
                # Unknown layer - treat as components for safety
                component_rules.append({
                    'full_block': layer_block,
                    'content': layer_content,
                    'rules': extract_rules_from_content(layer_content)
                })
            
            pos = i
        else:
            pos = brace_start + 1
    
    # Handle standalone rules (outside of layers)
    standalone_content = processed_content
    
    # Remove everything we've processed
    for item in foundational_content:
        standalone_content = standalone_content.replace(item, '')
    
    for layer_data in component_rules + utility_rules:
        standalone_content = standalone_content.replace(layer_data['full_block'], '')
    
    # Extract remaining standalone rules
    standalone_rule_list = extract_rules_from_content(standalone_content)
    if standalone_rule_list:
        standalone_rules.append({
            'rules': standalone_rule_list,
            'content': standalone_content
        })
    
    return {
        'foundational': foundational_content,
        'components': component_rules,
        'utilities': utility_rules, 
        'standalone': standalone_rules
    }

def extract_rules_from_content(content):
    """Extract individual CSS rules from content"""
    rules = []
    rule_pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    matches = re.finditer(rule_pattern, content, re.DOTALL)
    
    for match in matches:
        selector = match.group(1).strip()
        rule_body = match.group(2).strip()
        
        if selector and rule_body:
            rules.append({
                'selector': selector,
                'body': rule_body,
                'full_rule': f"{selector} {{\n{rule_body}\n}}",
                'classes': extract_classes_from_selector(selector)
            })
    
    return rules

def extract_classes_from_selector(selector):
    """Extract class names from a CSS selector"""
    class_matches = re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', selector)
    classes = set()
    for match in class_matches:
        # Clean up pseudo-classes
        clean_class = re.sub(r':.*$', '', match)
        if clean_class:
            classes.add(clean_class)
    return classes

@click.command()
@click.option('--tsx-path', '-t', default='../src', help='Path to TSX files')
@click.option('--css-file', '-c', default='../src/index.css', help='CSS file to analyze')
@click.option('--output-dir', '-o', default='.', help='Output directory for analysis files')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def analyze(tsx_path, css_file, output_dir, verbose):
    """Run layer-aware CSS analysis that respects @layer semantics"""
    
    if not os.path.exists(tsx_path):
        click.echo(f"Error: TSX path {tsx_path} not found")
        return
    
    if not os.path.exists(css_file):
        click.echo(f"Error: CSS file {css_file} not found")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    click.echo("🔍 Running layer-aware CSS analysis...")
    
    # Step 1: Parse CSS with layer awareness
    if verbose:
        click.echo("🏗️  Parsing CSS layers semantically...")
    
    try:
        with open(css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()
    except Exception as e:
        click.echo(f"Error reading CSS file: {e}")
        return
    
    parsed_css = parse_layer_aware_css(css_content)
    
    # Step 2: Analyze TSX files for custom classes
    if verbose:
        click.echo("📁 Scanning TSX files for custom classes...")
    
    used_custom_classes = set()
    all_classes_used = set()
    tsx_files = list(Path(tsx_path).rglob('*.tsx'))
    
    file_analysis = {}
    for tsx_file in tsx_files:
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
                custom_classes = extract_custom_classes_from_tsx(content)
                all_classes = extract_classes_from_tsx(content, include_tailwind=True)
                
                used_custom_classes.update(custom_classes)
                all_classes_used.update(all_classes)
                
                file_analysis[str(tsx_file.relative_to(Path(tsx_path).parent))] = {
                    'custom_classes': sorted(list(custom_classes)),
                    'total_classes': len(all_classes),
                    'custom_count': len(custom_classes)
                }
        except Exception as e:
            if verbose:
                click.echo(f"Error reading {tsx_file}: {e}")
    
    # Step 3: Categorize CSS rules based on usage and layer semantics
    if verbose:
        click.echo("🎯 Categorizing CSS rules by layer semantics and usage...")
    
    # All foundational content goes to foundational.css (no usage analysis)
    foundational_rules = parsed_css['foundational']
    
    # Analyze components and utilities for usage
    used_rules = []
    unused_rules = []
    all_css_classes = set()
    
    for layer_data in parsed_css['components'] + parsed_css['utilities']:
        for rule in layer_data['rules']:
            rule_classes = rule['classes']
            all_css_classes.update(rule_classes)
            
            # Check if any class in this rule is used
            if rule_classes & used_custom_classes:
                used_rules.append(rule['full_rule'])
            elif rule_classes:  # Only unused if it actually has classes
                unused_rules.append(rule['full_rule'])
    
    # Handle standalone rules
    for standalone_data in parsed_css['standalone']:
        for rule in standalone_data['rules']:
            rule_classes = rule['classes']
            all_css_classes.update(rule_classes)
            
            if rule_classes & used_custom_classes:
                used_rules.append(rule['full_rule'])
            elif rule_classes:
                unused_rules.append(rule['full_rule'])
    
    used_css_classes = all_css_classes & used_custom_classes
    unused_css_classes = all_css_classes - used_custom_classes
    
    # Step 4: Generate all output files
    analysis_data = {
        'summary': {
            'tsx_files_analyzed': len(tsx_files),
            'total_css_classes': len(all_css_classes),
            'custom_classes_used': len(used_custom_classes),
            'css_classes_used': len(used_css_classes),
            'css_classes_unused': len(unused_css_classes),
            'usage_percentage': (len(used_css_classes) / len(all_css_classes) * 100) if all_css_classes else 0,
            'foundational_rules': len(foundational_rules),
            'layer_structure': {
                'base_rules': len(parsed_css['foundational']),
                'component_layers': len(parsed_css['components']),
                'utility_layers': len(parsed_css['utilities']),
                'standalone_sections': len(parsed_css['standalone'])
            }
        },
        'used_custom_classes': sorted(list(used_custom_classes)),
        'all_css_classes': sorted(list(all_css_classes)),
        'used_css_classes': sorted(list(used_css_classes)),
        'unused_css_classes': sorted(list(unused_css_classes)),
        'file_analysis': file_analysis
    }
    
    # Write analysis JSON
    analysis_file = os.path.join(output_dir, 'css_analysis.json')
    with open(analysis_file, 'w') as f:
        json.dump(analysis_data, f, indent=2)
    
    # Write text reports
    used_classes_file = os.path.join(output_dir, 'used_classes.txt')
    with open(used_classes_file, 'w') as f:
        f.write("# Custom Classes Used in TSX Files\n\n")
        for cls in sorted(used_custom_classes):
            f.write(f"{cls}\n")
    
    unused_classes_file = os.path.join(output_dir, 'unused_classes.txt')
    with open(unused_classes_file, 'w') as f:
        f.write("# CSS Classes NOT Used in TSX Files\n\n")
        for cls in sorted(unused_css_classes):
            f.write(f"{cls}\n")
    
    css_classes_file = os.path.join(output_dir, 'css_classes.txt')
    with open(css_classes_file, 'w') as f:
        f.write("# All CSS Classes Defined\n\n")
        for cls in sorted(all_css_classes):
            f.write(f"{cls}\n")
    
    # Write CSS files with proper layer semantics
    foundational_css_file = os.path.join(output_dir, 'foundational.css')
    with open(foundational_css_file, 'w') as f:
        f.write("/* Foundational CSS - @layer base + @tailwind + @keyframes */\n")
        f.write("/* This includes all infrastructure: themes, variables, base styles */\n\n")
        for rule in foundational_rules:
            f.write(rule + "\n\n")
    
    used_css_file = os.path.join(output_dir, 'used.css')
    with open(used_css_file, 'w') as f:
        f.write("/* Used CSS Classes - From @layer components + @layer utilities */\n")
        f.write("/* Classes referenced in TSX files */\n\n")
        for rule in used_rules:
            f.write(rule + "\n\n")
    
    unused_css_file = os.path.join(output_dir, 'unused.css')
    with open(unused_css_file, 'w') as f:
        f.write("/* Unused CSS Classes - From @layer components + @layer utilities */\n")
        f.write("/* Classes NOT referenced in TSX files */\n\n")
        for rule in unused_rules:
            f.write(rule + "\n\n")
    
    # Generate summary report
    report_file = os.path.join(output_dir, 'analysis_report.md')
    with open(report_file, 'w') as f:
        f.write("# Layer-Aware CSS Analysis Report\n\n")
        f.write(f"**Generated from:** `{css_file}`\n")
        f.write(f"**TSX Files Scanned:** {len(tsx_files)} files in `{tsx_path}`\n\n")
        
        f.write("## CSS Layer Structure\n\n")
        f.write(f"- **@layer base rules:** {len(foundational_rules)} (→ foundational.css)\n")
        f.write(f"- **@layer components:** {len(parsed_css['components'])} sections\n")
        f.write(f"- **@layer utilities:** {len(parsed_css['utilities'])} sections\n")
        f.write(f"- **Standalone rules:** {len(parsed_css['standalone'])} sections\n\n")
        
        f.write("## Summary\n\n")
        f.write(f"- **Total CSS Classes Defined:** {len(all_css_classes)}\n")
        f.write(f"- **Custom Classes Used in TSX:** {len(used_custom_classes)}\n") 
        f.write(f"- **CSS Classes Actually Used:** {len(used_css_classes)}\n")
        f.write(f"- **CSS Classes Unused:** {len(unused_css_classes)}\n")
        f.write(f"- **Usage Rate:** {analysis_data['summary']['usage_percentage']:.1f}%\n\n")
        
        f.write("## Used CSS Classes\n\n")
        for cls in sorted(used_css_classes):
            f.write(f"- ✅ `{cls}`\n")
        
        f.write("\n## Unused CSS Classes\n\n")
        for cls in sorted(unused_css_classes):
            f.write(f"- ⚠️ `{cls}`\n")
    
    # Output summary
    click.echo(f"\n✅ Layer-aware analysis complete! Generated 7 files:")
    click.echo(f"   📊 {analysis_file}")
    click.echo(f"   📝 {report_file}")
    click.echo(f"   📋 {used_classes_file}, {unused_classes_file}, {css_classes_file}")
    click.echo(f"   🎨 {foundational_css_file}, {used_css_file}, {unused_css_file}")
    
    click.echo(f"\n📈 Summary: {analysis_data['summary']['usage_percentage']:.1f}% CSS usage rate")
    click.echo(f"   🏗️  {len(foundational_rules)} foundational rules (@layer base)")
    click.echo(f"   ✅ {len(used_css_classes)} classes used")
    click.echo(f"   ⚠️  {len(unused_css_classes)} classes unused")

if __name__ == '__main__':
    analyze()