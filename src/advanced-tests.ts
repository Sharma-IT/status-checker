import { StatusChecker, Config, Check, Logger, CheckResult } from './index';
import { CheckEvaluator } from './evaluator';
import http from 'http';
import { AddressInfo } from 'net';

const logger = new Logger('info');

/**
 * Run advanced tests for the status checker
 */
export async function runAdvancedTests(): Promise<void> {
  logger.info('Running Advanced Status Checker Tests...');

  // Start a test server for controlled testing
  const server = await startTestServer();
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  try {
    // Test status code checks
    await testStatusCodeChecks(baseUrl);

    // Test header checks
    await testHeaderChecks(baseUrl);

    // Test body checks
    await testBodyChecks(baseUrl);

    // Test JSON path checks
    await testJsonPathChecks(baseUrl);

    // Test response time checks
    await testResponseTimeChecks(baseUrl);

    // Test HTTP methods
    await testHttpMethods(baseUrl);

    // Test real-world API scenarios
    await testRealWorldScenarios();

    logger.info('All advanced tests completed!');
  } finally {
    // Shut down the test server
    server.close();
  }
}

/**
 * Start a test HTTP server
 * @returns HTTP server instance
 */
function startTestServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Parse URL path
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      const path = url.pathname;

      // Add a small delay to test response time checks
      const delay = parseInt(url.searchParams.get('delay') || '0', 10);

      setTimeout(() => {
        // Set default headers
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('X-Test-Header', 'test-value');

        // Handle different paths
        switch (path) {
          case '/status/200':
            res.statusCode = 200;
            res.end('OK');
            break;
          case '/status/404':
            res.statusCode = 404;
            res.end('Not Found');
            break;
          case '/status/500':
            res.statusCode = 500;
            res.end('Internal Server Error');
            break;
          case '/headers':
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Custom-Header', 'custom-value');
            res.statusCode = 200;
            res.end(JSON.stringify({ headers: req.headers }));
            break;
          case '/echo':
            // Echo back the request body
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                method: req.method,
                headers: req.headers,
                body: body
              }));
            });
            break;
          case '/json':
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              name: 'John Doe',
              age: 30,
              location: {
                city: 'Sydney',
                country: 'Australia'
              },
              tags: ['developer', 'typescript', 'testing'],
              active: true
            }));
            break;
          default:
            res.statusCode = 404;
            res.end('Not Found');
            break;
        }
      }, delay);
    });

    server.listen(0, () => {
      resolve(server);
    });
  });
}

/**
 * Test status code checks
 * @param baseUrl Base URL of the test server
 */
async function testStatusCodeChecks(baseUrl: string): Promise<void> {
  logger.info('\n=== Testing Status Code Checks ===');

  // Test equals operator
  await testCheck(
    `${baseUrl}/status/200`,
    'Status Code Equals',
    {
      type: 'status_code',
      operator: 'equals',
      value: '200'
    },
    true
  );

  // Test not_equals operator
  await testCheck(
    `${baseUrl}/status/404`,
    'Status Code Not Equals',
    {
      type: 'status_code',
      operator: 'not_equals',
      value: '200'
    },
    true
  );

  // Test matches operator with regex
  await testCheck(
    `${baseUrl}/status/200`,
    'Status Code Matches Regex',
    {
      type: 'status_code',
      operator: 'matches',
      value: '2[0-9]{2}'
    },
    true
  );

  // Test not_matches operator with regex
  await testCheck(
    `${baseUrl}/status/500`,
    'Status Code Not Matches Regex',
    {
      type: 'status_code',
      operator: 'not_matches',
      value: '2[0-9]{2}'
    },
    true
  );

  // Test multiple status codes with pipe
  await testCheck(
    `${baseUrl}/status/404`,
    'Status Code Multiple Values',
    {
      type: 'status_code',
      operator: 'equals',
      value: '200|404|500'
    },
    true
  );
}

/**
 * Test header checks
 * @param baseUrl Base URL of the test server
 */
