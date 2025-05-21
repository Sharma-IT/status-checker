import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Config, UrlConfig, CheckResult, CheckerOptions, Check, StatusCodeCheck } from './types';
import { Logger } from './logger';
import { CheckEvaluator } from './evaluator';

/**
 * URL Status Checker
 */
export class StatusChecker {
  private config: Config;
  private logger: Logger;
  private options: CheckerOptions;

  /**
   * Create a new StatusChecker
   * @param config Configuration
   * @param options Checker options
   */
  constructor(config: Config, options?: CheckerOptions) {
    this.config = config;
    this.options = {
      async: options?.async !== undefined ? options.async : true,
      log: options?.log !== undefined ? options.log : true,
      logger: options?.logger
    };
    this.logger = new Logger(config);

    if (this.options.logger) {
      this.logger.log = this.options.logger;
    }
  }

  /**
   * Check all URLs in the configuration
   * @returns Array of check results
   */
  async checkAll(): Promise<CheckResult[]> {
    this.logger.info(`Starting to check ${this.config.urls.length} URLs`);

    if (this.options.async) {
      return this.checkAllAsync();
    } else {
      return this.checkAllSync();
    }
  }

  /**
   * Check all URLs asynchronously
   * @returns Array of check results
   */
  private async checkAllAsync(): Promise<CheckResult[]> {
    this.logger.debug('Running checks in async mode');

    const promises = this.config.urls.map(urlConfig => this.checkUrl(urlConfig));
    return Promise.all(promises);
  }

  /**
   * Check all URLs synchronously
   * @returns Array of check results
   */
  private async checkAllSync(): Promise<CheckResult[]> {
    this.logger.debug('Running checks in sync mode');

    const results: CheckResult[] = [];

    for (const urlConfig of this.config.urls) {
      const result = await this.checkUrl(urlConfig);
      results.push(result);
    }

    return results;
  }

  /**
   * Check a single URL
   * @param urlConfig URL configuration
   * @returns Check result
   */
  async checkUrl(urlConfig: UrlConfig): Promise<CheckResult> {
    const startTime = Date.now();
    const url = urlConfig.url;
    const name = urlConfig.name;
    const timeout = urlConfig.timeout || this.config.globalTimeout || 5000;

    this.logger.debug(`Checking URL: ${url} (${name || ''})`);

    try {
      // Make the request
      const response = await this.makeRequest(urlConfig, timeout);
      const responseTime = Date.now() - startTime;

      // Create the base result
      const checkResult: CheckResult = {
        url,
        name,
        statusCode: response.statusCode,
        headers: response.headers,
        // Only include body if it's not too large
        body: response.body.length > 1024 ? `${response.body.substring(0, 1024)}...` : response.body,
        responseTime,
        timestamp: new Date(),
        success: true, // Will be updated based on checks
        checkResults: []
      };

      // Determine which checks to run
      let checks: Check[] = [];

      // If checks are provided, use them
      if (urlConfig.checks && urlConfig.checks.length > 0) {
        checks = urlConfig.checks;
      }
      // Otherwise, create a default status code check from successCodes
      else {
        const successCodes = urlConfig.successCodes || this.config.globalSuccessCodes || [200];
        const statusCodeCheck: StatusCodeCheck = {
          type: 'status_code',
          operator: 'equals',
          value: successCodes.join('|')
        };
        checks = [statusCodeCheck];
      }

      // Run the checks
      const evaluator = new CheckEvaluator();
      const checkResults = evaluator.evaluateChecks(checks, {
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
        responseTime
      });

      // Update the result with check results
      checkResult.checkResults = checkResults;

      // Overall success is true only if all checks passed
      checkResult.success = checkResults.every(result => result.passed);

      // If any checks failed, add an error message
      if (!checkResult.success) {
        const failedChecks = checkResults.filter(result => !result.passed);
        checkResult.error = failedChecks.map(check =>
          `${check.description} - Expected: ${check.expectedValue}, Actual: ${check.actualValue}`
        ).join('; ');
      }

      this.logResult(checkResult);
      return checkResult;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const checkResult: CheckResult = {
        url,
        name,
        success: false,
        error: errorMessage,
        responseTime,
        timestamp: new Date()
      };

      this.logResult(checkResult);
      return checkResult;
    }
  }

  /**
   * Make an HTTP/HTTPS request
   * @param urlConfig URL configuration
   * @param timeout Timeout in milliseconds
   * @returns Promise resolving to the response
   */
  private makeRequest(urlConfig: UrlConfig, timeout: number): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const url = urlConfig.url;
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const method = urlConfig.method || 'GET';
      const headers = urlConfig.headers || {};

      // Add content-type header if body is provided
      if (urlConfig.body && urlConfig.contentType && !headers['content-type']) {
        headers['content-type'] = urlConfig.contentType;
      }

      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        timeout,
        headers
      };

      const requestModule = isHttps ? https : http;

      const req = requestModule.request(options, (res) => {
        let responseBody = '';
        const responseHeaders: Record<string, string> = {};

        // Convert headers to a simple object
        for (const [key, value] of Object.entries(res.headers)) {
          if (value !== undefined) {
            responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
          }
        }

        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: responseHeaders,
            body: responseBody
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeout}ms`));
      });

      // Send body if provided and method is not GET or HEAD
      if (urlConfig.body && !['GET', 'HEAD'].includes(method)) {
        req.write(urlConfig.body);
      }

      req.end();
    });
  }

  /**
   * Log a check result
   * @param result Check result
   */
  private logResult(result: CheckResult): void {
    if (!this.options.log) return;

    const name = result.name ? `${result.name} (${result.url})` : result.url;

    if (result.success) {
      this.logger.info(`✅ ${name} - Status: ${result.statusCode} - Response time: ${result.responseTime}ms`);

      // Log individual check results in debug mode
      if (result.checkResults && result.checkResults.length > 0) {
        this.logger.debug(`Check details for ${name}:`);
        result.checkResults.forEach(check => {
          this.logger.debug(`  ✅ ${check.description}`);
        });
      }
    } else {
      this.logger.error(`❌ ${name} - Status: ${result.statusCode} - Response time: ${result.responseTime}ms`);

      if (result.error) {
        this.logger.error(`  Error: ${result.error}`);
      }

      // Log individual check results
      if (result.checkResults && result.checkResults.length > 0) {
        this.logger.debug(`Check details for ${name}:`);
        result.checkResults.forEach(check => {
          const symbol = check.passed ? '✅' : '❌';
          const message = `  ${symbol} ${check.description}`;

          if (check.passed) {
            this.logger.debug(message);
          } else {
            this.logger.error(message);
            if (check.error) {
              this.logger.error(`    Error: ${check.error}`);
            }
            this.logger.error(`    Expected: ${check.expectedValue}, Actual: ${check.actualValue}`);
          }
        });
      }
    }
  }
}
