#!/usr/bin/env node

/**
 * Script to check for unused hook files in the codebase
 * Usage: node scripts/check-unused-hooks.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOKS_DIR = path.join(__dirname, '../src/hooks');
const SRC_DIR = path.join(__dirname, '../src');

/**
 * Find all hook files
 */
function findHookFiles() {
  const files = fs.readdirSync(HOOKS_DIR);
  return files
    .filter(file => file.match(/\.(ts|tsx)$/))
    .map(file => path.join(HOOKS_DIR, file));
}

/**
 * Get relative path from src directory
 */
function getRelativePath(filePath) {
  return path.relative(SRC_DIR, filePath);
}

/**
 * Get hook name from file
 */
function getHookName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Check if hook is imported anywhere
 */
function isHookUsed(hookPath, hookName) {
  try {
    // Search for direct imports by exact hook name
    // Look for patterns like: from '@/hooks/useModels' or from "@/hooks/useModels"
    const result = execSync(
      `grep -rE "from ['\\\"]@/hooks/${hookName}['\\\"]" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // Exclude matches in the hook file itself
    const lines = result.trim().split('\n');
    const externalImports = lines.filter(line => !line.includes(`hooks/${hookName}.ts`));

    if (externalImports.length > 0) {
      return true;
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches found
  }

  try {
    // Also check if it's re-exported in hooks/index.ts (barrel export)
    const indexPath = path.join(HOOKS_DIR, 'index.ts');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      // Check if this file is imported/exported in index
      if (indexContent.includes(`from './${hookName}'`) ||
          indexContent.includes(`from "./${hookName}"`)) {
        return true;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return false;
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Analyzing hook usage...\n');
  console.log(`Hooks directory: ${HOOKS_DIR}\n`);

  const hookFiles = findHookFiles();
  console.log(`Found ${hookFiles.length} hook files\n`);

  const results = {
    used: [],
    unused: [],
    total: hookFiles.length
  };

  hookFiles.forEach(filePath => {
    const hookName = getHookName(filePath);
    const relativePath = getRelativePath(filePath);
    const isUsed = isHookUsed(filePath, hookName);

    if (isUsed) {
      results.used.push({ name: hookName, path: relativePath });
    } else {
      results.unused.push({ name: hookName, path: relativePath });
    }
  });

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total hooks: ${results.total}`);
  console.log(`Used hooks: ${results.used.length}`);
  console.log(`Unused hooks: ${results.unused.length}`);
  console.log(`Usage rate: ${((results.used.length / results.total) * 100).toFixed(1)}%`);
  console.log('');

  if (results.unused.length > 0) {
    console.log('⚠️  UNUSED HOOKS:');
    console.log('='.repeat(80));
    results.unused.forEach(({ name, path }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${path}`);
    });
    console.log('');
  } else {
    console.log('✅ All hooks are being used!\n');
  }

  if (results.used.length > 0 && process.argv.includes('--verbose')) {
    console.log('✅ USED HOOKS:');
    console.log('='.repeat(80));
    results.used.forEach(({ name, path }) => {
      console.log(`  ✓ ${name}`);
      console.log(`    ${path}`);
    });
    console.log('');
  }

  // Exit with error code if unused hooks found
  if (results.unused.length > 0) {
    console.log('💡 Tip: Review unused hooks and consider removing them.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
