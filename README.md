# Status Checker

A lean, fast, and dependency-free TypeScript library for performing basic status checks on URLs.

## Features
- Zero external dependencies - uses only Node.js built-in modules
- Configurable via JSON configuration file
- Supports both synchronous and asynchronous operation modes
- Custom success criteria beyond just 200 OK responses
- Timeout handling for unresponsive URLs
- Detailed error reporting with status codes and messages
- Flexible logging (console and/or file)
- Simple CLI interface
- Minimal memory footprint and CPU usage
- Written in TypeScript with full type definitions

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

## Configuration

The application uses a JSON configuration file. See [example-config.json](example-config.json) for a complete example.

### Configuration Options

```json
{
  "urls": [              // Array of URL objects to check
    {
      "url": string,    // URL to check
      "name": string,   // Display name for the URL
      "timeout": number,      // Optional: timeout in ms (overrides global)
      "successCodes": number[],  // Optional: valid status codes (overrides global)
      "headers": {      // Optional: custom request headers
        "header": "value"
      }
    }
  ],
  "globalTimeout": number,    // Default timeout in milliseconds
  "globalSuccessCodes": number[],  // Default acceptable status codes
  "logFile": string,         // Path to log file
  "logLevel": string         // Logging level (debug, info, warn, error)
}
```

For a complete working example, check the [example-config.json](example-config.json) file.

### Programmatic Usage

```typescript
import { checkUrls, checkUrl } from 'status-checker';

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

## License

MIT
