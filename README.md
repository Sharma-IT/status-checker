# Status Checker

A lean, fast, and dependency-free TypeScript library for performing basic status checks on URLs. Check this [tutorial](https://code2tutorial.com/tutorial/d2c4b061-f52e-4b9e-9f4a-d5309865ee55/index.md) out, if you want to learn more about this tool.

## Features

- ✅ Zero external dependencies - uses only Node.js built-in modules
- ✅ Configurable via JSON configuration file
- ✅ Supports both synchronous and asynchronous operation modes
- ✅ Custom success criteria beyond just 200 OK responses
- ✅ Timeout handling for unresponsive URLs
- ✅ Detailed error reporting with status codes and messages
- ✅ Flexible logging (console and/or file)
- ✅ Simple CLI interface
- ✅ Minimal memory footprint and CPU usage
- ✅ Written in TypeScript with full type definitions

## Installation

```bash
# Install globally
npm install -g status-checker

# Or install locally
npm install status-checker
```

## Usage

### Command Line Interface

```bash
# Check URLs from a configuration file
status-checker config.json

# Check a single URL
status-checker --url https://example.com

# Check a single URL with a custom timeout
status-checker --url https://example.com --timeout 10000

# Check a URL with custom headers and success codes
status-checker --url https://api.github.com/users/Sharma-IT --header "User-Agent:StatusChecker/1.0" --success 200 --success 403

# Run checks synchronously
status-checker config.json --sync

# Suppress output except for errors
status-checker config.json --quiet

# Show help
status-checker --help

# Show version
status-checker --version
```

### Configuration File

The configuration file is a JSON file with the following structure:

```json
{
  "urls": [
    {
      "url": "https://example.com",
      "name": "Example Website",
      "timeout": 10000,
      "method": "GET",
      "headers": {
        "User-Agent": "StatusChecker/1.0"
      },
      "successCodes": [200, 301, 302],
      "checks": [
        {
          "type": "status_code",
          "operator": "equals",
          "value": "200|301|302"
        },
        {
          "type": "header",
          "name": "content-type",
          "operator": "contains",
          "value": "text/html"
        }
      ]
    }
  ],
  "globalTimeout": 5000,
  "globalSuccessCodes": [200],
  "logFile": "status-checker.log",
  "logLevel": "info"
}
```

#### URL Configuration Options

- `url` - The URL to check
- `name` - Optional friendly name for the URL
- `timeout` - Timeout in milliseconds (default: 5000)
- `method` - HTTP method to use (default: GET)
- `headers` - Headers to send with the request
- `body` - Request body for POST/PUT/PATCH requests
- `contentType` - Content type for the request body
- `successCodes` - Custom success status codes (deprecated, use checks instead)
- `checks` - Array of checks to perform on the response

#### Check Types

##### Status Code Check

```json
{
  "type": "status_code",
  "operator": "equals",
  "value": "200|301|302"
}
```

- `operator` - One of: `equals`, `not_equals`, `matches`, `not_matches`
- `value` - Status code(s) to check against (can be a single code, multiple codes separated by |, or a regex pattern)

##### Header Check

```json
{
  "type": "header",
  "name": "content-type",
  "operator": "contains",
  "value": "application/json"
}
```

- `name` - Header name to check
- `operator` - One of: `equals`, `not_equals`, `contains`, `not_contains`, `matches`, `not_matches`, `exists`, `not_exists`
- `value` - Value to compare against (not needed for exists/not_exists)

##### Body Check

```json
{
  "type": "body",
  "operator": "contains",
  "value": "Example Domain"
}
```

- `operator` - One of: `equals`, `not_equals`, `contains`, `not_contains`, `matches`, `not_matches`, `exists`, `not_exists`
- `value` - Value to compare against (not needed for exists/not_exists)

##### JSON Path Check

```json
{
  "type": "jsonpath",
  "path": "user.name",
  "operator": "equals",
  "value": "John Doe",
  "element": "first"
}
```

- `path` - JSON path expression
- `operator` - One of: `equals`, `not_equals`, `contains`, `not_contains`, `matches`, `not_matches`, `exists`, `not_exists`, `greater_than`, `less_than`
- `value` - Value to compare against (not needed for exists/not_exists)
- `element` - For array results, which element to check: `first` (default), `last`, `any`, `all`, or a number

##### Response Time Check

```json
{
  "type": "response_time",
  "operator": "less_than",
  "value": 1000
}
```

- `operator` - One of: `less_than`, `greater_than`
- `value` - Time in milliseconds

### Programmatic Usage

```typescript
import { checkUrls, checkUrl, StatusChecker, Config, Check } from 'status-checker';

// Check URLs from a configuration file
async function checkFromConfig() {
  try {
    const results = await checkUrls('config.json', { async: true });
    console.log(`${results.filter(r => r.success).length} of ${results.length} checks passed`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Check a single URL
async function checkSingleUrl() {
  try {
    const result = await checkUrl('https://example.com', 5000, [200]);
    console.log(`Check ${result.success ? 'passed' : 'failed'}: ${result.url}`);
    if (!result.success) {
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Check a URL with advanced checks
async function checkWithAdvancedChecks() {
  try {
    // Define checks
    const checks: Check[] = [
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
        path: 'user.name',
        operator: 'equals',
        value: 'John Doe'
      }
    ];

    // Create configuration
    const config: Config = {
      urls: [
        {
          url: 'https://api.example.com/users/123',
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token123',
            'Accept': 'application/json'
          },
          checks
        }
      ]
    };

    // Create checker and run checks
    const checker = new StatusChecker(config);
    const results = await checker.checkAll();

    // Process results
    for (const result of results) {
      console.log(`Check ${result.success ? 'passed' : 'failed'}: ${result.url}`);

      if (result.checkResults) {
        for (const check of result.checkResults) {
          console.log(`  - ${check.description}: ${check.passed ? 'Passed' : 'Failed'}`);
          if (!check.passed) {
            console.log(`    Expected: ${check.expectedValue}, Actual: ${check.actualValue}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}
