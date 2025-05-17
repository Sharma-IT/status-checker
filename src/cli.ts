#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { checkUrls, Logger } from './index';

const logger = new Logger('info');

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
Status Checker - A lean, dependency-free URL status checker

Usage:
  status-checker [options] <config-file>
  status-checker --url <url> [options]

Options:
  --url <url>           Check a single URL instead of using a config file
  --timeout <ms>        Timeout in milliseconds (default: 5000)
  --header <name:value> Add a custom header (can be used multiple times)
  --success <code>      Add a success status code (can be used multiple times)
  --sync                Run checks synchronously
  --quiet               Suppress output except for errors
  --help                Show this help message
  --version             Show version information

Examples:
  status-checker config.json
  status-checker --url https://example.com --timeout 10000
  status-checker --url https://api.github.com/users/Sharma-IT --header "User-Agent:StatusChecker/1.0" --success 200 --success 403
  `);
}

/**
 * Print version information
 */
function printVersion(): void {
  try {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`Status Checker v${packageJson.version}`);
  } catch (error) {
    console.log('Status Checker (version unknown)');
  }
}

/**
 * Parse command line arguments
 * @returns Parsed arguments
 */
function parseArgs(): {
  configFile?: string;
  url?: string;
  timeout?: number;
  headers?: Record<string, string>;
  successCodes?: number[];
  sync?: boolean;
  quiet?: boolean;
  help?: boolean;
  version?: boolean;
} {
  const args = process.argv.slice(2);
  const result: any = {
    headers: {},
    successCodes: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--url':
        result.url = args[++i];
        break;
      case '--timeout':
        result.timeout = parseInt(args[++i], 10);
        break;
      case '--header':
        const headerValue = args[++i];
        const colonIndex = headerValue.indexOf(':');
        if (colonIndex > 0) {
          const name = headerValue.substring(0, colonIndex).trim();
          const value = headerValue.substring(colonIndex + 1).trim();
          result.headers[name] = value;
        } else {
          logger.warn(`Invalid header format: ${headerValue}. Expected format: "Name:Value"`);
        }
        break;
      case '--success':
        const code = parseInt(args[++i], 10);
        if (!isNaN(code)) {
          result.successCodes.push(code);
        } else {
          logger.warn(`Invalid status code: ${args[i]}`);
        }
        break;
      case '--sync':
        result.sync = true;
        break;
      case '--quiet':
        result.quiet = true;
        break;
      case '--help':
        result.help = true;
        break;
      case '--version':
        result.version = true;
        break;
      default:
        if (!arg.startsWith('--') && !result.configFile) {
          result.configFile = arg;
        }
        break;
    }
  }

  // Clean up empty arrays/objects
  if (Object.keys(result.headers).length === 0) {
    delete result.headers;
  }

  if (result.successCodes.length === 0) {
    delete result.successCodes;
  }

  return result;
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    const args = parseArgs();

    // Handle help and version flags
    if (args.help) {
      printUsage();
      process.exit(0);
    }

    if (args.version) {
      printVersion();
      process.exit(0);
    }

    // Check arguments
    if (!args.configFile && !args.url) {
      logger.error('Error: No configuration file or URL specified');
      printUsage();
      process.exit(1);
    }

    // Set up options
    const options = {
      async: !args.sync,
      log: !args.quiet
    };

    // Run checks
    if (args.url) {
      logger.info(`Checking URL: ${args.url}`);

      // Create a config object for the single URL check
      const config = {
        urls: [{
          url: args.url,
          timeout: args.timeout || 5000,
          headers: args.headers,
          successCodes: args.successCodes
        }],
        globalSuccessCodes: args.successCodes || [200]
      };

      // Use the StatusChecker directly for more control
      const { StatusChecker } = await import('./checker.js');
      const checker = new StatusChecker(config, { log: !args.quiet });
      const results = await checker.checkAll();
      const result = results[0];

      if (result.success) {
        logger.info(`✅ ${args.url} - Status: ${result.statusCode} - Response time: ${result.responseTime}ms`);
        process.exit(0);
      } else {
        logger.error(`❌ ${args.url} - Error: ${result.error} - Response time: ${result.responseTime}ms`);
        process.exit(1);
      }
    } else {
      logger.info(`Checking URLs from configuration: ${args.configFile}`);
      const results = await checkUrls(args.configFile!, options);

      const failedChecks = results.filter(result => !result.success);

      if (failedChecks.length > 0) {
        logger.error(`${failedChecks.length} of ${results.length} checks failed`);
        process.exit(1);
      } else {
        logger.info(`All ${results.length} checks passed`);
        process.exit(0);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error: ${message}`);
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error(`Unhandled error: ${error}`);
  process.exit(1);
});
