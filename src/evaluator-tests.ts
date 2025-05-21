import { CheckEvaluator } from './evaluator';
import {
  StatusCodeCheck,
  HeaderCheck,
  BodyCheck,
  JsonPathCheck,
  ResponseTimeCheck,
  IndividualCheckResult
} from './types';
import { Logger } from './logger';

const logger = new Logger('info');

/**
 * Run unit tests for the CheckEvaluator
 */
export async function runEvaluatorTests(): Promise<void> {
  logger.info('Running CheckEvaluator Unit Tests...');

  // Test status code checks
  testStatusCodeChecks();

  // Test header checks
  testHeaderChecks();

  // Test body checks
  testBodyChecks();

  // Test JSON path checks
  testJsonPathChecks();

  // Test response time checks
  testResponseTimeChecks();

  // Test multiple checks
  testMultipleChecks();

  logger.info('All evaluator tests completed!');
}

/**
 * Test status code checks
 */
function testStatusCodeChecks(): void {
  logger.info('\n=== Testing Status Code Checks ===');

  const evaluator = new CheckEvaluator();
  const mockResponse = {
    statusCode: 200,
    headers: {},
    body: '',
    responseTime: 100
  };

  // Test equals operator
  const equalsCheck: StatusCodeCheck = {
    type: 'status_code',
    operator: 'equals',
    value: '200'
  };

  const equalsResult = evaluator.evaluateCheck(equalsCheck, mockResponse);
  logResult('Status Code Equals', equalsResult, true);

  // Test not_equals operator
  const notEqualsCheck: StatusCodeCheck = {
    type: 'status_code',
    operator: 'not_equals',
    value: '404'
  };

  const notEqualsResult = evaluator.evaluateCheck(notEqualsCheck, mockResponse);
  logResult('Status Code Not Equals', notEqualsResult, true);

  // Test matches operator
  const matchesCheck: StatusCodeCheck = {
    type: 'status_code',
    operator: 'matches',
    value: '2[0-9]{2}'
  };

  const matchesResult = evaluator.evaluateCheck(matchesCheck, mockResponse);
  logResult('Status Code Matches', matchesResult, true);

  // Test not_matches operator
  const notMatchesCheck: StatusCodeCheck = {
    type: 'status_code',
    operator: 'not_matches',
    value: '4[0-9]{2}'
  };

  const notMatchesResult = evaluator.evaluateCheck(notMatchesCheck, mockResponse);
  logResult('Status Code Not Matches', notMatchesResult, true);

  // Test multiple values
  const multipleCheck: StatusCodeCheck = {
    type: 'status_code',
    operator: 'equals',
    value: '200|201|202'
  };

  const multipleResult = evaluator.evaluateCheck(multipleCheck, mockResponse);
  logResult('Status Code Multiple Values', multipleResult, true);

  // Test failing check
  const failingCheck: StatusCodeCheck = {
    type: 'status_code',
    operator: 'equals',
    value: '404'
  };

  const failingResult = evaluator.evaluateCheck(failingCheck, mockResponse);
  logResult('Status Code Failing Check', failingResult, false);
}

/**
 * Test header checks
 */
function testHeaderChecks(): void {
  logger.info('\n=== Testing Header Checks ===');

  const evaluator = new CheckEvaluator();
  const mockResponse = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-custom-header': 'test-value'
    },
    body: '',
    responseTime: 100
  };

  // Test exists operator
  const existsCheck: HeaderCheck = {
    type: 'header',
    name: 'content-type',
    operator: 'exists'
  };

  const existsResult = evaluator.evaluateCheck(existsCheck, mockResponse);
  logResult('Header Exists', existsResult, true);

  // Test not_exists operator
  const notExistsCheck: HeaderCheck = {
    type: 'header',
    name: 'non-existent',
    operator: 'not_exists'
  };

  const notExistsResult = evaluator.evaluateCheck(notExistsCheck, mockResponse);
  logResult('Header Not Exists', notExistsResult, true);

  // Test equals operator
  const equalsCheck: HeaderCheck = {
    type: 'header',
    name: 'x-custom-header',
    operator: 'equals',
    value: 'test-value'
  };

  const equalsResult = evaluator.evaluateCheck(equalsCheck, mockResponse);
  logResult('Header Equals', equalsResult, true);

  // Test contains operator
  const containsCheck: HeaderCheck = {
    type: 'header',
    name: 'content-type',
    operator: 'contains',
    value: 'application/json'
  };

  const containsResult = evaluator.evaluateCheck(containsCheck, mockResponse);
  logResult('Header Contains', containsResult, true);

  // Test matches operator
  const matchesCheck: HeaderCheck = {
    type: 'header',
    name: 'content-type',
    operator: 'matches',
    value: 'application\\/.*utf-8'
  };

  const matchesResult = evaluator.evaluateCheck(matchesCheck, mockResponse);
  logResult('Header Matches', matchesResult, true);

  // Test failing check
  const failingCheck: HeaderCheck = {
    type: 'header',
    name: 'content-type',
    operator: 'equals',
    value: 'text/html'
  };

  const failingResult = evaluator.evaluateCheck(failingCheck, mockResponse);
  logResult('Header Failing Check', failingResult, false);
}

