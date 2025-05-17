import fs from 'fs';
import path from 'path';
import { Config, UrlConfig } from './types';
import { Logger } from './logger';

/**
 * Configuration loader and validator
 */
export class ConfigLoader {
  private logger: Logger;

  /**
   * Create a new ConfigLoader
   * @param logger Logger instance
   */
  constructor(logger?: Logger) {
    this.logger = logger || new Logger('info');
  }

  /**
   * Load configuration from a file
   * @param filePath Path to the configuration file
   * @returns Parsed configuration
   */
  loadConfig(filePath: string): Config {
    try {
      // Resolve path
      const resolvedPath = path.resolve(filePath);
      this.logger.debug(`Loading configuration from ${resolvedPath}`);
      
      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Configuration file not found: ${resolvedPath}`);
      }
      
      // Read and parse file
      const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
      const config = JSON.parse(fileContent) as Config;
      
      // Validate configuration
      this.validateConfig(config);
      
      this.logger.info(`Successfully loaded configuration with ${config.urls.length} URLs`);
      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to load configuration: ${message}`);
      throw error;
    }
  }

  /**
   * Validate the configuration
   * @param config Configuration to validate
   */
  private validateConfig(config: Config): void {
    // Check if URLs array exists
    if (!config.urls || !Array.isArray(config.urls)) {
      throw new Error('Configuration must contain a "urls" array');
    }
    
    // Check if URLs array is not empty
    if (config.urls.length === 0) {
      throw new Error('Configuration must contain at least one URL');
    }
    
    // Validate each URL
    config.urls.forEach((urlConfig, index) => {
      this.validateUrlConfig(urlConfig, index);
    });
    
    // Set default values
    config.globalTimeout = config.globalTimeout || 5000;
    config.globalSuccessCodes = config.globalSuccessCodes || [200];
    config.logLevel = config.logLevel || 'info';
  }

  /**
   * Validate a URL configuration
   * @param urlConfig URL configuration to validate
   * @param index Index of the URL in the configuration
   */
  private validateUrlConfig(urlConfig: UrlConfig, index: number): void {
    // Check if URL exists
    if (!urlConfig.url) {
      throw new Error(`URL at index ${index} is missing the "url" property`);
    }
    
    // Check if URL is valid
    try {
      new URL(urlConfig.url);
    } catch (error) {
      throw new Error(`URL at index ${index} is invalid: ${urlConfig.url}`);
    }
    
    // Set default name if not provided
    if (!urlConfig.name) {
      urlConfig.name = `URL ${index + 1}`;
    }
  }
}
