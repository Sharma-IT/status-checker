import {
  Check,
  StatusCodeCheck,
  HeaderCheck,
  BodyCheck,
  JsonPathCheck,
  ResponseTimeCheck,
  IndividualCheckResult
} from './types';

/**
 * Response data from an HTTP request
 */
interface ResponseData {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
}

/**
 * Check evaluator for evaluating different types of checks
 */
export class CheckEvaluator {
  /**
   * Evaluate all checks against a response
   * @param checks Array of checks to evaluate
   * @param response Response data
   * @returns Array of check results
   */
  evaluateChecks(checks: Check[], response: ResponseData): IndividualCheckResult[] {
    return checks.map(check => this.evaluateCheck(check, response));
  }

  /**
   * Evaluate a single check against a response
   * @param check Check to evaluate
   * @param response Response data
   * @returns Check result
   */
  evaluateCheck(check: Check, response: ResponseData): IndividualCheckResult {
    switch (check.type) {
      case 'status_code':
        return this.evaluateStatusCodeCheck(check, response);
      case 'header':
        return this.evaluateHeaderCheck(check, response);
      case 'body':
        return this.evaluateBodyCheck(check, response);
      case 'jsonpath':
        return this.evaluateJsonPathCheck(check, response);
      case 'response_time':
        return this.evaluateResponseTimeCheck(check, response);
      default:
        return {
          type: 'unknown',
          description: 'Unknown check type',
          passed: false,
          error: `Unknown check type: ${(check as any).type}`
        };
    }
  }

