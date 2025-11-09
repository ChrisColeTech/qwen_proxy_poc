#!/usr/bin/env node

/**
 * Script to check for unused constant files in the codebase
 * Usage: node scripts/check-unused-constants.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONSTANTS_DIR = path.join(__dirname, '../src/constants');
const SRC_DIR = path.join(__dirname, '../src');

/**
 * Find all constant files
 */
function findConstantFiles() {
  const files = fs.readdirSync(CONSTANTS_DIR);
  return files
    .filter(file => file.match(/\.(ts|tsx)$/))
    .map(file => path.join(CONSTANTS_DIR, file));
}

/**
 * Get relative path from src directory
 */
function getRelativePath(filePath) {
  return path.relative(SRC_DIR, filePath);
}

/**
 * Get constant file name
 */
function getConstantName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Check if constant file is imported anywhere
 */
function isConstantUsed(constantPath, constantName) {
  try {
    // Search for direct imports by exact constant file name
    const result = execSync(
      `grep -rE "from ['\\\"]@/constants/${constantName}['\\\"]" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // Exclude matches in the constant file itself
    const lines = result.trim().split('\n');
    const externalImports = lines.filter(line => !line.includes(`constants/${constantName}.ts`) && !line.includes(`constants/${constantName}.tsx`));

    if (externalImports.length > 0) {
      return true;
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches found
  }

  try {
    // Also check if it's re-exported in constants/index.ts (barrel export)
    const indexPath = path.join(CONSTANTS_DIR, 'index.ts');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      // Check if this file is imported/exported in index
      if (indexContent.includes(`from './${constantName}'`) ||
          indexContent.includes(`from "./${constantName}"`)) {
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
  console.log('🔍 Analyzing constant file usage...\n');
  console.log(`Constants directory: ${CONSTANTS_DIR}\n`);

  const constantFiles = findConstantFiles();
  console.log(`Found ${constantFiles.length} constant files\n`);

  const results = {
    used: [],
    unused: [],
    total: constantFiles.length
  };

  constantFiles.forEach(filePath => {
    const constantName = getConstantName(filePath);
    const relativePath = getRelativePath(filePath);
    const isUsed = isConstantUsed(filePath, constantName);

    if (isUsed) {
      results.used.push({ name: constantName, path: relativePath });
    } else {
      results.unused.push({ name: constantName, path: relativePath });
    }
  });

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total constant files: ${results.total}`);
  console.log(`Used constant files: ${results.used.length}`);
  console.log(`Unused constant files: ${results.unused.length}`);
  console.log(`Usage rate: ${((results.used.length / results.total) * 100).toFixed(1)}%`);
  console.log('');

  if (results.unused.length > 0) {
    console.log('⚠️  UNUSED CONSTANT FILES:');
    console.log('='.repeat(80));
    results.unused.forEach(({ name, path }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${path}`);
    });
    console.log('');
  } else {
    console.log('✅ All constant files are being used!\n');
  }

  if (results.used.length > 0 && process.argv.includes('--verbose')) {
    console.log('✅ USED CONSTANT FILES:');
    console.log('='.repeat(80));
    results.used.forEach(({ name, path }) => {
      console.log(`  ✓ ${name}`);
      console.log(`    ${path}`);
    });
    console.log('');
  }

  // Exit with error code if unused constant files found
  if (results.unused.length > 0) {
    console.log('💡 Tip: Review unused constant files and consider removing them.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