async function testHeaderChecks(baseUrl: string): Promise<void> {
  logger.info('\n=== Testing Header Checks ===');

  // Test exists operator
  await testCheck(
    `${baseUrl}/headers`,
    'Header Exists',
    {
      type: 'header',
      name: 'content-type',
      operator: 'exists'
    },
    true
  );

  // Test not_exists operator
  await testCheck(
    `${baseUrl}/headers`,
    'Header Not Exists',
    {
      type: 'header',
      name: 'non-existent-header',
      operator: 'not_exists'
    },
    true
  );

  // Test equals operator
  await testCheck(
    `${baseUrl}/headers`,
    'Header Equals',
    {
      type: 'header',
      name: 'x-custom-header',
      operator: 'equals',
      value: 'custom-value'
    },
    true
  );

  // Test contains operator
  await testCheck(
    `${baseUrl}/headers`,
    'Header Contains',
    {
      type: 'header',
      name: 'content-type',
      operator: 'contains',
      value: 'application/json'
    },
    true
  );

  // Test matches operator
  await testCheck(
    `${baseUrl}/headers`,
    'Header Matches Regex',
    {
      type: 'header',
      name: 'content-type',
      operator: 'matches',
      value: 'application\\/.*'
    },
    true
  );
}

/**
 * Test body checks
 * @param baseUrl Base URL of the test server
 */
async function testBodyChecks(baseUrl: string): Promise<void> {
  logger.info('\n=== Testing Body Checks ===');

  // Test exists operator
  await testCheck(
    `${baseUrl}/status/200`,
    'Body Exists',
    {
      type: 'body',
      operator: 'exists'
    },
    true
  );

  // Test equals operator
  await testCheck(
    `${baseUrl}/status/200`,
    'Body Equals',
    {
      type: 'body',
      operator: 'equals',
      value: 'OK'
    },
    true
  );

  // Test contains operator
  await testCheck(
    `${baseUrl}/status/404`,
    'Body Contains',
    {
      type: 'body',
      operator: 'contains',
      value: 'Not Found'
    },
    true
  );

  // Test matches operator
  await testCheck(
    `${baseUrl}/status/500`,
    'Body Matches Regex',
    {
      type: 'body',
      operator: 'matches',
      value: 'Internal.*Error'
    },
    true
  );

  // Test not_contains operator
  await testCheck(
    `${baseUrl}/status/200`,
    'Body Not Contains',
    {
      type: 'body',
      operator: 'not_contains',
      value: 'Error'
    },
    true
  );
}

/**
 * Test JSON path checks
 * @param baseUrl Base URL of the test server
 */
async function testJsonPathChecks(baseUrl: string): Promise<void> {
  logger.info('\n=== Testing JSON Path Checks ===');

  // Test simple path with equals
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Simple Equals',
    {
      type: 'jsonpath',
      path: 'name',
      operator: 'equals',
      value: 'John Doe'
    },
    true
  );

  // Test nested path
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Nested',
    {
      type: 'jsonpath',
      path: 'location.city',
      operator: 'equals',
      value: 'Sydney'
    },
    true
  );

  // Test array element
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Array Element',
    {
      type: 'jsonpath',
      path: 'tags[0]',
      operator: 'equals',
      value: 'developer'
    },
    true
  );

  // Test exists operator
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Exists',
    {
      type: 'jsonpath',
      path: 'active',
      operator: 'exists'
    },
    true
  );

  // Test contains operator
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Contains',
    {
      type: 'jsonpath',
      path: 'location.country',
      operator: 'contains',
      value: 'Austra'
    },
    true
  );

  // Test greater_than operator
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Greater Than',
    {
      type: 'jsonpath',
      path: 'age',
      operator: 'greater_than',
      value: '25'
    },
    true
  );

  // Test less_than operator
  await testCheck(
    `${baseUrl}/json`,
    'JSON Path Less Than',
    {
      type: 'jsonpath',
      path: 'age',
      operator: 'less_than',
      value: '35'
    },
    true
  );
}

/**
 * Test response time checks
 * @param baseUrl Base URL of the test server
 */
async function testResponseTimeChecks(baseUrl: string): Promise<void> {
  logger.info('\n=== Testing Response Time Checks ===');

  // Test less_than operator with fast response
  await testCheck(
    `${baseUrl}/status/200`,
    'Response Time Less Than',
    {
      type: 'response_time',
      operator: 'less_than',
      value: 1000
    },
    true
  );

  // Test greater_than operator with delayed response
  await testCheck(
    `${baseUrl}/status/200?delay=100`,
    'Response Time Greater Than',
    {
      type: 'response_time',
      operator: 'greater_than',
      value: 50
    },
    true
  );
}

