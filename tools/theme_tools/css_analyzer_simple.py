#!/usr/bin/env python3
"""
Simplified CSS Analysis Tool - Uses CSS flattener for reliable analysis
"""
import os
import json
import tempfile
import click
import re
from pathlib import Path
from scan_tsx_classes import extract_classes_from_tsx
from extract_used_css import extract_custom_classes_from_tsx, extract_css_classes_from_css
from css_flattener import flatten_css

@click.group()
def cli():
    """Simplified CSS Analysis Tool"""
    pass

@cli.command()
@click.option('--tsx-path', '-t', default='../src', help='Path to TSX files')
@click.option('--css-file', '-c', default='../src/index.css', help='CSS file to analyze')
@click.option('--output-dir', '-o', default='.', help='Output directory for analysis files')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def analyze(tsx_path, css_file, output_dir, verbose):
    """Run simplified CSS analysis using flattener approach"""
    
    if not os.path.exists(tsx_path):
        click.echo(f"Error: TSX path {tsx_path} not found")
        return
    
    if not os.path.exists(css_file):
        click.echo(f"Error: CSS file {css_file} not found")
        return
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    click.echo("🔍 Running simplified CSS analysis...")
    
    # Step 1: Flatten the CSS first
    if verbose:
        click.echo("📝 Flattening CSS structure...")
    
    try:
        with open(css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()
    except Exception as e:
        click.echo(f"Error reading CSS file: {e}")
        return
    
    # Use the flattener to separate foundational and class rules
    foundational_rules, flattened_rules = flatten_css(css_content)
    
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
    
    # Step 3: Extract class names from flattened CSS (much simpler now!)
    css_classes = set()
    for rule in flattened_rules:
        # Simple regex to find class names in flattened CSS
        class_matches = re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', rule)
        for class_name in class_matches:
            # Clean up pseudo-classes
            clean_class = re.sub(r':.*$', '', class_name)
            if clean_class:
                css_classes.add(clean_class)
    
    # Step 4: Determine usage
    used_css_classes = css_classes & used_custom_classes
    unused_css_classes = css_classes - used_custom_classes
    
    # Step 5: Generate all output files
    
    # Save analysis data as JSON
    analysis_data = {
        'summary': {
            'tsx_files_analyzed': len(tsx_files),
            'total_css_classes': len(css_classes),
            'custom_classes_used': len(used_custom_classes),
            'css_classes_used': len(used_css_classes),
            'css_classes_unused': len(unused_css_classes),
            'usage_percentage': (len(used_css_classes) / len(css_classes) * 100) if css_classes else 0,
            'foundational_rules': len(foundational_rules)
        },
        'used_custom_classes': sorted(list(used_custom_classes)),
        'all_css_classes': sorted(list(css_classes)),
        'used_css_classes': sorted(list(used_css_classes)),
        'unused_css_classes': sorted(list(unused_css_classes)),
        'file_analysis': file_analysis
    }
    
    analysis_file = os.path.join(output_dir, 'css_analysis.json')
    with open(analysis_file, 'w') as f:
        json.dump(analysis_data, f, indent=2)
    
    # Generate text reports
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
        for cls in sorted(css_classes):
            f.write(f"{cls}\n")
    
    # Generate CSS files by filtering flattened rules
    used_rules = []
    unused_rules = []
    
    for rule in flattened_rules:
        # Check if this rule contains any used classes
        rule_classes = set()
        class_matches = re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', rule)
        for match in class_matches:
            clean_class = re.sub(r':.*$', '', match)
            if clean_class:
                rule_classes.add(clean_class)
        
        # Categorize the rule
        if rule_classes & used_css_classes:
            used_rules.append(rule)
        elif rule_classes & unused_css_classes:
            unused_rules.append(rule)
    
    # Write foundational CSS file
    foundational_css_file = os.path.join(output_dir, 'foundational.css')
    with open(foundational_css_file, 'w') as f:
        f.write("/* Foundational CSS - Structural and infrastructure styles */\n\n")
        for rule in foundational_rules:
            f.write(rule + "\n\n")
    
    # Write used classes CSS file
    used_css_file = os.path.join(output_dir, 'used.css')
    with open(used_css_file, 'w') as f:
        f.write("/* Used CSS Classes - Referenced in TSX files */\n\n")
        for rule in used_rules:
            f.write(rule + "\n\n")
    
    # Write unused classes CSS file
    unused_css_file = os.path.join(output_dir, 'unused.css')
    with open(unused_css_file, 'w') as f:
        f.write("/* Unused CSS Classes - NOT referenced in TSX files */\n\n")
        for rule in unused_rules:
            f.write(rule + "\n\n")
    
    # Generate summary report
    report_file = os.path.join(output_dir, 'analysis_report.md')
    with open(report_file, 'w') as f:
        f.write("# CSS Analysis Report\n\n")
        f.write(f"**Generated from:** `{css_file}`\n")
        f.write(f"**TSX Files Scanned:** {len(tsx_files)} files in `{tsx_path}`\n\n")
        
        f.write("## Summary\n\n")
        f.write(f"- **Total CSS Classes Defined:** {len(css_classes)}\n")
        f.write(f"- **Custom Classes Used in TSX:** {len(used_custom_classes)}\n") 
        f.write(f"- **CSS Classes Actually Used:** {len(used_css_classes)}\n")
        f.write(f"- **CSS Classes Unused:** {len(unused_css_classes)}\n")
        f.write(f"- **Usage Rate:** {analysis_data['summary']['usage_percentage']:.1f}%\n")
        f.write(f"- **Foundational Rules:** {len(foundational_rules)}\n\n")
        
        f.write("## Used CSS Classes\n\n")
        for cls in sorted(used_css_classes):
            f.write(f"- ✅ `{cls}`\n")
        
        f.write("\n## Unused CSS Classes\n\n")
        for cls in sorted(unused_css_classes):
            f.write(f"- ⚠️ `{cls}`\n")
    
    # Output summary
    click.echo(f"\n✅ Analysis complete! Generated 7 files:")
    click.echo(f"   📊 {analysis_file}")
    click.echo(f"   📝 {report_file}")
    click.echo(f"   📋 {used_classes_file}, {unused_classes_file}, {css_classes_file}")
    click.echo(f"   🎨 {foundational_css_file}, {used_css_file}, {unused_css_file}")
    
    click.echo(f"\n📈 Summary: {analysis_data['summary']['usage_percentage']:.1f}% CSS usage rate")
    click.echo(f"   🏗️  {len(foundational_rules)} foundational rules")
    click.echo(f"   ✅ {len(used_css_classes)} classes used")
    click.echo(f"   ⚠️  {len(unused_css_classes)} classes unused")

if __name__ == '__main__':
    cli()