  /**
   * Evaluate a status code check
   * @param check Status code check
   * @param response Response data
   * @returns Check result
   */
  private evaluateStatusCodeCheck(check: StatusCodeCheck, response: ResponseData): IndividualCheckResult {
    const { statusCode } = response;
    const { operator, value } = check;

    let passed = false;
    let error = '';

    try {
      switch (operator) {
        case 'equals':
          // Handle multiple status codes separated by |
          const codes = value.split('|').map(code => parseInt(code.trim(), 10));
          passed = codes.includes(statusCode);
          break;
        case 'not_equals':
          const notCodes = value.split('|').map(code => parseInt(code.trim(), 10));
          passed = !notCodes.includes(statusCode);
          break;
        case 'matches':
          const regex = new RegExp(value);
          passed = regex.test(statusCode.toString());
          break;
        case 'not_matches':
          const notRegex = new RegExp(value);
          passed = !notRegex.test(statusCode.toString());
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      passed = false;
    }

    return {
      type: 'status_code',
      description: `Status code ${operator} ${value}`,
      passed,
      error: error || undefined,
      actualValue: statusCode,
      expectedValue: value
    };
  }

  /**
   * Evaluate a header check
   * @param check Header check
   * @param response Response data
   * @returns Check result
   */
  private evaluateHeaderCheck(check: HeaderCheck, response: ResponseData): IndividualCheckResult {
    const { headers } = response;
    const { name, operator, value } = check;

    // Headers are case-insensitive
    const headerName = name.toLowerCase();

    // Find the header value
    let headerValue: string | undefined;
    for (const [key, val] of Object.entries(headers)) {
      if (key.toLowerCase() === headerName) {
        headerValue = val;
        break;
      }
    }

    let passed = false;
    let error = '';

    try {
      switch (operator) {
        case 'exists':
          passed = headerValue !== undefined;
          break;
        case 'not_exists':
          passed = headerValue === undefined;
          break;
        case 'equals':
          passed = headerValue === value;
          break;
        case 'not_equals':
          passed = headerValue !== value;
          break;
        case 'contains':
          passed = headerValue !== undefined && headerValue.includes(value || '');
          break;
        case 'not_contains':
          passed = headerValue === undefined || !headerValue.includes(value || '');
          break;
        case 'matches':
          const regex = new RegExp(value || '');
          passed = headerValue !== undefined && regex.test(headerValue);
          break;
        case 'not_matches':
          const notRegex = new RegExp(value || '');
          passed = headerValue === undefined || !notRegex.test(headerValue);
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      passed = false;
    }

    return {
      type: 'header',
      description: `Header ${name} ${operator} ${value || ''}`,
      passed,
      error: error || undefined,
      actualValue: headerValue,
      expectedValue: value
    };
  }

  /**
   * Evaluate a body check
   * @param check Body check
   * @param response Response data
   * @returns Check result
   */
  private evaluateBodyCheck(check: BodyCheck, response: ResponseData): IndividualCheckResult {
    const { body } = response;
    const { operator, value } = check;

    let passed = false;
    let error = '';

    try {
      switch (operator) {
        case 'exists':
          passed = body !== undefined && body.length > 0;
          break;
        case 'not_exists':
          passed = body === undefined || body.length === 0;
          break;
        case 'equals':
          passed = body === value;
          break;
        case 'not_equals':
          passed = body !== value;
          break;
        case 'contains':
          passed = body.includes(value || '');
          break;
        case 'not_contains':
          passed = !body.includes(value || '');
          break;
        case 'matches':
          const regex = new RegExp(value || '');
          passed = regex.test(body);
          break;
        case 'not_matches':
          const notRegex = new RegExp(value || '');
          passed = !notRegex.test(body);
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      passed = false;
    }

    return {
      type: 'body',
      description: `Body ${operator} ${value || ''}`,
      passed,
      error: error || undefined,
      actualValue: body.length > 100 ? `${body.substring(0, 100)}...` : body,
      expectedValue: value
    };
  }

  /**
   * Evaluate a JSON path check
   * @param check JSON path check
   * @param response Response data
   * @returns Check result
   */
  private evaluateJsonPathCheck(check: JsonPathCheck, response: ResponseData): IndividualCheckResult {
    const { body } = response;
    const { path, operator, value, element = 'first' } = check;

    let passed = false;
    let error = '';
    let actualValue: any = null;

    try {
      // Parse JSON body
      const jsonBody = JSON.parse(body);

      // Extract value using JSON path
      const extractedValue = this.extractJsonPath(jsonBody, path);

      // Handle array results based on element parameter
      if (Array.isArray(extractedValue)) {
        if (typeof element === 'number') {
          // Get specific index
          actualValue = extractedValue[element];
        } else if (element === 'first') {
          actualValue = extractedValue[0];
        } else if (element === 'last') {
          actualValue = extractedValue[extractedValue.length - 1];
        } else if (element === 'any' || element === 'all') {
          // For 'any' and 'all', we'll evaluate each element
          const results = extractedValue.map(item =>
            this.compareValues(item, operator, value)
          );

          passed = element === 'any'
            ? results.some(result => result)
            : results.every(result => result);

          actualValue = extractedValue;
          return {
            type: 'jsonpath',
            description: `JSON path ${path} ${element} ${operator} ${value || ''}`,
            passed,
            error: error || undefined,
            actualValue: JSON.stringify(actualValue),
            expectedValue: value
          };
        }
      } else {
        actualValue = extractedValue;
      }

      // For contains/not_contains with objects, convert to string
      if ((operator === 'contains' || operator === 'not_contains') &&
          typeof actualValue === 'object' && actualValue !== null) {
        actualValue = JSON.stringify(actualValue);
      }

      // Compare the extracted value
      passed = this.compareValues(actualValue, operator, value);

    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      passed = false;
    }

    return {
      type: 'jsonpath',
      description: `JSON path ${path} ${operator} ${value || ''}`,
      passed,
      error: error || undefined,
      actualValue: typeof actualValue === 'object' ? JSON.stringify(actualValue) : actualValue,
      expectedValue: value
    };
  }

  /**
   * Evaluate a response time check
   * @param check Response time check
   * @param response Response data
   * @returns Check result
   */
  private evaluateResponseTimeCheck(check: ResponseTimeCheck, response: ResponseData): IndividualCheckResult {
    const { responseTime } = response;
    const { operator, value } = check;

    let passed = false;

    switch (operator) {
      case 'less_than':
        passed = responseTime < value;
        break;
      case 'greater_than':
        passed = responseTime > value;
        break;
    }

    return {
      type: 'response_time',
      description: `Response time ${operator} ${value}ms`,
      passed,
      actualValue: responseTime,
      expectedValue: value
    };
  }

  /**
   * Extract a value from a JSON object using a JSON path expression
   * @param json JSON object
   * @param path JSON path expression
   * @returns Extracted value
   */
  private extractJsonPath(json: any, path: string): any {
    // Simple JSON path implementation
    // Supports basic paths like $.name, $[0].name, etc.

    // Remove leading $ if present
    const normalizedPath = path.startsWith('$') ? path.substring(1) : path;

    // Split path into segments
    const segments = normalizedPath
      .replace(/\[(\w+)\]/g, '.$1') // Convert [0] to .0
      .replace(/^\./, '') // Remove leading dot
      .split('.');

    // Traverse the object
    let current = json;
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }

      current = current[segment];
    }

    return current;
  }

  /**
   * Compare values using the specified operator
   * @param actual Actual value
   * @param operator Comparison operator
   * @param expected Expected value
   * @returns Whether the comparison passed
   */
  private compareValues(actual: any, operator: string, expected?: string): boolean {
    switch (operator) {
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'not_exists':
        return actual === undefined || actual === null;
      case 'equals':
        return String(actual) === expected;
      case 'not_equals':
        return String(actual) !== expected;
      case 'contains':
        return String(actual).includes(expected || '');
      case 'not_contains':
        return !String(actual).includes(expected || '');
      case 'matches':
        const regex = new RegExp(expected || '');
        return regex.test(String(actual));
      case 'not_matches':
        const notRegex = new RegExp(expected || '');
        return !notRegex.test(String(actual));
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      default:
        return false;
    }
  }
}
