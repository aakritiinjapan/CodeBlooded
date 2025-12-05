import { ErrorCode, CodeBloodedError } from '../types';
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ErrorLogEntry {
    timestamp: Date;
    error: CodeBloodedError;
    severity: ErrorSeverity;
    context?: any;
    stackTrace?: string;
}
export interface ErrorRecoveryStrategy {
    canRecover: (error: CodeBloodedError) => boolean;
    recover: (error: CodeBloodedError) => Promise<any> | any;
    description: string;
}
export interface ErrorLogger {
    log(entry: ErrorLogEntry): void;
    getErrors(): ErrorLogEntry[];
    clear(): void;
}
export declare class InMemoryErrorLogger implements ErrorLogger {
    private errors;
    private maxEntries;
    constructor(maxEntries?: number);
    log(entry: ErrorLogEntry): void;
    getErrors(): ErrorLogEntry[];
    clear(): void;
    getErrorsBySeverity(severity: ErrorSeverity): ErrorLogEntry[];
    getErrorsByCode(code: ErrorCode): ErrorLogEntry[];
    getRecentErrors(count: number): ErrorLogEntry[];
}
export declare class ConsoleErrorLogger implements ErrorLogger {
    private errors;
    log(entry: ErrorLogEntry): void;
    getErrors(): ErrorLogEntry[];
    clear(): void;
}
export declare function getErrorSeverity(error: CodeBloodedError): ErrorSeverity;
export declare const DEFAULT_RECOVERY_STRATEGIES: ErrorRecoveryStrategy[];
export declare class ErrorHandler {
    private logger;
    private recoveryStrategies;
    constructor(logger?: ErrorLogger, recoveryStrategies?: ErrorRecoveryStrategy[]);
    handle(error: CodeBloodedError, context?: any): Promise<any>;
    addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    getLogger(): ErrorLogger;
    setLogger(logger: ErrorLogger): void;
    clearErrors(): void;
}
export declare function getGlobalErrorHandler(): ErrorHandler;
export declare function setGlobalErrorHandler(handler: ErrorHandler): void;
export declare function handleError(error: CodeBloodedError, context?: any): Promise<any>;
export declare function withErrorHandling<T extends (...args: any[]) => any>(fn: T, context?: any): T;
export declare function createError(error: unknown, code: ErrorCode, context?: any): CodeBloodedError;
export declare function isRecoverable(error: CodeBloodedError): boolean;
export declare function formatError(error: CodeBloodedError): string;
//# sourceMappingURL=index.d.ts.map