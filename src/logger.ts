import fs from 'fs';
import path from 'path';
import { Config } from './types';

/**
 * Logger class for handling log messages
 */
export class Logger {
  private logFile?: string;
  private logLevel: string;
  private logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  /**
   * Create a new Logger instance
   * @param config Configuration object or log level string
   */
  constructor(config?: Config | string) {
    if (typeof config === 'string') {
      this.logLevel = config;
      this.logFile = undefined;
    } else if (config) {
      this.logLevel = config.logLevel || 'info';
      this.logFile = config.logFile;
    } else {
      this.logLevel = 'info';
      this.logFile = undefined;
    }
  }

  /**
   * Log a message at the specified level
   * @param message Message to log
   * @param level Log level
   */
  log(message: string, level: string = 'info'): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      // Console output
      this.consoleLog(formattedMessage, level);
      
      // File output if configured
      if (this.logFile) {
        this.fileLog(formattedMessage);
      }
    }
  }

  /**
   * Log an error message
   * @param message Error message
   */
  error(message: string): void {
    this.log(message, 'error');
  }

  /**
   * Log a warning message
   * @param message Warning message
   */
  warn(message: string): void {
    this.log(message, 'warn');
  }

  /**
   * Log an info message
   * @param message Info message
   */
  info(message: string): void {
    this.log(message, 'info');
  }

  /**
   * Log a debug message
   * @param message Debug message
   */
  debug(message: string): void {
    this.log(message, 'debug');
  }

  /**
   * Check if a message at the given level should be logged
   * @param level Log level to check
   * @returns Whether the message should be logged
   */
  private shouldLog(level: string): boolean {
    const configLevel = this.logLevels[this.logLevel as keyof typeof this.logLevels] || 2;
    const messageLevel = this.logLevels[level as keyof typeof this.logLevels] || 2;
    return messageLevel <= configLevel;
  }

  /**
   * Log a message to the console
   * @param message Formatted message
   * @param level Log level
   */
  private consoleLog(message: string, level: string): void {
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
        console.debug(message);
        break;
      case 'info':
      default:
        console.info(message);
        break;
    }
  }

  /**
   * Log a message to a file
   * @param message Formatted message
   */
  private fileLog(message: string): void {
    if (!this.logFile) return;
    
    try {
      // Ensure directory exists
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Append to log file
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
}
