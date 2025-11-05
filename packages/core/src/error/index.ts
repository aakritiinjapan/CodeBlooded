/**
 * Error Handling Utilities
 * 
 * Provides error recovery strategies, logging, and error management
 */

import { ErrorCode, CodeChromaError } from '../types';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  timestamp: Date;
  error: CodeChromaError;
  severity: ErrorSeverity;
  context?: any;
  stackTrace?: string;
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  canRecover: (error: CodeChromaError) => boolean;
  recover: (error: CodeChromaError) => Promise<any> | any;
  description: string;
}

/**
 * Error logger interface
 */
export interface ErrorLogger {
  log(entry: ErrorLogEntry): void;
  getErrors(): ErrorLogEntry[];
  clear(): void;
}

/**
 * Default in-memory error logger
 */
export class InMemoryErrorLogger implements ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 100) {
    this.maxEntries = maxEntries;
  }

  log(entry: ErrorLogEntry): void {
    this.errors.push(entry);

    // Keep only the most recent entries
    if (this.errors.length > this.maxEntries) {
      this.errors.shift();
    }
  }

  getErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[] {
    return this.errors.filter((entry) => entry.severity === severity);
  }

  /**
   * Get errors by error code
   */
  getErrorsByCode(code: ErrorCode): ErrorLogEntry[] {
    return this.errors.filter((entry) => entry.error.code === code);
  }

  /**
   * Get recent errors (last N entries)
   */
  getRecentErrors(count: number): ErrorLogEntry[] {
    return this.errors.slice(-count);
  }
}

/**
 * Console error logger (for debugging)
 */
export class ConsoleErrorLogger implements ErrorLogger {
  private errors: ErrorLogEntry[] = [];

  log(entry: ErrorLogEntry): void {
    this.errors.push(entry);

    const prefix = `[CodeChroma ${entry.severity.toUpperCase()}]`;
    const message = `${prefix} ${entry.error.message}`;

    switch (entry.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(message, entry.error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(message, entry.error);
        break;
      case ErrorSeverity.LOW:
        console.info(message, entry.error);
        break;
    }

    if (entry.context) {
      console.debug('Error context:', entry.context);
    }
  }

  getErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }
}

/**
 * Determine error severity based on error code
 */
