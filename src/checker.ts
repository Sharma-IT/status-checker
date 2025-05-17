import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Config, UrlConfig, CheckResult, CheckerOptions } from './types';
import { Logger } from './logger';

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
    const successCodes = urlConfig.successCodes || this.config.globalSuccessCodes || [200];
    
    this.logger.debug(`Checking URL: ${url} (${name})`);
    
    try {
      const result = await this.makeRequest(url, timeout, urlConfig.headers);
      const responseTime = Date.now() - startTime;
      const success = successCodes.includes(result.statusCode);
      
      const checkResult: CheckResult = {
        url,
        name,
        success,
        statusCode: result.statusCode,
        responseTime,
        timestamp: new Date()
      };
      
      if (!success) {
        checkResult.error = `Unexpected status code: ${result.statusCode}`;
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
   * @param url URL to request
   * @param timeout Timeout in milliseconds
   * @param headers Headers to send
   * @returns Promise resolving to the response
   */
  private makeRequest(url: string, timeout: number, headers?: Record<string, string>): Promise<{ statusCode: number }> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout,
        headers: headers || {}
      };
      
      const requestModule = isHttps ? https : http;
      
      const req = requestModule.request(options, (res) => {
        resolve({ statusCode: res.statusCode || 0 });
        
        // Consume response data to free up memory
        res.resume();
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timed out after ${timeout}ms`));
      });
      
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
    } else {
      this.logger.error(`❌ ${name} - Error: ${result.error} - Response time: ${result.responseTime}ms`);
    }
  }
}
