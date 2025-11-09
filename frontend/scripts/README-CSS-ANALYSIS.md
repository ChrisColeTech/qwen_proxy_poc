# CSS Usage Analysis Guide

## Method 1: Node.js Script (Recommended for Modular CSS) ✅

```bash
node scripts/check-unused-css.cjs
```

**Best for:** Projects with modular CSS (multiple .css files)

**Pros:**
- Scans all 25 CSS files directly
- Quick to run
- Shows specific class names
- Works with modular CSS architecture
- Can run in CI/CD

**Cons:**
- Misses dynamically constructed classes (e.g., `` className={`icon-${size}`} ``)
- Doesn't detect classes used via string interpolation
- May show false positives for dynamic usage

**Note:** This project uses modular CSS with files in `src/styles/`, so this method is more accurate than tools expecting a single flattened file.

---

## Method 2: Chrome DevTools Coverage (Most Accurate)

### Steps:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open Chrome DevTools:**
   - Press `Cmd+Option+I` (Mac) or `F12` (Windows/Linux)
   - Go to **More Tools** > **Coverage** (or press `Cmd+Shift+P` and type "Coverage")

3. **Record coverage:**
   - Click the **Record** button (⏺)
   - Navigate through your entire app
   - Visit every page and interaction
   - Click **Stop** when done

4. **Analyze CSS:**
   - Look for CSS files in the coverage report
   - Red portions = unused CSS
   - Green portions = used CSS
   - Click on a file to see line-by-line coverage

5. **Export results:**
   - Right-click on coverage results
   - Select "Export" to save as JSON

### Example Output:
```
src/styles/home.css
  ██████░░░░░░░░  45.2% used

src/styles/layout.css
  ████████░░░░░░  67.8% used
```

**Pros:**
- 100% accurate (shows what's actually used in the browser)
- Visual highlighting
- Can export data
- Detects dynamic classes

**Cons:**
- Manual process
- Requires visiting every page
- Only checks pages you visit

---

## Method 3: PurgeCSS (Automated Production Build)

### Install PurgeCSS:

```bash
npm install -D @fullhuman/postcss-purgecss
```

### Add to `postcss.config.js`:

```javascript
const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss({
            content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
            safelist: [
              // Add classes that are dynamically generated
              /^status-/,
              /^icon-/,
              /^demo-/,
            ],
          }),
        ]
      : []),
  ],
};
```

### Test it:

```bash
NODE_ENV=production npm run build
```

### Check build size:

```bash
ls -lh dist/assets/*.css
```

**Pros:**
- Automated
- Removes unused CSS at build time
- Reduces production bundle size
- Can configure safelist for dynamic classes

**Cons:**
- Can accidentally remove needed CSS
- Requires careful configuration
- May break dynamic classes

---

## Method 4: Vite Build Analysis

### Analyze bundle size:

```bash
npm run build
```

Look at the output:

```
dist/assets/index-2lwvvf5S.css   89.76 kB │ gzip:  11.86 kB
```

### Use rollup-plugin-visualizer:

```bash
npm install -D rollup-plugin-visualizer
```

### Add to `vite.config.ts`:

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

### Build and view:

```bash
npm run build
# Opens stats.html in browser showing CSS breakdown
```

**Pros:**
- Visual bundle analysis
- Shows relative sizes
- Identifies large CSS files

**Cons:**
- Doesn't show which classes are unused
- Only shows overall file sizes

---

## Method 5: CSS Specificity Analyzer

### Using CSS Stats:

```bash
npx cssstats src/styles/**/*.css
```

### Or use online tool:

1. Go to https://cssstats.com/
2. Paste your CSS
3. See detailed statistics

**Output:**
- Total rules
- Total declarations
- Specificity graph
- Color palette
- Font families

**Pros:**
- Detailed CSS metrics
- Identifies overly specific selectors
- Shows CSS complexity

**Cons:**
- Doesn't detect unused CSS
- Focuses on quality metrics

---

## Method 6: Python CSS Analyzers (For Flattened CSS)

Located in `tools/theme_tools/`:
- `css_analyzer.py` - Full analyzer
- `css_analyzer_simple.py` - Simplified version

```bash
cd tools/theme_tools
python3 css_analyzer_simple.py analyze \
  --tsx-path ../../frontend/src \
  --css-file ../../frontend/src/index.css \
  --output-dir ../../frontend/css-analysis
```

**Best for:** Single CSS file or pre-built/flattened CSS

**Pros:**
- Proper CSS parsing (not regex)
- Separates foundational vs class-based CSS
- Generates 7 output files (JSON, reports, separated CSS)
- Better custom class detection
- Extracts actual CSS rules with selectors

**Cons:**
- Designed for single CSS file input
- **Doesn't work well with modular CSS** (this project)
- Would need to build/flatten CSS first
- More complex setup (Python dependencies)

**Why it doesn't work for this project:**
- `index.css` only contains `@tailwind` directives
- Actual classes are in 25 separate files in `src/styles/`
- Would need to run Vite build first to get flattened output

---

## Recommended Workflow

### For Development:

1. Use **Custom Script** (`check-unused-css.cjs`) periodically to catch obvious unused CSS
2. Use **Chrome DevTools Coverage** when refactoring features
3. Review and clean up before major releases

### For Production:

1. Use **PurgeCSS** in production builds (carefully configured)
2. Monitor bundle sizes with **Vite Build Analysis**
3. Set up alerts if CSS bundle exceeds threshold

### For Deep Cleanup:

1. Run **Chrome DevTools Coverage** on every page
2. Export coverage data
3. Use **Custom Script** to identify candidates
4. Manually verify before deleting
5. Test thoroughly after cleanup

---

## Common False Positives

Classes that may show as "unused" but are actually needed:

### 1. Dynamic Classes
```typescript
// Not detected by static analysis
className={`status-${status}`}
className={isActive ? 'icon-active' : 'icon-inactive'}
```

### 2. State-based Classes
```typescript
// Applied via JS based on state
element.classList.add('sidebar-collapsed')
```

### 3. Third-party Libraries
```css
/* Radix UI applies these dynamically */
.radix-accordion-trigger[data-state="open"] { }
```

### 4. Pseudo-classes
```css
/* Applied by browser */
.button:hover { }
.input:focus { }
```

---

## Current CSS Statistics (from script)

```
Total CSS files: 25
Total CSS classes: 537
Used classes: 82 (15.3%)
Unused classes: 455 (84.7%)
```

### Files with Most Unused CSS:

1. **styles/home.css** - 45/45 unused (0% used)
2. **styles/models2.css** - 29/29 unused (0% used)
3. **styles/providers.css** - 24/24 unused (0% used)
4. **styles/credentials.css** - 24/24 unused (0% used)
5. **styles/system-features.css** - 26/26 unused (0% used)

**Note:** These files may be for features that use dynamic class names or were removed.

---

## Next Steps

1. **Investigate 0% used files:**
   - Check if features still exist
   - Verify dynamic class usage
   - Consider removing if truly unused

2. **Update script to handle dynamic classes:**
   - Add safelist patterns
   - Improve regex matching
   - Check for string interpolation

3. **Set up automated checks:**
   - Add CSS size budgets in vite.config.ts
   - Run coverage checks in CI/CD
   - Alert on bundle size increases

4. **Consider CSS-in-JS migration:**
   - Only bundle CSS that's imported
   - Tree-shaking eliminates unused styles
   - Type-safe styling
