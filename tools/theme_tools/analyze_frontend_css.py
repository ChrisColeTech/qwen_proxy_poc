#!/usr/bin/env python3
"""
Comprehensive CSS analysis for the frontend project
Analyzes all CSS files in the styles directory
"""
import os
import json
from pathlib import Path
from scan_tsx_classes import extract_classes_from_tsx
from scan_css_classes import extract_css_classes

def analyze_frontend_css():
    """Run comprehensive CSS analysis on frontend project"""

    # Paths
    frontend_src = Path("/Users/chris/Projects/qwen_proxy_poc/frontend/src")
    styles_dir = frontend_src / "styles"

    # Step 1: Get all CSS classes defined across all CSS files
    print("=" * 80)
    print("CSS USAGE ANALYSIS - QWEN PROXY FRONTEND")
    print("=" * 80)
    print("\n📁 Scanning CSS files...")

    all_css_classes = set()
    css_files_analyzed = {}

    for css_file in styles_dir.rglob("*.css"):
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
                classes = extract_css_classes(content)
                all_css_classes.update(classes)
                relative_path = css_file.relative_to(frontend_src)
                css_files_analyzed[str(relative_path)] = {
                    'classes': sorted(list(classes)),
                    'count': len(classes)
                }
                print(f"  ✓ {relative_path}: {len(classes)} classes")
        except Exception as e:
            print(f"  ✗ Error reading {css_file}: {e}")

    # Step 2: Get all custom classes used in TSX files
    print(f"\n📁 Scanning TSX files...")

    used_custom_classes = set()
    tsx_files_analyzed = {}
    tsx_files = list(frontend_src.rglob('*.tsx'))

    for tsx_file in tsx_files:
        try:
            with open(tsx_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Get only custom classes (exclude Tailwind)
                custom_classes = extract_classes_from_tsx(content, include_tailwind=False)
                used_custom_classes.update(custom_classes)

                if custom_classes:
                    relative_path = tsx_file.relative_to(frontend_src)
                    tsx_files_analyzed[str(relative_path)] = {
                        'custom_classes': sorted(list(custom_classes)),
                        'count': len(custom_classes)
                    }
        except Exception as e:
            continue

    print(f"  ✓ Analyzed {len(tsx_files)} TSX files")
    print(f"  ✓ Found {len(used_custom_classes)} unique custom classes in use")

    # Step 3: Determine usage
    used_css_classes = all_css_classes & used_custom_classes
    unused_css_classes = all_css_classes - used_custom_classes

    # Step 4: Analyze by file
    print(f"\n📊 Analyzing usage by CSS file...")

    file_usage = {}
    for css_path, data in css_files_analyzed.items():
        file_classes = set(data['classes'])
        file_used = file_classes & used_custom_classes
        file_unused = file_classes - used_custom_classes

        usage_rate = (len(file_used) / len(file_classes) * 100) if file_classes else 0

        file_usage[css_path] = {
            'total_classes': len(file_classes),
            'used_classes': sorted(list(file_used)),
            'unused_classes': sorted(list(file_unused)),
            'used_count': len(file_used),
            'unused_count': len(file_unused),
            'usage_rate': usage_rate
        }

        status = "✅" if usage_rate == 100 else "⚠️" if usage_rate > 0 else "❌"
        print(f"  {status} {css_path}: {usage_rate:.0f}% ({len(file_used)}/{len(file_classes)} used)")

    # Step 5: Generate summary
    overall_usage_rate = (len(used_css_classes) / len(all_css_classes) * 100) if all_css_classes else 0

    print(f"\n{'=' * 80}")
    print(f"SUMMARY")
    print(f"{'=' * 80}")
    print(f"Total CSS Classes Defined:    {len(all_css_classes)}")
    print(f"CSS Classes Used in TSX:      {len(used_css_classes)}")
    print(f"CSS Classes Unused:           {len(unused_css_classes)}")
    print(f"Overall Usage Rate:           {overall_usage_rate:.1f}%")
    print(f"\nCSS Files Analyzed:           {len(css_files_analyzed)}")
    print(f"TSX Files Analyzed:           {len(tsx_files)}")

    # Step 6: Generate detailed report
    report = {
        'summary': {
            'total_css_classes': len(all_css_classes),
            'used_css_classes': len(used_css_classes),
            'unused_css_classes': len(unused_css_classes),
            'overall_usage_rate': overall_usage_rate,
            'css_files_analyzed': len(css_files_analyzed),
            'tsx_files_analyzed': len(tsx_files)
        },
        'all_css_classes': sorted(list(all_css_classes)),
        'used_css_classes': sorted(list(used_css_classes)),
        'unused_css_classes': sorted(list(unused_css_classes)),
        'css_files': css_files_analyzed,
        'file_usage': file_usage,
        'tsx_files_with_custom_classes': tsx_files_analyzed
    }

    # Save JSON report
    output_file = "/Users/chris/Projects/qwen_proxy_poc/tools/theme_tools/frontend_css_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: {output_file}")

    # Generate markdown report
    md_file = "/Users/chris/Projects/qwen_proxy_poc/tools/theme_tools/frontend_css_report.md"
    with open(md_file, 'w') as f:
        f.write("# CSS Usage Analysis Report - Qwen Proxy Frontend\n\n")
        f.write("## Executive Summary\n\n")
        f.write(f"- **Total CSS Classes Defined:** {len(all_css_classes)}\n")
        f.write(f"- **CSS Classes Used:** {len(used_css_classes)} ({overall_usage_rate:.1f}%)\n")
        f.write(f"- **CSS Classes Unused:** {len(unused_css_classes)} ({100-overall_usage_rate:.1f}%)\n")
        f.write(f"- **CSS Files Analyzed:** {len(css_files_analyzed)}\n")
        f.write(f"- **TSX Files Analyzed:** {len(tsx_files)}\n\n")

        f.write("## Analysis by CSS File\n\n")
        for css_path in sorted(file_usage.keys()):
            data = file_usage[css_path]
            f.write(f"### {css_path}\n\n")
            f.write(f"- **Total Classes:** {data['total_classes']}\n")
            f.write(f"- **Used:** {data['used_count']} ({data['usage_rate']:.1f}%)\n")
            f.write(f"- **Unused:** {data['unused_count']} ({100-data['usage_rate']:.1f}%)\n\n")

            if data['used_classes']:
                f.write("**Used Classes:**\n")
                for cls in data['used_classes']:
                    f.write(f"- ✅ `.{cls}`\n")
                f.write("\n")

            if data['unused_classes']:
                f.write("**Unused Classes:**\n")
                for cls in data['unused_classes']:
                    f.write(f"- ❌ `.{cls}`\n")
                f.write("\n")

        f.write("## All Used CSS Classes\n\n")
        for cls in sorted(used_css_classes):
            f.write(f"- ✅ `.{cls}`\n")

        f.write("\n## All Unused CSS Classes\n\n")
        for cls in sorted(unused_css_classes):
            f.write(f"- ❌ `.{cls}`\n")

        f.write("\n## Recommendations\n\n")

        # Generate recommendations
        if overall_usage_rate < 50:
            f.write("### High Priority: Significant Unused CSS\n\n")
            f.write(f"Your codebase has {100-overall_usage_rate:.1f}% unused CSS classes. ")
            f.write("This indicates significant opportunity for cleanup.\n\n")

        # Files with 0% usage
        zero_usage_files = [path for path, data in file_usage.items() if data['usage_rate'] == 0]
        if zero_usage_files:
            f.write("### Files with No Usage (Consider Removing)\n\n")
            for path in zero_usage_files:
                f.write(f"- `{path}` - All {file_usage[path]['total_classes']} classes are unused\n")
            f.write("\n")

        # Files with low usage
        low_usage_files = [(path, data) for path, data in file_usage.items()
                          if 0 < data['usage_rate'] < 30]
        if low_usage_files:
            f.write("### Files with Low Usage (<30%)\n\n")
            for path, data in low_usage_files:
                f.write(f"- `{path}` - {data['usage_rate']:.1f}% used ({data['used_count']}/{data['total_classes']})\n")
            f.write("\n")

        f.write("### Caveats and Warnings\n\n")
        f.write("⚠️ **Important Notes:**\n\n")
        f.write("1. **Dynamic Class Names:** This analysis cannot detect classes added dynamically via JavaScript\n")
        f.write("2. **Template Literals:** Classes within template literals with variables may not be detected\n")
        f.write("3. **Third-party Components:** Some classes may be used by third-party libraries\n")
        f.write("4. **Test Files:** Classes may be used in test files not analyzed\n")
        f.write("5. **CSS Variables:** Classes that only define CSS variables may appear unused but provide theming\n\n")
        f.write("**Recommendation:** Manually review unused classes before removal, especially:\n")
        f.write("- Theme-related classes\n")
        f.write("- Animation/keyframe definitions\n")
        f.write("- Utility classes that might be used conditionally\n")

    print(f"📄 Markdown report saved to: {md_file}")
    print(f"\n{'=' * 80}")
    print("Analysis complete!")
    print(f"{'=' * 80}\n")

    return report

if __name__ == '__main__':
    analyze_frontend_css()