```

## API Reference

### `checkUrls(configPath, options?)`

Checks all URLs in the specified configuration file.

- `configPath` - Path to the configuration file
- `options` - Optional checker options
  - `async` - Whether to run checks asynchronously (default: `true`)
  - `log` - Whether to log results (default: `true`)
  - `logger` - Custom logger function

Returns a Promise resolving to an array of check results.

### `checkUrl(url, timeout?, successCodes?)`

Checks a single URL.

- `url` - URL to check
- `timeout` - Timeout in milliseconds (default: `5000`)
- `successCodes` - Array of success status codes (default: `[200]`)

Returns a Promise resolving to a check result.

### `StatusChecker`

Class for checking URLs.

```typescript
import { StatusChecker, Config } from 'status-checker';

const config: Config = {
  urls: [{ url: 'https://example.com' }],
  globalTimeout: 5000
};

const checker = new StatusChecker(config, { async: true, log: true });
const results = await checker.checkAll();
```

### `ConfigLoader`

Class for loading and validating configuration files.

```typescript
import { ConfigLoader } from 'status-checker';

const configLoader = new ConfigLoader();
const config = configLoader.loadConfig('config.json');
```

### `Logger`

Class for logging messages.

```typescript
import { Logger } from 'status-checker';

const logger = new Logger('info');
logger.info('This is an info message');
logger.error('This is an error message');
```

## Testing

The library includes a comprehensive test suite to ensure all functionality works as expected:

```bash
# Run basic tests
npm test

# Run advanced tests (includes HTTP server for controlled testing)
npm run test:advanced

# Run evaluator unit tests
npm run test:evaluator

# Run all tests
npm run test:all
```

The test suite includes:

- **Basic Tests**: Tests for core functionality like URL checking, configuration loading, and error handling
- **Advanced Tests**: Tests for all check types using a local HTTP server for controlled testing
- **Evaluator Tests**: Unit tests for the CheckEvaluator class that handles different check types
- **Real-world API Tests**: Tests against real APIs like GitHub and JSONPlaceholder

## License

MIT
