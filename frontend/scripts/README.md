# Code Analysis Scripts

A collection of scripts to analyze and maintain code quality by detecting unused files and duplicate names in the codebase.

## Available Scripts

### 1. Check Unused Components
```bash
node scripts/check-unused-components.cjs
```

Scans all component files (`.tsx`, `.jsx`) in `src/components/` and detects which ones are not imported anywhere in the codebase.

**Features:**
- Recursively scans component directories
- Detects both `@/components/*` alias imports and relative imports
- Excludes self-references

**Example Output:**
```
🔍 Analyzing component usage...

Components directory: /path/to/src/components
Source directory: /path/to/src

Found 46 component files

================================================================================
SUMMARY
================================================================================
Total components: 46
Used components: 46
Unused components: 0
Usage rate: 100.0%

✅ All components are being used!
```

---

### 2. Check Unused Hooks
```bash
node scripts/check-unused-hooks.cjs
```

Scans all custom hooks in `src/hooks/` and identifies which ones are not imported anywhere.

**Features:**
- Checks for exact hook name matches (e.g., `useModels` won't match `useModelsPage`)
- Detects barrel exports via `hooks/index.ts`
- Uses precise `@/hooks/` alias matching

**Example Output:**
```
⚠️  UNUSED HOOKS:
================================================================================
  ❌ useModels
     hooks/useModels.ts
  ❌ useProviders
     hooks/useProviders.ts

💡 Tip: Review unused hooks and consider removing them.
```

---

### 3. Check Unused Constants
```bash
node scripts/check-unused-constants.cjs
```

Analyzes constant files in `src/constants/` to find unused configuration files.

**Features:**
- Checks for direct imports via `@/constants/`
- Detects barrel exports via `constants/index.ts`
- Handles both `.ts` and `.tsx` files

---

### 4. Check Unused Services
```bash
node scripts/check-unused-services.cjs
```

Scans service files in `src/services/` for unused API/business logic modules.

**Features:**
- Precise `@/services/` import matching
- Barrel export detection
- Helps identify dead API code

---

### 5. Check Unused Type Files
```bash
node scripts/check-unused-types.cjs
```

Finds unused TypeScript type definition files (`.types.ts`).

**Features:**
- Matches exact type file names (e.g., `models.types.ts`)
- Detects re-exports via `types/index.ts` barrel files
- Prevents false positives for barrel-exported types

---

### 6. Check Duplicate File Names
```bash
node scripts/check-duplicate-names.cjs
```

Detects files with the same name in different directories, which can cause confusion and import errors.

**Example Output:**
```
⚠️  DUPLICATE FILE NAMES:
================================================================================

📄 ProviderSwitchTab.tsx (2 occurrences):
   - components/features/providers/ProviderSwitchTab.tsx
   - components/features/quick-guide/ProviderSwitchTab.tsx

💡 Tip: Consider renaming duplicate files to make them more unique.
```

---

### 7. Check Unused CSS Classes
```bash
node scripts/check-unused-css.cjs
```

Analyzes all CSS files to detect unused CSS classes in the codebase.

**Features:**
- Scans all `.css` files in `src/styles/` and root
- Extracts class names using regex
- Checks for usage in JSX/TSX files
- Shows per-file usage statistics

**Example Output:**
```
================================================================================
SUMMARY
================================================================================
Total CSS files: 25
Total CSS classes: 537
Used classes: 82
Unused classes: 455
Usage rate: 15.3%

⚠️  FILES WITH UNUSED CLASSES:
================================================================================

📄 styles/home.css
   Total: 45 | Used: 0 | Unused: 45 (0.0% used)
   Unused: home-page-container, home-header-card, home-header-title...
```

**Important Notes:**
- This tool has limitations and may show false positives
- Does not detect dynamically constructed class names (e.g., `` className={`icon-${size}`} ``)
- See `README-CSS-ANALYSIS.md` for alternative methods (Chrome DevTools Coverage, PurgeCSS)

---

## How the Scripts Work

### Import Detection Strategy

All scripts use a two-phase detection approach:

1. **Direct Imports**: Search for exact import paths using regex
   ```typescript
   // Matches: from '@/hooks/useModels'
   grep -rE "from ['\"]@/hooks/useModels['\"]"
   ```

2. **Barrel Exports**: Check if file is re-exported in `index.ts`
   ```typescript
   // Checks if types/index.ts contains:
   // export * from './common.types'
   ```

### Why Two Phases?

Many projects use barrel exports (index files) to simplify imports:

```typescript
// Without barrel: Import from specific file
import { UIState } from '@/types/common.types';

// With barrel: Import from directory
import { UIState } from '@/types';
```

The scripts detect both patterns to avoid false positives.

---

## Running All Scripts

Check everything at once:

```bash
echo "=== COMPONENTS ===" && node scripts/check-unused-components.cjs
echo "=== HOOKS ===" && node scripts/check-unused-hooks.cjs
echo "=== CONSTANTS ===" && node scripts/check-unused-constants.cjs
echo "=== SERVICES ===" && node scripts/check-unused-services.cjs
echo "=== TYPES ===" && node scripts/check-unused-types.cjs
echo "=== DUPLICATES ===" && node scripts/check-duplicate-names.cjs
echo "=== CSS ===" && node scripts/check-unused-css.cjs
```

Or create a npm script in `package.json`:

```json
{
  "scripts": {
    "check:unused": "node scripts/check-unused-components.cjs && node scripts/check-unused-hooks.cjs && node scripts/check-unused-constants.cjs && node scripts/check-unused-services.cjs && node scripts/check-unused-types.cjs",
    "check:duplicates": "node scripts/check-duplicate-names.cjs",
    "check:css": "node scripts/check-unused-css.cjs",
    "check:all": "npm run check:unused && npm run check:duplicates && npm run check:css"
  }
}
```

Then run:
```bash
npm run check:all
```

---

## Understanding the Output

### Exit Codes
- `0`: All files are used (success)
- `1`: Unused files found (warning/error)

### Verbosity
Add `--verbose` flag to see used files:

```bash
node scripts/check-unused-hooks.cjs --verbose
```

Output:
```
✅ USED HOOKS:
================================================================================
  ✓ useHomePage
    hooks/useHomePage.ts
  ✓ useModelsPage
    hooks/useModelsPage.ts
  ...
```

---

## Common Use Cases

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
node scripts/check-unused-components.cjs
if [ $? -ne 0 ]; then
  echo "❌ Found unused components. Commit aborted."
  exit 1
fi
```

### CI/CD Pipeline
Add to GitHub Actions workflow:

```yaml
- name: Check for unused code
  run: |
    node scripts/check-unused-components.cjs
    node scripts/check-unused-hooks.cjs
    node scripts/check-unused-types.cjs
```

### Code Cleanup Sprint
Run all scripts, review output, and delete unused files:

```bash
# Find unused files
npm run check:all

# Review and delete
rm src/hooks/useModels.ts
rm src/components/ui/unused-component.tsx

# Verify build still works
npm run build

# Commit cleanup
git add .
git commit -m "Remove unused code"
```

---

## Known Limitations

### Components Script
- Uses flexible regex matching because components can use relative paths
- May have false positives if component names appear in comments
- Solution: Manually verify before deleting

### Dynamic Imports
Scripts don't detect dynamic imports:

```typescript
// NOT detected
const Component = await import(`./components/${name}.tsx`);
```

If you use dynamic imports, review results carefully.

### File Extensions
- Hooks/Services/Constants: Checks `.ts` and `.tsx`
- Components: Checks `.tsx` and `.jsx`
- Types: Checks `.types.ts` and `.types.tsx`

Custom naming patterns may not be detected.

---

## Troubleshooting

### "All files marked as unused"
The `@/` path alias may not be configured correctly. Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### "False positives for barrel exports"
Check if your `index.ts` file exists and contains exports:

```typescript
// types/index.ts should contain:
export * from './common.types';
export * from './models.types';
```

### "Script fails with grep error"
Ensure grep supports `-E` flag (extended regex):

```bash
grep --version
# Should show GNU grep or similar
```

---

## Contributing

To add a new script:

1. Copy an existing script as template
2. Update the search directory and patterns
3. Add barrel export detection if needed
4. Update this README
5. Test with `node scripts/your-new-script.cjs`

---

## License

Part of the Qwen Proxy POC project.
