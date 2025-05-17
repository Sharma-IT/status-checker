import fs from 'fs';
import path from 'path';
import { checkUrls, checkUrl, Logger } from './index';

const logger = new Logger('info');

/**
 * Run tests for the status checker
 */
async function runTests(): Promise<void> {
  logger.info('Running Status Checker tests...');
  
  // Test single URL check
  await testSingleUrlCheck();
  
  // Test configuration file
  await testConfigFile();
  
  // Test error handling
  await testErrorHandling();
  
  logger.info('All tests completed!');
}

/**
 * Test checking a single URL
 */
async function testSingleUrlCheck(): Promise<void> {
  logger.info('\n=== Testing single URL check ===');
  
  try {
    // Test with a reliable URL
    logger.info('Testing with a reliable URL (example.com)...');
    const result1 = await checkUrl('https://example.com');
    logger.info(`Result: ${result1.success ? 'Success' : 'Failure'} - Status: ${result1.statusCode}`);
    
    // Test with a non-existent domain
    logger.info('Testing with a non-existent domain...');
    const result2 = await checkUrl('https://this-domain-does-not-exist-123456789.com');
    logger.info(`Result: ${result2.success ? 'Success' : 'Failure'} - Error: ${result2.error}`);
    
    // Test with a timeout
    logger.info('Testing with a short timeout...');
    const result3 = await checkUrl('https://example.com', 1); // 1ms timeout should fail
    logger.info(`Result: ${result3.success ? 'Success' : 'Failure'} - Error: ${result3.error}`);
    
    // Test with custom success codes
    logger.info('Testing with custom success codes...');
    const result4 = await checkUrl('https://httpstat.us/404', 5000, [404]);
    logger.info(`Result: ${result4.success ? 'Success' : 'Failure'} - Status: ${result4.statusCode}`);
    
  } catch (error) {
    logger.error(`Test failed: ${error}`);
  }
}

/**
 * Test checking URLs from a configuration file
 */
async function testConfigFile(): Promise<void> {
  logger.info('\n=== Testing configuration file ===');
  
  try {
    // Create a temporary test configuration
    const configPath = path.resolve(__dirname, '../test-config.json');
    const config = {
      urls: [
        { url: 'https://example.com', name: 'Example' },
        { url: 'https://httpstat.us/200', name: 'HTTP 200' },
        { url: 'https://httpstat.us/404', name: 'HTTP 404' },
        { url: 'https://httpstat.us/500', name: 'HTTP 500' }
      ],
      globalTimeout: 5000,
      globalSuccessCodes: [200],
      logLevel: 'info'
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info(`Created test configuration at ${configPath}`);
    
    // Test with async mode
    logger.info('Testing with async mode...');
    const asyncResults = await checkUrls(configPath, { async: true });
    logger.info(`Async results: ${asyncResults.filter(r => r.success).length} succeeded, ${asyncResults.filter(r => !r.success).length} failed`);
    
    // Test with sync mode
    logger.info('Testing with sync mode...');
    const syncResults = await checkUrls(configPath, { async: false });
    logger.info(`Sync results: ${syncResults.filter(r => r.success).length} succeeded, ${syncResults.filter(r => !r.success).length} failed`);
    
    // Clean up
    fs.unlinkSync(configPath);
    logger.info('Removed test configuration file');
    
  } catch (error) {
    logger.error(`Test failed: ${error}`);
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(): Promise<void> {
  logger.info('\n=== Testing error handling ===');
  
  try {
    // Test with non-existent configuration file
    logger.info('Testing with non-existent configuration file...');
    try {
      await checkUrls('non-existent-config.json');
    } catch (error) {
      logger.info(`Expected error caught: ${error}`);
    }
    
    // Test with invalid URL
    logger.info('Testing with invalid URL...');
    try {
      await checkUrl('not-a-valid-url');
    } catch (error) {
      logger.info(`Expected error caught: ${error}`);
    }
    
  } catch (error) {
    logger.error(`Test failed: ${error}`);
  }
}

// Run the tests
runTests().catch(error => {
  logger.error(`Unhandled error: ${error}`);
  process.exit(1);
});
