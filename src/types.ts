/**
 * Configuration for a URL to check
 */
export interface UrlConfig {
  /** The URL to check */
  url: string;
  /** Optional friendly name for the URL */
  name?: string;
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Custom success status codes (default: [200]) */
  successCodes?: number[];
  /** Headers to send with the request */
  headers?: Record<string, string>;
}

/**
 * Configuration file structure
 */
export interface Config {
  /** Array of URLs to check */
  urls: UrlConfig[];
  /** Global timeout in milliseconds (default: 5000) */
  globalTimeout?: number;
  /** Global success status codes (default: [200]) */
  globalSuccessCodes?: number[];
  /** Log file path (optional) */
  logFile?: string;
  /** Log level (default: 'info') */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Result of a URL check
 */
export interface CheckResult {
  /** The URL that was checked */
  url: string;
  /** The name of the URL (if provided) */
  name?: string;
  /** Whether the check was successful */
  success: boolean;
  /** HTTP status code (if available) */
  statusCode?: number;
  /** Error message (if any) */
  error?: string;
  /** Response time in milliseconds */
  responseTime: number;
  /** Timestamp of the check */
  timestamp: Date;
}

/**
 * Options for the checker
 */
export interface CheckerOptions {
  /** Whether to run checks asynchronously (default: true) */
  async?: boolean;
  /** Whether to log results (default: true) */
  log?: boolean;
  /** Custom logger function */
  logger?: (message: string, level: string) => void;
}
