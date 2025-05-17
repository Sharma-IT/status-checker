/**
 * Status Checker - A lean, dependency-free URL status checker library
 * 
 * @author Shubham Sharma <shubhamsharma.emails@gmail.com>
 * @license MIT
 */

// Export all types
export * from './types';

// Export classes
export { ConfigLoader } from './config';
export { StatusChecker } from './checker';
export { Logger } from './logger';

// Main functionality
import { Config, CheckResult, CheckerOptions } from './types';
import { ConfigLoader } from './config';
import { StatusChecker } from './checker';
import { Logger } from './logger';

/**
 * Check URLs from a configuration file
 * @param configPath Path to the configuration file
 * @param options Checker options
 * @returns Promise resolving to check results
 */
export async function checkUrls(configPath: string, options?: CheckerOptions): Promise<CheckResult[]> {
  const logger = new Logger(options?.log ? 'info' : 'error');
  const configLoader = new ConfigLoader(logger);
  const config = configLoader.loadConfig(configPath);
  const checker = new StatusChecker(config, options);
  
  return checker.checkAll();
}

/**
 * Check a single URL
 * @param url URL to check
 * @param timeout Timeout in milliseconds (default: 5000)
 * @param successCodes Array of success status codes (default: [200])
 * @returns Promise resolving to check result
 */
export async function checkUrl(
  url: string,
  timeout: number = 5000,
  successCodes: number[] = [200]
): Promise<CheckResult> {
  const config: Config = {
    urls: [{ url, timeout }],
    globalSuccessCodes: successCodes
  };
  
  const checker = new StatusChecker(config, { log: false });
  const results = await checker.checkAll();
  return results[0];
}
