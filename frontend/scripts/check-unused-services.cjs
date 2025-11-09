#!/usr/bin/env node

/**
 * Script to check for unused service files in the codebase
 * Usage: node scripts/check-unused-services.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVICES_DIR = path.join(__dirname, '../src/services');
const SRC_DIR = path.join(__dirname, '../src');

/**
 * Find all service files
 */
function findServiceFiles() {
  const files = fs.readdirSync(SERVICES_DIR);
  return files
    .filter(file => file.match(/\.(ts|tsx)$/))
    .map(file => path.join(SERVICES_DIR, file));
}

/**
 * Get relative path from src directory
 */
function getRelativePath(filePath) {
  return path.relative(SRC_DIR, filePath);
}

/**
 * Get service name
 */
function getServiceName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Check if service is imported anywhere
 */
function isServiceUsed(servicePath, serviceName) {
  try {
    // Search for direct imports by exact service name
    const result = execSync(
      `grep -rE "from ['\\\"]@/services/${serviceName}['\\\"]" ${SRC_DIR} --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    // Exclude matches in the service file itself
    const lines = result.trim().split('\n');
    const externalImports = lines.filter(line => !line.includes(`services/${serviceName}.ts`));

    if (externalImports.length > 0) {
      return true;
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches found
  }

  try {
    // Also check if it's re-exported in services/index.ts (barrel export)
    const indexPath = path.join(SERVICES_DIR, 'index.ts');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      // Check if this file is imported/exported in index
      if (indexContent.includes(`from './${serviceName}'`) ||
          indexContent.includes(`from "./${serviceName}"`)) {
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
  console.log('🔍 Analyzing service usage...\n');
  console.log(`Services directory: ${SERVICES_DIR}\n`);

  const serviceFiles = findServiceFiles();
  console.log(`Found ${serviceFiles.length} service files\n`);

  const results = {
    used: [],
    unused: [],
    total: serviceFiles.length
  };

  serviceFiles.forEach(filePath => {
    const serviceName = getServiceName(filePath);
    const relativePath = getRelativePath(filePath);
    const isUsed = isServiceUsed(filePath, serviceName);

    if (isUsed) {
      results.used.push({ name: serviceName, path: relativePath });
    } else {
      results.unused.push({ name: serviceName, path: relativePath });
    }
  });

  // Print results
  console.log('=' .repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total services: ${results.total}`);
  console.log(`Used services: ${results.used.length}`);
  console.log(`Unused services: ${results.unused.length}`);
  console.log(`Usage rate: ${((results.used.length / results.total) * 100).toFixed(1)}%`);
  console.log('');

  if (results.unused.length > 0) {
    console.log('⚠️  UNUSED SERVICES:');
    console.log('='.repeat(80));
    results.unused.forEach(({ name, path }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${path}`);
    });
    console.log('');
  } else {
    console.log('✅ All services are being used!\n');
  }

  if (results.used.length > 0 && process.argv.includes('--verbose')) {
    console.log('✅ USED SERVICES:');
    console.log('='.repeat(80));
    results.used.forEach(({ name, path }) => {
      console.log(`  ✓ ${name}`);
      console.log(`    ${path}`);
    });
    console.log('');
  }

  // Exit with error code if unused services found
  if (results.unused.length > 0) {
    console.log('💡 Tip: Review unused services and consider removing them.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
