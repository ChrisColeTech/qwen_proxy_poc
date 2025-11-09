#!/usr/bin/env python3
"""
Master CSS Analysis Tool - Coordinates all analysis tasks
"""
import os
import json
import click
from pathlib import Path
from scan_tsx_classes import extract_classes_from_tsx
from scan_css_classes import extract_css_classes
from extract_used_css import (
    extract_custom_classes_from_tsx, 
    extract_css_classes_from_css, 
    extract_css_rules_for_classes,
    extract_foundational_css_rules
)

@click.group()
def cli():
    """Master CSS Analysis Tool"""
    pass

@cli.command()
@click.option('--tsx-path', '-t', default='../src', help='Path to TSX files')
@click.option('--css-file', '-c', default='../src/index.css', help='CSS file to analyze')
@click.option('--output-dir', '-o', default='.', help='Output directory for analysis files')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def analyze(tsx_path, css_file, output_dir, verbose):
    """Run complete CSS analysis and generate all outputs"""
    
    if not os.path.exists(tsx_path):
        click.echo(f"Error: TSX path {tsx_path} not found")
        return
    
    if not os.path.exists(css_file):
        click.echo(f"Error: CSS file {css_file} not found")
        return
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    click.echo("🔍 Running complete CSS analysis...")
    
    # Step 1: Analyze TSX files for custom classes
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
    
    # Step 2: Analyze CSS file
    if verbose:
        click.echo("🎨 Analyzing CSS file...")
    
    try:
        with open(css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()
    except Exception as e:
        click.echo(f"Error reading CSS file: {e}")
        return
    
    css_classes = extract_css_classes_from_css(css_content)
    
    # Step 3: Determine usage
    used_css_classes = css_classes & used_custom_classes
    unused_css_classes = css_classes - used_custom_classes
    
    # Step 4: Generate all output files
    
    # 4a. Save analysis data as JSON
    analysis_data = {
        'summary': {
            'tsx_files_analyzed': len(tsx_files),
            'total_css_classes': len(css_classes),
            'custom_classes_used': len(used_custom_classes),
            'css_classes_used': len(used_css_classes),
            'css_classes_unused': len(unused_css_classes),
            'usage_percentage': (len(used_css_classes) / len(css_classes) * 100) if css_classes else 0
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
    
    # 4b. Generate text reports
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
    
    # 4c. Split CSS files into three parts
    foundational_rules = extract_foundational_css_rules(css_content)
    used_rules = extract_css_rules_for_classes(css_content, used_css_classes)
    unused_rules = extract_css_rules_for_classes(css_content, unused_css_classes)
    
    # Foundational CSS file
    foundational_css_file = os.path.join(output_dir, 'foundational.css')
    with open(foundational_css_file, 'w') as f:
        f.write("/* Foundational CSS - Structural and infrastructure styles */\n\n")
        for rule in foundational_rules:
            f.write(rule + "\n\n")
    
    # Used classes CSS file
    used_css_file = os.path.join(output_dir, 'used.css')
    with open(used_css_file, 'w') as f:
        f.write("/* Used CSS Classes - Referenced in TSX files */\n\n")
        for rule in used_rules:
            f.write(rule + "\n\n")
    
    # Unused classes CSS file
    unused_css_file = os.path.join(output_dir, 'unused.css')
    with open(unused_css_file, 'w') as f:
        f.write("/* Unused CSS Classes - NOT referenced in TSX files */\n\n")
        for rule in unused_rules:
            f.write(rule + "\n\n")
    
    # Step 5: Generate summary report
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
        f.write(f"- **Usage Rate:** {analysis_data['summary']['usage_percentage']:.1f}%\n\n")
        
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
    click.echo(f"   ✅ {len(used_css_classes)} classes used")
    click.echo(f"   ⚠️  {len(unused_css_classes)} classes unused")

@cli.command()
@click.option('--analysis-file', '-a', default='css_analysis.json', help='Analysis JSON file to read')
def report(analysis_file):
    """Generate report from existing analysis data"""
    
    if not os.path.exists(analysis_file):
        click.echo(f"Error: Analysis file {analysis_file} not found")
        click.echo("Run 'analyze' command first to generate analysis data")
        return
    
    try:
        with open(analysis_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        click.echo(f"Error reading analysis file: {e}")
        return
    
    summary = data['summary']
    
    click.echo("📊 CSS Analysis Report")
    click.echo("=" * 50)
    click.echo(f"Files analyzed: {summary['tsx_files_analyzed']}")
    click.echo(f"CSS classes defined: {summary['total_css_classes']}")
    click.echo(f"Custom classes used: {summary['custom_classes_used']}")
    click.echo(f"Usage rate: {summary['usage_percentage']:.1f}%")
    
    click.echo(f"\n✅ Used classes ({len(data['used_css_classes'])}):")
    for cls in data['used_css_classes']:
        click.echo(f"   {cls}")
    
    click.echo(f"\n⚠️  Unused classes ({len(data['unused_css_classes'])}):")
    for cls in data['unused_css_classes']:
        click.echo(f"   {cls}")

if __name__ == '__main__':
    cli()