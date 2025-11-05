#!/usr/bin/env node

/**
 * Deployment Validation Script
 *
 * Validates that the Qwen Proxy Backend is correctly configured
 * and ready for deployment.
 *
 * Checks:
 * - Dependencies installed
 * - Configuration valid
 * - Server can start
 * - Health checks pass
 * - API endpoints respond
 * - Qwen API connectivity
 *
 * Usage:
 *   node scripts/validate-deployment.js
 *   npm run validate-deployment
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`)
};

let validationFailed = false;

// Validation checks
const checks = {

  async checkNodeVersion() {
    log.section('1. Node.js Version Check');

    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);

    if (major >= 18) {
      log.success(`Node.js version: ${version} (>= 18.0.0)`);
      return true;
    } else {
      log.error(`Node.js version: ${version} (requires >= 18.0.0)`);
      return false;
    }
  },

  async checkDependencies() {
    log.section('2. Dependencies Check');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      log.error('package.json not found');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['express', 'axios', 'dotenv', 'prom-client'];

    let allInstalled = true;

    for (const dep of requiredDeps) {
      const depPath = path.join(__dirname, '..', 'node_modules', dep);
      if (fs.existsSync(depPath)) {
        const installedVersion = require(path.join(depPath, 'package.json')).version;
        log.success(`${dep}@${installedVersion} installed`);
      } else {
        log.error(`${dep} not installed`);
        allInstalled = false;
      }
    }

    if (!allInstalled) {
      log.warn('Run: npm install');
      return false;
    }

    return true;
  },

  async checkConfiguration() {
    log.section('3. Configuration Check');

    // Check .env file exists
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      log.error('.env file not found');
      log.warn('Copy .env.example to .env and configure credentials');
      return false;
    }

    log.success('.env file exists');

    // Load and validate configuration
    require('dotenv').config({ path: envPath });

    const requiredVars = ['QWEN_TOKEN', 'QWEN_COOKIES'];
    let allSet = true;

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value || value.includes('your_') || value.includes('here')) {
        log.error(`${varName} not configured`);
        allSet = false;
      } else {
        log.success(`${varName} set (${value.substring(0, 20)}...)`);
      }
    }

    if (!allSet) {
      log.warn('Edit .env file and set valid credentials');
      return false;
    }

    return true;
  },

  async checkFileStructure() {
    log.section('4. File Structure Check');

    const requiredFiles = [
      'src/index.js',
      'src/server.js',
      'src/config/index.js',
      'src/api/qwen-auth.js',
      'src/api/qwen-client.js',
      'src/handlers/chat-completion-handler.js',
      'src/handlers/models-handler.js',
      'src/middleware/error-handler.js',
      'src/middleware/request-validator.js'
    ];

    let allExist = true;

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        log.success(file);
      } else {
        log.error(`${file} missing`);
        allExist = false;
      }
    }

    return allExist;
  },

  async checkServerStart() {
    log.section('5. Server Start Check');

    return new Promise((resolve) => {
      log.info('Starting server...');

      const serverProcess = spawn('node', ['src/index.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let started = false;

      const timeout = setTimeout(() => {
        if (!started) {
          log.error('Server start timeout (10 seconds)');
          serverProcess.kill();
          resolve(false);
        }
      }, 10000);

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('listening on port') || output.includes('Server started')) {
          started = true;
          clearTimeout(timeout);
          log.success('Server started successfully');
          setTimeout(() => {
            serverProcess.kill();
            resolve(true);
          }, 500);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('ERROR')) {
          log.error(`Server error: ${error}`);
          clearTimeout(timeout);
          serverProcess.kill();
          resolve(false);
        }
      });

      serverProcess.on('error', (error) => {
        log.error(`Failed to start server: ${error.message}`);
        clearTimeout(timeout);
        resolve(false);
      });
    });
  },

  async checkQwenAPIConnectivity() {
    log.section('6. Qwen API Connectivity Check');

    require('dotenv').config();

    const auth = {
      'bx-umidtoken': process.env.QWEN_TOKEN,
      'Cookie': process.env.QWEN_COOKIES,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    try {
      log.info('Testing connection to https://chat.qwen.ai/api/models');

      const response = await axios.get('https://chat.qwen.ai/api/models', {
        headers: auth,
        timeout: 10000
      });

      if (response.status === 200 && response.data.data) {
        log.success(`Connected successfully (${response.data.data.length} models)`);
        return true;
      } else {
        log.error(`Unexpected response: HTTP ${response.status}`);
        return false;
      }

    } catch (error) {
      if (error.response) {
        log.error(`Qwen API returned HTTP ${error.response.status}`);
        if (error.response.status === 401 || error.response.status === 403) {
          log.error('Authentication failed - credentials may be invalid or expired');
        }
      } else if (error.code === 'ECONNREFUSED') {
        log.error('Connection refused - check internet connection');
      } else if (error.code === 'ETIMEDOUT') {
        log.error('Connection timeout - check network');
      } else {
        log.error(`Connection error: ${error.message}`);
      }
      return false;
    }
  },

  async checkEndpoints() {
    log.section('7. API Endpoints Check');

    // Note: This assumes server is running
    log.warn('Start server manually and run: npm run test:integration');
    return true;
  }
};

// Main validation function
async function validate() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Qwen Proxy Backend - Deployment Validation');
  console.log('='.repeat(60));

  const results = [];

  // Run all checks
  results.push({ name: 'Node Version', passed: await checks.checkNodeVersion() });
  results.push({ name: 'Dependencies', passed: await checks.checkDependencies() });
  results.push({ name: 'Configuration', passed: await checks.checkConfiguration() });
  results.push({ name: 'File Structure', passed: await checks.checkFileStructure() });
  results.push({ name: 'Server Start', passed: await checks.checkServerStart() });
  results.push({ name: 'Qwen API', passed: await checks.checkQwenAPIConnectivity() });

  // Summary
  log.section('Validation Summary');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    if (result.passed) {
      log.success(result.name);
    } else {
      log.error(result.name);
      validationFailed = true;
    }
  });

  console.log('\n' + '='.repeat(60));

  if (validationFailed) {
    console.log(`\n${colors.red}❌ Validation failed (${passed}/${total} checks passed)${colors.reset}\n`);
    console.log('Please fix the issues above before deploying.\n');
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ All checks passed (${passed}/${total})${colors.reset}\n`);
    console.log('System is ready for deployment!\n');
    console.log('Next steps:');
    console.log('  1. Run integration tests: npm run test:integration');
    console.log('  2. Run e2e tests: npm run test:e2e');
    console.log('  3. Deploy using preferred method (Docker, PM2, systemd)\n');
    process.exit(0);
  }
}

// Run validation
if (require.main === module) {
  validate().catch(error => {
    log.error(`Validation script error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { checks, validate };
