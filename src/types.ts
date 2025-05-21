/**
 * Comparison operator for checks
 */
export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'matches'
  | 'not_matches'
  | 'greater_than'
  | 'less_than'
  | 'exists'
  | 'not_exists';

/**
 * Check type for status code validation
 */
export interface StatusCodeCheck {
  /** Type of check */
  type: 'status_code';
  /** Operator for comparison */
  operator: 'equals' | 'not_equals' | 'matches' | 'not_matches';
  /** Value to compare against (can be a single code, multiple codes separated by |, or a regex pattern) */
  value: string;
}

/**
 * Check type for header validation
 */
export interface HeaderCheck {
  /** Type of check */
  type: 'header';
  /** Header name to check */
  name: string;
  /** Operator for comparison */
  operator: ComparisonOperator;
  /** Value to compare against */
  value?: string;
}

/**
 * Check type for body content validation
 */
export interface BodyCheck {
  /** Type of check */
  type: 'body';
  /** Operator for comparison */
  operator: ComparisonOperator;
  /** Value to compare against */
  value?: string;
}

/**
 * Check type for JSON path validation
 */
export interface JsonPathCheck {
  /** Type of check */
  type: 'jsonpath';
  /** JSON path expression */
  path: string;
  /** Operator for comparison */
  operator: ComparisonOperator;
  /** Value to compare against */
  value?: string;
  /** For array results, which element to check (default: first) */
  element?: 'first' | 'last' | 'any' | 'all' | number;
}

/**
 * Check type for response time validation
 */
export interface ResponseTimeCheck {
  /** Type of check */
  type: 'response_time';
  /** Operator for comparison */
  operator: 'less_than' | 'greater_than';
  /** Value to compare against (in milliseconds) */
  value: number;
}

/**
 * Union type for all check types
 */
export type Check =
  | StatusCodeCheck
  | HeaderCheck
  | BodyCheck
  | JsonPathCheck
  | ResponseTimeCheck;

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
  /** Custom success status codes (default: [200]) - deprecated, use checks instead */
  successCodes?: number[];
  /** Headers to send with the request */
  headers?: Record<string, string>;
  /** HTTP method to use (default: GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** Request body for POST/PUT/PATCH requests */
  body?: string;
  /** Content type for the request body */
  contentType?: string;
  /** Array of checks to perform on the response */
  checks?: Check[];
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
 * Result of an individual check
 */
export interface IndividualCheckResult {
  /** Type of check */
  type: string;
  /** Description of the check */
  description: string;
  /** Whether the check passed */
  passed: boolean;
  /** Error message (if any) */
  error?: string;
  /** Actual value found */
  actualValue?: string | number | boolean | null;
  /** Expected value */
  expectedValue?: string | number | boolean | null;
}

/**
 * Result of a URL check
 */
export interface CheckResult {
  /** The URL that was checked */
  url: string;
  /** The name of the URL (if provided) */
  name?: string;
  /** Whether the check was successful (all checks passed) */
  success: boolean;
  /** HTTP status code (if available) */
  statusCode?: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Response body (if available and not too large) */
  body?: string;
  /** Error message (if any) */
  error?: string;
  /** Response time in milliseconds */
  responseTime: number;
  /** Timestamp of the check */
  timestamp: Date;
  /** Results of individual checks */
  checkResults?: IndividualCheckResult[];
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
