#!/usr/bin/env node

/**
 * Script to check for unused type files in the codebase
 * Usage: node scripts/check-unused-types.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../src');

/**
 * Recursively find all type files
 */
function findTypeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTypeFiles(filePath, fileList);
    } else if (file.match(/\.types\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get relative path from src directory
 */
function getRelativePath(filePath) {
  return path.relative(SRC_DIR, filePath);
}

/**
 * Get filename without extension
 */
function getFileName(filePath) {
  return path.basename(filePath).replace(/\.types\.(ts|tsx)$/, '');
}

/**
 * Check if type file is imported anywhere
 */
function isTypeFileUsed(typeFilePath) {
  const fileName = getFileName(typeFilePath);

  try {
    // Search for direct imports by exact type file name
    const result = execSync(
      `grep -rE "from ['\\\"]@/types/${fileName}\\.types['\\\"]" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // Exclude matches in the type file itself
    const lines = result.trim().split('\n');
    const externalImports = lines.filter(line => !line.includes(`types/${fileName}.types.ts`));

    if (externalImports.length > 0) {
      return true;
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches found
  }

  try {
    // Also check if it's re-exported in types/index.ts (barrel export)
    const indexPath = path.join(SRC_DIR, 'types/index.ts');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      // Check if this file is imported/exported in index
      if (indexContent.includes(`from './${fileName}.types'`) ||
          indexContent.includes(`from "./${fileName}.types"`)) {
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
  console.log('🔍 Analyzing type file usage...\n');
  console.log(`Source directory: ${SRC_DIR}\n`);

  const typeFiles = findTypeFiles(SRC_DIR);
  console.log(`Found ${typeFiles.length} type files\n`);

  const results = {
    used: [],
    unused: [],
    total: typeFiles.length
  };

  typeFiles.forEach(filePath => {
    const fileName = getFileName(filePath);
    const relativePath = getRelativePath(filePath);
    const isUsed = isTypeFileUsed(filePath);

    if (isUsed) {
      results.used.push({ name: fileName, path: relativePath });
    } else {
      results.unused.push({ name: fileName, path: relativePath });
    }
  });

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total type files: ${results.total}`);
  console.log(`Used type files: ${results.used.length}`);
  console.log(`Unused type files: ${results.unused.length}`);
  console.log(`Usage rate: ${((results.used.length / results.total) * 100).toFixed(1)}%`);
  console.log('');

  if (results.unused.length > 0) {
    console.log('⚠️  UNUSED TYPE FILES:');
    console.log('='.repeat(80));
    results.unused.forEach(({ name, path }) => {
      console.log(`  ❌ ${name}.types.ts`);
      console.log(`     ${path}`);
    });
    console.log('');
  } else {
    console.log('✅ All type files are being used!\n');
  }

  if (results.used.length > 0 && process.argv.includes('--verbose')) {
    console.log('✅ USED TYPE FILES:');
    console.log('='.repeat(80));
    results.used.forEach(({ name, path }) => {
      console.log(`  ✓ ${name}.types.ts`);
      console.log(`    ${path}`);
    });
    console.log('');
  }

  // Exit with error code if unused type files found
  if (results.unused.length > 0) {
    console.log('💡 Tip: Review unused type files and consider removing them.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