/**
 * Test body checks
 */
function testBodyChecks(): void {
  logger.info('\n=== Testing Body Checks ===');

  const evaluator = new CheckEvaluator();
  const mockResponse = {
    statusCode: 200,
    headers: {},
    body: '{"name":"John Doe","age":30,"active":true}',
    responseTime: 100
  };

  // Test exists operator
  const existsCheck: BodyCheck = {
    type: 'body',
    operator: 'exists'
  };

  const existsResult = evaluator.evaluateCheck(existsCheck, mockResponse);
  logResult('Body Exists', existsResult, true);

  // Test equals operator
  const equalsCheck: BodyCheck = {
    type: 'body',
    operator: 'equals',
    value: '{"name":"John Doe","age":30,"active":true}'
  };

  const equalsResult = evaluator.evaluateCheck(equalsCheck, mockResponse);
  logResult('Body Equals', equalsResult, true);

  // Test contains operator
  const containsCheck: BodyCheck = {
    type: 'body',
    operator: 'contains',
    value: 'John Doe'
  };

  const containsResult = evaluator.evaluateCheck(containsCheck, mockResponse);
  logResult('Body Contains', containsResult, true);

  // Test matches operator
  const matchesCheck: BodyCheck = {
    type: 'body',
    operator: 'matches',
    value: '.*"age":30.*'
  };

  const matchesResult = evaluator.evaluateCheck(matchesCheck, mockResponse);
  logResult('Body Matches', matchesResult, true);

  // Test failing check
  const failingCheck: BodyCheck = {
    type: 'body',
    operator: 'contains',
    value: 'Jane Smith'
  };

  const failingResult = evaluator.evaluateCheck(failingCheck, mockResponse);
  logResult('Body Failing Check', failingResult, false);
}

/**
 * Test JSON path checks
 */
function testJsonPathChecks(): void {
  logger.info('\n=== Testing JSON Path Checks ===');

  const evaluator = new CheckEvaluator();
  const mockResponse = {
    statusCode: 200,
    headers: {},
    body: JSON.stringify({
      name: 'John Doe',
      age: 30,
      address: {
        city: 'Sydney',
        country: 'Australia'
      },
      tags: ['developer', 'typescript'],
      active: true
    }),
    responseTime: 100
  };

  // Test simple path
  const simpleCheck: JsonPathCheck = {
    type: 'jsonpath',
    path: 'name',
    operator: 'equals',
    value: 'John Doe'
  };

  const simpleResult = evaluator.evaluateCheck(simpleCheck, mockResponse);
  logResult('JSON Path Simple', simpleResult, true);

  // Test nested path
  const nestedCheck: JsonPathCheck = {
    type: 'jsonpath',
    path: 'address.city',
    operator: 'equals',
    value: 'Sydney'
  };

  const nestedResult = evaluator.evaluateCheck(nestedCheck, mockResponse);
  logResult('JSON Path Nested', nestedResult, true);

  // Test array element
  const arrayCheck: JsonPathCheck = {
    type: 'jsonpath',
    path: 'tags[0]',
    operator: 'equals',
    value: 'developer'
  };

  const arrayResult = evaluator.evaluateCheck(arrayCheck, mockResponse);
  logResult('JSON Path Array', arrayResult, true);

  // Test exists operator
  const existsCheck: JsonPathCheck = {
    type: 'jsonpath',
    path: 'active',
    operator: 'exists'
  };

  const existsResult = evaluator.evaluateCheck(existsCheck, mockResponse);
  logResult('JSON Path Exists', existsResult, true);

  // Test contains operator
  const containsCheck: JsonPathCheck = {
    type: 'jsonpath',
    path: 'address.country',
    operator: 'contains',
    value: 'Austra'
  };

  const containsResult = evaluator.evaluateCheck(containsCheck, mockResponse);
  logResult('JSON Path Contains', containsResult, true);

  // Test failing check
  const failingCheck: JsonPathCheck = {
    type: 'jsonpath',
    path: 'name',
    operator: 'equals',
    value: 'Jane Smith'
  };

  const failingResult = evaluator.evaluateCheck(failingCheck, mockResponse);
  logResult('JSON Path Failing Check', failingResult, false);
}

