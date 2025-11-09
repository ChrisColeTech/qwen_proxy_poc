#!/usr/bin/env python3
"""
Dynamic CSS Class Detection Tool

This tool scans for CSS classes that might be used dynamically in ways that
the main static analyzer might miss. It reads the list of supposedly "unused"
classes and searches for them in dynamic contexts like:
- Classes in functions returning cn()
- Classes in ternary operators with cn()
- Classes in template literals with variables
- Classes constructed from string concatenation
- Classes in object/map lookups
- Classes passed as function parameters
"""

import os
import re
from pathlib import Path
from typing import Set, List, Dict, Tuple
import click


class DynamicClassDetector:
    """Detects dynamically used CSS classes that static analysis might miss"""

    def __init__(self, tsx_path: str, unused_classes_file: str, verbose: bool = False):
        self.tsx_path = Path(tsx_path)
        self.unused_classes_file = Path(unused_classes_file)
        self.verbose = verbose
        self.findings: List[Dict] = []

    def load_unused_classes(self) -> Set[str]:
        """Load the list of supposedly unused classes"""
        if not self.unused_classes_file.exists():
            raise FileNotFoundError(f"Unused classes file not found: {self.unused_classes_file}")

        unused_classes = set()
        with open(self.unused_classes_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#'):
                    unused_classes.add(line)

        if self.verbose:
            click.echo(f"Loaded {len(unused_classes)} unused classes")

        return unused_classes

    def remove_comments(self, content: str) -> str:
        """Remove single-line and multi-line comments from code"""
        # Remove multi-line comments /* ... */
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        # Remove single-line comments // ...
        content = re.sub(r'//.*?$', '', content, flags=re.MULTILINE)
        return content

    def find_in_ternary_operators(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class in ternary operators like:
        condition ? 'class-name' : 'other'
        condition ? 'other' : 'class-name'
        sidebarPosition === 'left' ? 'sidebar-nav-indicator-left' : 'sidebar-nav-indicator-right'
        """
        matches = []
        # Match ternary operators with the class name in either position
        patterns = [
            # class in true branch
            rf'\?\s*[\'"`]({re.escape(class_name)})[\'"`]\s*:',
            # class in false branch
            rf':\s*[\'"`]({re.escape(class_name)})[\'"`]',
        ]

        for pattern in patterns:
            for match in re.finditer(pattern, content):
                # Get surrounding context (up to 100 chars before and after)
                start = max(0, match.start() - 100)
                end = min(len(content), match.end() + 100)
                context = content[start:end].replace('\n', ' ').strip()
                matches.append((context, 'ternary_operator'))

        return matches

    def find_in_cn_calls(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class in cn() utility calls like:
        cn('base-class', condition && 'class-name')
        className={cn('class-name', other)}
        """
        matches = []
        # Look for cn( with the class name inside
        pattern = rf'cn\s*\([^)]*[\'"`]({re.escape(class_name)})[\'"`][^)]*\)'

        for match in re.finditer(pattern, content):
            context = match.group(0)
            matches.append((context, 'cn_utility'))

        return matches

    def find_in_template_literals(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class in template literals, especially with variables:
        `sidebar-${position}`
        `theme-${mode}-active`
        """
        matches = []
        # Look for template literals that might construct this class name
        # We'll search for partial matches where the class name is split by variables

        # Split the class name on common delimiters to find potential variable positions
        parts = class_name.split('-')
        if len(parts) > 1:
            # Look for patterns like `part1-${var}-part3` that could construct this class
            for i in range(len(parts)):
                # Try removing each part to see if we find a template literal pattern
                remaining_parts = parts[:i] + parts[i+1:]
                partial = '-'.join(remaining_parts)
                if len(partial) > 3:  # Only search if partial is meaningful
                    pattern = rf'`[^`]*{re.escape(partial)}[^`]*\$\{{[^}}]+\}}[^`]*`'
                    for match in re.finditer(pattern, content):
                        context = match.group(0)
                        matches.append((context, 'template_literal'))

        # Also look for direct mentions in template literals
        pattern = rf'`[^`]*{re.escape(class_name)}[^`]*`'
        for match in re.finditer(pattern, content):
            context = match.group(0)
            matches.append((context, 'template_literal_direct'))

        return matches

    def find_in_string_concatenation(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class in string concatenation like:
        'prefix-' + variable
        variable + '-suffix'
        """
        matches = []
        parts = class_name.split('-')

        if len(parts) > 1:
            # Look for concatenation patterns
            for i in range(len(parts)):
                for j in range(i + 1, len(parts) + 1):
                    partial = '-'.join(parts[i:j])
                    if len(partial) > 3:
                        # Look for quoted string with + operator nearby
                        pattern = rf'[\'"`]{re.escape(partial)}[\'"`]\s*\+|\+\s*[\'"`]{re.escape(partial)}[\'"`]'
                        for match in re.finditer(pattern, content):
                            start = max(0, match.start() - 50)
                            end = min(len(content), match.end() + 50)
                            context = content[start:end].replace('\n', ' ').strip()
                            matches.append((context, 'string_concatenation'))

        return matches

    def find_in_object_lookups(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class in object/map lookups like:
        const classes = { active: 'class-name', ... }
        classMap[key]
        """
        matches = []

        # Look for object literals with the class name as a value
        pattern = rf'{{[^}}]*[\'"`]({re.escape(class_name)})[\'"`][^}}]*}}'
        for match in re.finditer(pattern, content):
            context = match.group(0)
            if len(context) > 200:
                context = context[:200] + '...'
            matches.append((context, 'object_literal'))

        return matches

    def find_in_function_params(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class passed as function parameters:
        getClassName('class-name')
        setTheme('class-name')
        """
        matches = []

        # Look for function calls with the class name as a parameter
        pattern = rf'\w+\s*\([^)]*[\'"`]({re.escape(class_name)})[\'"`][^)]*\)'
        for match in re.finditer(pattern, content):
            context = match.group(0)
            # Filter out common false positives like console.log, console.error, etc.
            if not re.match(r'(console\.|log\(|error\(|warn\(|info\()', context):
                matches.append((context, 'function_parameter'))

        return matches

    def find_in_classlist_operations(self, content: str, class_name: str) -> List[Tuple[str, str]]:
        """
        Find class in classList operations:
        classList.add('class-name')
        classList.remove('class-name')
        classList.toggle('class-name')
        """
        matches = []

        pattern = rf'classList\.(add|remove|toggle)\s*\([^)]*[\'"`]({re.escape(class_name)})[\'"`][^)]*\)'
        for match in re.finditer(pattern, content):
            context = match.group(0)
            matches.append((context, 'classList_operation'))

        return matches

    def analyze_file(self, file_path: Path, unused_classes: Set[str]) -> None:
        """Analyze a single file for dynamic class usage"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove comments to avoid false positives
            content = self.remove_comments(content)

            # Check each unused class
            for class_name in unused_classes:
                all_matches = []

                # Run all detection methods
                all_matches.extend(self.find_in_ternary_operators(content, class_name))
                all_matches.extend(self.find_in_cn_calls(content, class_name))
                all_matches.extend(self.find_in_template_literals(content, class_name))
                all_matches.extend(self.find_in_string_concatenation(content, class_name))
                all_matches.extend(self.find_in_object_lookups(content, class_name))
                all_matches.extend(self.find_in_function_params(content, class_name))
                all_matches.extend(self.find_in_classlist_operations(content, class_name))

                # Record findings
                for context, detection_type in all_matches:
                    confidence = self.calculate_confidence(context, class_name, detection_type)
                    self.findings.append({
                        'class_name': class_name,
                        'file': str(file_path.relative_to(self.tsx_path.parent)),
                        'detection_type': detection_type,
                        'confidence': confidence,
                        'context': context
                    })

        except Exception as e:
            if self.verbose:
                click.echo(f"Error analyzing {file_path}: {e}")

    def calculate_confidence(self, context: str, class_name: str, detection_type: str) -> str:
        """
        Calculate confidence level based on context and detection type
        Returns: 'definite', 'high', 'medium', or 'possible'
        """
        # Direct mentions in classList operations are definite
        if detection_type == 'classList_operation':
            return 'definite'

        # Class name in ternary with exact match is high confidence
        if detection_type == 'ternary_operator':
            if f"'{class_name}'" in context or f'"{class_name}"' in context or f'`{class_name}`' in context:
                return 'definite'
            return 'high'

        # Class in cn() utility is high confidence
        if detection_type == 'cn_utility':
            return 'high'

        # Direct template literal match is high
        if detection_type == 'template_literal_direct':
            return 'high'

        # Template literals with variables are medium confidence
        if detection_type == 'template_literal':
            return 'medium'

        # String concatenation is medium confidence
        if detection_type == 'string_concatenation':
            return 'medium'

        # Object literals are medium to high
        if detection_type == 'object_literal':
            if f"'{class_name}'" in context or f'"{class_name}"' in context:
                return 'high'
            return 'medium'

        # Function parameters are possible matches
        if detection_type == 'function_parameter':
            return 'possible'

        return 'possible'

    def scan_all_files(self, unused_classes: Set[str]) -> None:
        """Scan all .ts and .tsx files for dynamic class usage"""
        tsx_files = list(self.tsx_path.rglob('*.tsx'))
        ts_files = list(self.tsx_path.rglob('*.ts'))
        all_files = tsx_files + ts_files

        if self.verbose:
            click.echo(f"Scanning {len(all_files)} files ({len(tsx_files)} .tsx, {len(ts_files)} .ts)")

        for file_path in all_files:
            self.analyze_file(file_path, unused_classes)

    def generate_report(self, output_file: str) -> None:
        """Generate a comprehensive report of findings"""
        # Group findings by class name
        findings_by_class = {}
        for finding in self.findings:
            class_name = finding['class_name']
            if class_name not in findings_by_class:
                findings_by_class[class_name] = []
            findings_by_class[class_name].append(finding)

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Dynamic CSS Class Usage Report\n\n")
            f.write("This report identifies CSS classes marked as 'unused' but found in dynamic contexts.\n")
            f.write("These classes may be false negatives in the static analysis.\n\n")

            f.write("## Summary\n\n")
            f.write(f"- Total supposedly unused classes scanned: {len(set(finding['class_name'] for finding in self.findings))}\n")
            f.write(f"- Classes with dynamic usage detected: {len(findings_by_class)}\n")
            f.write(f"- Total detection instances: {len(self.findings)}\n\n")

            # Count by confidence level
            confidence_counts = {
                'definite': sum(1 for f in self.findings if f['confidence'] == 'definite'),
                'high': sum(1 for f in self.findings if f['confidence'] == 'high'),
                'medium': sum(1 for f in self.findings if f['confidence'] == 'medium'),
                'possible': sum(1 for f in self.findings if f['confidence'] == 'possible')
            }

            f.write("### Confidence Breakdown\n\n")
            f.write(f"- Definite matches: {confidence_counts['definite']}\n")
            f.write(f"- High confidence: {confidence_counts['high']}\n")
            f.write(f"- Medium confidence: {confidence_counts['medium']}\n")
            f.write(f"- Possible matches: {confidence_counts['possible']}\n\n")

            f.write("---\n\n")
            f.write("## Detailed Findings\n\n")

            # Sort by class name
            for class_name in sorted(findings_by_class.keys()):
                findings = findings_by_class[class_name]
                f.write(f"### `{class_name}`\n\n")
                f.write(f"Found in {len(findings)} location(s):\n\n")

                for i, finding in enumerate(findings, 1):
                    f.write(f"**{i}. {finding['file']}**\n\n")
                    f.write(f"- **Detection Type:** {finding['detection_type'].replace('_', ' ').title()}\n")
                    f.write(f"- **Confidence:** {finding['confidence'].upper()}\n")
                    f.write(f"- **Context:**\n")
                    f.write(f"  ```\n")
                    f.write(f"  {finding['context']}\n")
                    f.write(f"  ```\n\n")

                f.write("---\n\n")

            # Add recommendations section
            f.write("## Recommendations\n\n")
            f.write("### Definite and High Confidence Matches\n\n")
            f.write("These classes are very likely used in your application and should NOT be removed:\n\n")

            high_confidence_classes = set()
            for finding in self.findings:
                if finding['confidence'] in ['definite', 'high']:
                    high_confidence_classes.add(finding['class_name'])

            for class_name in sorted(high_confidence_classes):
                f.write(f"- `{class_name}`\n")

            f.write("\n### Medium Confidence Matches\n\n")
            f.write("These classes are likely used dynamically. Review the context before removing:\n\n")

            medium_confidence_classes = set()
            for finding in self.findings:
                if finding['confidence'] == 'medium' and finding['class_name'] not in high_confidence_classes:
                    medium_confidence_classes.add(finding['class_name'])

            for class_name in sorted(medium_confidence_classes):
                f.write(f"- `{class_name}`\n")

            f.write("\n### Possible Matches\n\n")
            f.write("These classes might be used. Manual review recommended:\n\n")

            possible_classes = set()
            for finding in self.findings:
                if finding['confidence'] == 'possible' and finding['class_name'] not in high_confidence_classes and finding['class_name'] not in medium_confidence_classes:
                    possible_classes.add(finding['class_name'])

            for class_name in sorted(possible_classes):
                f.write(f"- `{class_name}`\n")

            f.write("\n---\n\n")
            f.write("## Next Steps\n\n")
            f.write("1. Review all **definite** and **high confidence** matches - these should be removed from the unused list\n")
            f.write("2. Investigate **medium confidence** matches by examining the code context\n")
            f.write("3. Manually check **possible** matches to confirm actual usage\n")
            f.write("4. Update the CSS analyzer to improve detection of these patterns\n")


@click.command()
@click.option('--tsx-path', '-t', default='../../frontend/src', help='Path to TSX files')
@click.option('--unused-classes', '-u', default='unused_classes.txt', help='Path to unused classes file')
@click.option('--output', '-o', default='output/dynamic_classes_report.txt', help='Output report file')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def detect(tsx_path, unused_classes, output, verbose):
    """Detect dynamically used CSS classes that static analysis might miss"""

    click.echo("Detecting dynamically used CSS classes...")

    # Create output directory if needed
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Initialize detector
    detector = DynamicClassDetector(tsx_path, unused_classes, verbose)

    try:
        # Load unused classes
        unused_classes_set = detector.load_unused_classes()
        click.echo(f"Loaded {len(unused_classes_set)} supposedly unused classes")

        # Scan all files
        click.echo("Scanning files for dynamic usage patterns...")
        detector.scan_all_files(unused_classes_set)

        # Generate report
        click.echo(f"Generating report...")
        detector.generate_report(output)

        # Summary
        classes_found = len(set(finding['class_name'] for finding in detector.findings))
        click.echo(f"\nAnalysis complete!")
        click.echo(f"Found {classes_found} classes with potential dynamic usage")
        click.echo(f"Total detection instances: {len(detector.findings)}")
        click.echo(f"Report written to: {output}")

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise


if __name__ == '__main__':
    detect()
