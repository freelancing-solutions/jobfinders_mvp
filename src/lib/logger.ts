import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  module?: string;
  userId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  output: 'console' | 'file' | 'both';
  logFile?: string;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableModule: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logFileStream?: WriteStream;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      format: 'text',
      output: process.env.NODE_ENV === 'production' ? 'file' : 'console',
      enableColors: true,
      enableTimestamp: true,
      enableModule: true,
      ...config,
    };

    if (this.config.output === 'file' || this.config.output === 'both') {
      this.initializeFileLogging();
    }

    // Handle process exit
    process.on('exit', () => this.close());
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  private initializeFileLogging(): void {
    if (!this.config.logFile) {
      this.config.logFile = join(process.cwd(), 'logs', 'application.log');
    }

    try {
      this.logFileStream = createWriteStream(this.config.logFile, { flags: 'a' });
    } catch (error) {
      console.error('Failed to initialize file logging:', error);
      // Fallback to console logging
      this.config.output = this.config.output === 'file' ? 'console' : 'console';
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const parts: string[] = [];

    // Timestamp
    if (this.config.enableTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    // Log level
    const levelStr = LogLevel[entry.level];
    const coloredLevel = this.colorizeLevel(levelStr, entry.level);
    parts.push(`[${coloredLevel}]`);

    // Module
    if (this.config.enableModule && entry.module) {
      parts.push(`[${entry.module}]`);
    }

    // User ID
    if (entry.userId) {
      parts.push(`[user:${entry.userId}]`);
    }

    // Request ID
    if (entry.requestId) {
      parts.push(`[req:${entry.requestId}]`);
    }

    // Message
    parts.push(entry.message);

    // Metadata
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      parts.push(`| ${JSON.stringify(entry.meta)}`);
    }

    return parts.join(' ');
  }

  private colorizeLevel(level: string, logLevel: LogLevel): string {
    if (!this.config.enableColors) {
      return level;
    }

    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    return `${colors[logLevel]}${level}${reset}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedLog = this.formatLogEntry(entry);

    // Console output
    if (this.config.output === 'console' || this.config.output === 'both') {
      if (entry.level >= LogLevel.ERROR) {
        console.error(formattedLog);
      } else if (entry.level >= LogLevel.WARN) {
        console.warn(formattedLog);
      } else {
        console.log(formattedLog);
      }
    }

    // File output
    if ((this.config.output === 'file' || this.config.output === 'both') && this.logFileStream) {
      this.logFileStream.write(formattedLog + '\n');
    }
  }

  private createLogEntry(level: LogLevel, message: string, meta?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };
  }

  // Public logging methods
  debug(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, meta);
    this.writeLog(entry);
  }

  info(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, meta);
    this.writeLog(entry);
  }

  warn(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, meta);
    this.writeLog(entry);
  }

  error(message: string, meta?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, meta);
    this.writeLog(entry);
  }

  // Module-specific logger
  module(moduleName: string): ModuleLogger {
    return new ModuleLogger(this, moduleName);
  }

  // Request-specific logger
  request(requestId: string): RequestLogger {
    return new RequestLogger(this, requestId);
  }

  // User-specific logger
  user(userId: string): UserLogger {
    return new UserLogger(this, userId);
  }

  // Performance logging
  metric(name: string, value: number, unit?: string, meta?: Record<string, any>): void {
    this.info(`Metric: ${name} = ${value}${unit ? ` ${unit}` : ''}`, {
      type: 'metric',
      metricName: name,
      metricValue: value,
      metricUnit: unit,
      ...meta,
    });
  }

  // Timer utility
  timer(name: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.metric(name, duration, 'ms');
    };
  }

  // Configuration
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Cleanup
  close(): void {
    if (this.logFileStream) {
      this.logFileStream.end();
      this.logFileStream = undefined;
    }
  }
}

// Specialized logger classes
class ModuleLogger {
  constructor(private logger: Logger, private moduleName: string) {}

  debug(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.DEBUG, message, meta);
    entry.module = this.moduleName;
    this.logger.writeLog(entry);
  }

  info(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.INFO, message, meta);
    entry.module = this.moduleName;
    this.logger.writeLog(entry);
  }

  warn(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.WARN, message, meta);
    entry.module = this.moduleName;
    this.logger.writeLog(entry);
  }

  error(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.ERROR, message, meta);
    entry.module = this.moduleName;
    this.logger.writeLog(entry);
  }
}

class RequestLogger {
  constructor(private logger: Logger, private requestId: string) {}

  debug(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.DEBUG, message, meta);
    entry.requestId = this.requestId;
    this.logger.writeLog(entry);
  }

  info(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.INFO, message, meta);
    entry.requestId = this.requestId;
    this.logger.writeLog(entry);
  }

  warn(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.WARN, message, meta);
    entry.requestId = this.requestId;
    this.logger.writeLog(entry);
  }

  error(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.ERROR, message, meta);
    entry.requestId = this.requestId;
    this.logger.writeLog(entry);
  }
}

class UserLogger {
  constructor(private logger: Logger, private userId: string) {}

  debug(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.DEBUG, message, meta);
    entry.userId = this.userId;
    this.logger.writeLog(entry);
  }

  info(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.INFO, message, meta);
    entry.userId = this.userId;
    this.logger.writeLog(entry);
  }

  warn(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.WARN, message, meta);
    entry.userId = this.userId;
    this.logger.writeLog(entry);
  }

  error(message: string, meta?: Record<string, any>): void {
    const entry = this.logger.createLogEntry(LogLevel.ERROR, message, meta);
    entry.userId = this.userId;
    this.logger.writeLog(entry);
  }
}

// Default logger instance
export const logger = new Logger();

// Export specialized loggers
export { ModuleLogger, RequestLogger, UserLogger };

// Export factory functions
export const createLogger = (config?: Partial<LoggerConfig>): Logger => new Logger(config);

// Convenience functions for the default logger
export const debug = (message: string, meta?: Record<string, any>) => logger.debug(message, meta);
export const info = (message: string, meta?: Record<string, any>) => logger.info(message, meta);
export const warn = (message: string, meta?: Record<string, any>) => logger.warn(message, meta);
export const error = (message: string, meta?: Record<string, any>) => logger.error(message, meta);
export const metric = (name: string, value: number, unit?: string, meta?: Record<string, any>) =>
  logger.metric(name, value, unit, meta);

// Structured logging helpers
export const logUserAction = (userId: string, action: string, meta?: Record<string, any>) => {
  logger.user(userId).info(`User action: ${action}`, { type: 'user_action', action, ...meta });
};

export const logApiRequest = (method: string, path: string, statusCode: number, duration: number, meta?: Record<string, any>) => {
  logger.info(`${method} ${path} - ${statusCode} (${duration}ms)`, {
    type: 'api_request',
    method,
    path,
    statusCode,
    duration,
    ...meta,
  });
};

export const logError = (error: Error, context?: string, meta?: Record<string, any>) => {
  logger.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, {
    type: 'error',
    stack: error.stack,
    context,
    ...meta,
  });
};

export const logPerformance = (operation: string, duration: number, meta?: Record<string, any>) => {
  logger.metric(operation, duration, 'ms', { type: 'performance', operation, ...meta });
};