/**
 * Test response time checks
 */
function testResponseTimeChecks(): void {
  logger.info('\n=== Testing Response Time Checks ===');

  const evaluator = new CheckEvaluator();
  const mockResponse = {
    statusCode: 200,
    headers: {},
    body: '',
    responseTime: 100
  };

  // Test less_than operator
  const lessThanCheck: ResponseTimeCheck = {
    type: 'response_time',
    operator: 'less_than',
    value: 200
  };

  const lessThanResult = evaluator.evaluateCheck(lessThanCheck, mockResponse);
  logResult('Response Time Less Than', lessThanResult, true);

  // Test greater_than operator
  const greaterThanCheck: ResponseTimeCheck = {
    type: 'response_time',
    operator: 'greater_than',
    value: 50
  };

  const greaterThanResult = evaluator.evaluateCheck(greaterThanCheck, mockResponse);
  logResult('Response Time Greater Than', greaterThanResult, true);

  // Test failing check
  const failingCheck: ResponseTimeCheck = {
    type: 'response_time',
    operator: 'less_than',
    value: 50
  };

  const failingResult = evaluator.evaluateCheck(failingCheck, mockResponse);
  logResult('Response Time Failing Check', failingResult, false);
}

/**
 * Test multiple checks
 */
function testMultipleChecks(): void {
  logger.info('\n=== Testing Multiple Checks ===');

  const evaluator = new CheckEvaluator();
  const mockResponse = {
    statusCode: 200,
    headers: {
      'content-type': 'application/json'
    },
    body: '{"name":"John Doe","age":30}',
    responseTime: 100
  };

  const checks = [
    {
      type: 'status_code',
      operator: 'equals',
      value: '200'
    } as StatusCodeCheck,
    {
      type: 'header',
      name: 'content-type',
      operator: 'contains',
      value: 'application/json'
    } as HeaderCheck,
    {
      type: 'jsonpath',
      path: 'name',
      operator: 'equals',
      value: 'John Doe'
    } as JsonPathCheck,
    {
      type: 'response_time',
      operator: 'less_than',
      value: 200
    } as ResponseTimeCheck
  ];

  const results = evaluator.evaluateChecks(checks, mockResponse);

  const allPassed = results.every(result => result.passed);
  logger.info(`Multiple Checks: ${allPassed ? 'All Passed' : 'Some Failed'}`);

  results.forEach((result, index) => {
    logger.info(`  Check ${index + 1}: ${result.passed ? 'Passed' : 'Failed'} - ${result.description}`);
  });
}

/**
 * Log a check result
 * @param name Test name
 * @param result Check result
 * @param expected Expected result
 */
function logResult(name: string, result: IndividualCheckResult, expected: boolean): void {
  const passed = result.passed === expected;

  if (passed) {
    logger.info(`${name}: Passed`);
  } else {
    logger.error(`${name}: Failed - Expected ${expected}, got ${result.passed}`);
    if (result.error) {
      logger.error(`  Error: ${result.error}`);
    }
    logger.error(`  Description: ${result.description}`);
    logger.error(`  Expected: ${result.expectedValue}, Actual: ${result.actualValue}`);
  }
}

// Run the tests
runEvaluatorTests().catch(error => {
  logger.error(`Unhandled error: ${error}`);
  process.exit(1);
});