export function getErrorSeverity(error: CodeChromaError): ErrorSeverity {
  switch (error.code) {
    case ErrorCode.PARSE_ERROR:
      return ErrorSeverity.MEDIUM;
    case ErrorCode.ANALYSIS_ERROR:
      return ErrorSeverity.MEDIUM;
    case ErrorCode.AUDIO_ERROR:
      return ErrorSeverity.LOW; // Audio errors are non-critical
    case ErrorCode.VISUALIZATION_ERROR:
      return ErrorSeverity.LOW; // Visualization errors are non-critical
    case ErrorCode.FILE_SYSTEM_ERROR:
      return ErrorSeverity.HIGH;
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Default error recovery strategies
 */
export const DEFAULT_RECOVERY_STRATEGIES: ErrorRecoveryStrategy[] = [
  // Parse error recovery: return partial results
  {
    canRecover: (error) => error.code === ErrorCode.PARSE_ERROR,
    recover: (error) => {
      return {
        partial: true,
        error: error.message,
        metrics: {
          totalLines: 0,
          codeLines: 0,
          commentLines: 0,
          cyclomaticComplexity: 0,
          maintainabilityIndex: 0,
        },
        functions: [],
        dependencies: [],
      };
    },
    description: 'Return partial analysis results for parse errors',
  },

  // Audio error recovery: disable audio and continue
  {
    canRecover: (error) => error.code === ErrorCode.AUDIO_ERROR,
    recover: () => {
      console.warn('Audio unavailable, continuing in visual-only mode');
      return { audioDisabled: true };
    },
    description: 'Disable audio and continue in visual-only mode',
  },

  // Visualization error recovery: fall back to text output
  {
    canRecover: (error) => error.code === ErrorCode.VISUALIZATION_ERROR,
    recover: () => {
      console.warn('Visualization unavailable, falling back to text output');
      return { visualizationDisabled: true };
    },
    description: 'Fall back to text-based output for visualization errors',
  },

  // File system error recovery: skip file and continue
  {
    canRecover: (error) => error.code === ErrorCode.FILE_SYSTEM_ERROR,
    recover: (error) => {
      console.warn(`Skipping file due to error: ${error.message}`);
      return { skipped: true, reason: error.message };
    },
    description: 'Skip problematic files and continue with batch analysis',
  },
];

/**
 * Error Handler class for managing errors and recovery
 */
export class ErrorHandler {
  private logger: ErrorLogger;
  private recoveryStrategies: ErrorRecoveryStrategy[];

  constructor(
    logger?: ErrorLogger,
    recoveryStrategies?: ErrorRecoveryStrategy[]
  ) {
    this.logger = logger || new InMemoryErrorLogger();
    this.recoveryStrategies = recoveryStrategies || DEFAULT_RECOVERY_STRATEGIES;
  }

  /**
   * Handle an error with logging and recovery
   */
  async handle(error: CodeChromaError, context?: any): Promise<any> {
    // Log the error
    const severity = getErrorSeverity(error);
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      error,
      severity,
      context,
      stackTrace: error.stack,
    };
    this.logger.log(entry);

    // Attempt recovery
    const strategy = this.recoveryStrategies.find((s) => s.canRecover(error));
    if (strategy) {
      try {
        return await strategy.recover(error);
      } catch (recoveryError) {
        // Recovery failed, log and rethrow original error
        console.error('Error recovery failed:', recoveryError);
        throw error;
      }
    }

    // No recovery strategy available, rethrow
    throw error;
  }

  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Get the error logger
   */
  getLogger(): ErrorLogger {
    return this.logger;
  }

  /**
   * Set a new error logger
   */
  setLogger(logger: ErrorLogger): void {
    this.logger = logger;
  }

  /**
   * Clear all logged errors
   */
  clearErrors(): void {
    this.logger.clear();
  }
}

/**
 * Global error handler instance
 */
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Get the global error handler (creates one if it doesn't exist)
 */
export function getGlobalErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Set the global error handler
 */
export function setGlobalErrorHandler(handler: ErrorHandler): void {
  globalErrorHandler = handler;
}

/**
 * Convenience function to handle errors using the global handler
 */
export async function handleError(
  error: CodeChromaError,
  context?: any
): Promise<any> {
  return getGlobalErrorHandler().handle(error, context);
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: any
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof CodeChromaError) {
        return handleError(error, context);
      }
      // Convert unknown errors to CodeChromaError
      const codeChromaError = new CodeChromaError(
        error instanceof Error ? error.message : String(error),
        ErrorCode.ANALYSIS_ERROR,
        { originalError: error, ...context }
      );
      return handleError(codeChromaError, context);
    }
  }) as T;
}

/**
 * Create a CodeChromaError from an unknown error
 */
export function createError(
  error: unknown,
  code: ErrorCode,
  context?: any
): CodeChromaError {
  if (error instanceof CodeChromaError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new CodeChromaError(message, code, {
    originalError: error,
    ...context,
  });
}

/**
 * Check if an error is recoverable
 */
export function isRecoverable(error: CodeChromaError): boolean {
  return DEFAULT_RECOVERY_STRATEGIES.some((strategy) =>
    strategy.canRecover(error)
  );
}

/**
 * Format error for display
 */
export function formatError(error: CodeChromaError): string {
  const severity = getErrorSeverity(error);
  const prefix = `[${severity.toUpperCase()}]`;
  let message = `${prefix} ${error.message}`;

  if (error.context) {
    message += `\nContext: ${JSON.stringify(error.context, null, 2)}`;
  }

  return message;
}
