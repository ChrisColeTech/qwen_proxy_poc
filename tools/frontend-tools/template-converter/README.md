# Template Converter

This tool converts existing frontend files from the `old_files` directory into template format that can be used by the frontend generator.

## Features

- **Automatic Placeholder Conversion**: Converts hardcoded names to template placeholders
- **File Structure Preservation**: Maintains the original directory structure
- **Multiple File Type Support**: Handles TypeScript, JavaScript, CSS, and other file types
- **Smart Pattern Recognition**: Recognizes common patterns like component names, imports, API endpoints
- **Documentation Generation**: Creates conversion guide documentation

## Usage

### Quick Start

```bash
# Run the conversion script
./run_conversion.sh
```

### Manual Usage

```bash
# Convert with custom paths
python3 converter.py \
    --source /path/to/source \
    --output /path/to/templates \
    --docs
```

### Arguments

- `--source`: Source directory containing the frontend files to convert
- `--output`: Output directory where template files will be created
- `--docs`: Generate conversion documentation (optional)

## Conversion Process

The converter performs the following transformations:

### 1. Entity Name Conversions
- `User` → `{entity_name}` (PascalCase)
- `user` → `{entity_name_lower}` (lowercase)
- `USER` → `{ENTITY_NAME_UPPER}` (UPPERCASE)
- `users` → `{endpoint_name}` (plural/endpoint)

### 2. Domain Conversions
- `user-management` → `{domain}`
- `authentication` → `{domain}`
- `gameplay` → `{domain}`
- `puzzles` → `{domain}`

### 3. Service/Hook Conversions
- `userService` → `{endpoint_name}Service`
- `UserService` → `{entity_name}Service`
- `useUser` → `use{entity_name}`

### 4. Import Path Conversions
- `../types/user` → `../types/{domain}/{endpoint_name}`
- `../services/userService` → `../services/{domain}/{endpoint_name}Service`
- `../hooks/useUser` → `../hooks/{domain}/use{entity_name}`

### 5. File Naming
- Original files get `.template` extension
- `Component.tsx` → `Component.tsx.template`
- `styles.css` → `styles.css.template`

## Template Placeholders

The following placeholders are available in templates:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{entity_name}` | PascalCase entity name | `User`, `Product` |
| `{entity_name_lower}` | Lowercase entity name | `user`, `product` |
| `{ENTITY_NAME_UPPER}` | Uppercase entity name | `USER`, `PRODUCT` |
| `{endpoint_name}` | API endpoint/plural name | `users`, `products` |
| `{domain}` | Domain category | `user-management`, `inventory` |

## Directory Structure

```
template-converter/
├── converter.py          # Main conversion script
├── run_conversion.sh     # Quick run script
├── README.md            # This file
└── examples/            # Example conversions (optional)
```

## Output Structure

After conversion, templates will be organized like:

```
templates/
├── components/
│   ├── layout/
│   │   ├── Header.tsx.template
│   │   └── Footer.tsx.template
│   └── forms/
│       └── EntityForm.tsx.template
├── hooks/
│   └── useEntity.ts.template
├── services/
│   └── entityService.ts.template
├── types/
│   └── entityTypes.ts.template
└── CONVERSION_GUIDE.md
```

## Customization

To add more conversion patterns, edit the `placeholder_mappings` dictionary in `converter.py`:

```python
self.placeholder_mappings = {
    r'\\bCustomPattern\\b': '{custom_placeholder}',
    # Add more patterns...
}
```

## Limitations

- Requires manual review of generated templates
- May not catch all edge cases in complex code
- CSS class name conversions are basic
- Some imports may need manual adjustment

## Next Steps

After conversion:

1. Review generated templates for accuracy
2. Test templates with the frontend generator
3. Adjust placeholder patterns as needed
4. Update frontend generator to use new templates

## Troubleshooting

- **Permission errors**: Make sure the script is executable (`chmod +x`)
- **Python errors**: Ensure Python 3 is installed
- **Path errors**: Check that source and output paths are correct
- **Encoding errors**: Files should be UTF-8 encoded