/**
 * Test HTTP methods
 * @param baseUrl Base URL of the test server
 */
async function testHttpMethods(baseUrl: string): Promise<void> {
  logger.info('\n=== Testing HTTP Methods ===');

  // Test POST method
  const config: Config = {
    urls: [
      {
        url: `${baseUrl}/echo`,
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify({ test: 'value' }),
        checks: [
          {
            type: 'status_code',
            operator: 'equals',
            value: '200'
          },
          {
            type: 'jsonpath',
            path: 'method',
            operator: 'equals',
            value: 'POST'
          },
          {
            type: 'jsonpath',
            path: 'body',
            operator: 'contains',
            value: 'test'
          }
        ]
      }
    ]
  };

  const checker = new StatusChecker(config);
  const results = await checker.checkAll();

  logger.info(`POST Method Test: ${results[0].success ? 'Passed' : 'Failed'}`);
  if (!results[0].success && results[0].error) {
    logger.error(`Error: ${results[0].error}`);
  }
}

/**
 * Test real-world API scenarios
 */
async function testRealWorldScenarios(): Promise<void> {
  logger.info('\n=== Testing Real-World API Scenarios ===');

  // Test GitHub API
  const githubConfig: Config = {
    urls: [
      {
        url: 'https://api.github.com/users/Sharma-IT',
        name: 'GitHub API Test',
        headers: {
          'User-Agent': 'StatusChecker/1.0',
          'Accept': 'application/vnd.github.v3+json'
        },
        checks: [
          {
            type: 'status_code',
            operator: 'equals',
            value: '200'
          },
          {
            type: 'header',
            name: 'content-type',
            operator: 'contains',
            value: 'application/json'
          },
          {
            type: 'jsonpath',
            path: 'login',
            operator: 'equals',
            value: 'Sharma-IT'
          }
        ]
      }
    ]
  };

  const githubChecker = new StatusChecker(githubConfig);
  const githubResults = await githubChecker.checkAll();

  logger.info(`GitHub API Test: ${githubResults[0].success ? 'Passed' : 'Failed'}`);
  if (!githubResults[0].success && githubResults[0].error) {
    logger.error(`Error: ${githubResults[0].error}`);
  }

  // Test JSONPlaceholder API
  const jsonPlaceholderConfig: Config = {
    urls: [
      {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        name: 'JSONPlaceholder API Test',
        checks: [
          {
            type: 'status_code',
            operator: 'equals',
            value: '200'
          },
          {
            type: 'jsonpath',
            path: 'id',
            operator: 'equals',
            value: '1'
          },
          {
            type: 'jsonpath',
            path: 'userId',
            operator: 'exists'
          }
        ]
      }
    ]
  };

  const jsonPlaceholderChecker = new StatusChecker(jsonPlaceholderConfig);
  const jsonPlaceholderResults = await jsonPlaceholderChecker.checkAll();

  logger.info(`JSONPlaceholder API Test: ${jsonPlaceholderResults[0].success ? 'Passed' : 'Failed'}`);
  if (!jsonPlaceholderResults[0].success && jsonPlaceholderResults[0].error) {
    logger.error(`Error: ${jsonPlaceholderResults[0].error}`);
  }
}

/**
 * Test a single check
 * @param url URL to check
 * @param name Test name
 * @param check Check to perform
 * @param expectedResult Expected result
 */
async function testCheck(url: string, name: string, check: Check, expectedResult: boolean): Promise<void> {
  const config: Config = {
    urls: [
      {
        url,
        name,
        checks: [check]
      }
    ]
  };

  const checker = new StatusChecker(config);
  const results = await checker.checkAll();
  const result = results[0];

  logger.info(`${name}: ${result.success === expectedResult ? 'Passed' : 'Failed'}`);
  if (result.success !== expectedResult) {
    logger.error(`Expected ${expectedResult}, got ${result.success}`);
    if (result.error) {
      logger.error(`Error: ${result.error}`);
    }
  }
}

// Run the tests
runAdvancedTests().catch(error => {
  logger.error(`Unhandled error: ${error}`);
  process.exit(1);
});
