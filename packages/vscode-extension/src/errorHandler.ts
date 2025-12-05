/**
 * Error Handler - Comprehensive error handling for horror effects
 * 
 * Provides centralized error handling with:
 * - Try-catch wrappers for effect triggers
 * - Contextual error logging
 * - Graceful degradation
 * - User-friendly error messages
 * - Automatic recovery mechanisms
 */

import * as vscode from 'vscode';

/**
 * Error context for detailed logging
 */
export interface ErrorContext {
  component: string;
  operation: string;
  intensity?: number;
  additionalInfo?: Record<string, any>;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  Low = 'low',        // Minor issue, effect skipped
  Medium = 'medium',  // Effect failed, try alternative
  High = 'high',      // Component disabled temporarily
  Critical = 'critical' // Component disabled permanently
}

/**
 * Error statistics for monitoring
 */
interface ErrorStats {
  component: string;
  errorCount: number;
  lastError: Date;
  consecutiveErrors: number;
}

/**
 * Centralized error handler for horror effects
 */
export class ErrorHandler {
  private errorStats: Map<string, ErrorStats> = new Map();
  private disabledComponents: Set<string> = new Set();
  private readonly MAX_CONSECUTIVE_ERRORS = 3;
  private readonly ERROR_RESET_TIME = 60000; // 1 minute

  /**
   * Wrap an async effect trigger with error handling
   */
  async safeExecute<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    // Check if component is disabled
    if (this.disabledComponents.has(context.component)) {
      console.log(`[ErrorHandler] Component ${context.component} is disabled, skipping`);
      return null;
    }

    try {
      const result = await fn();
      
      // Reset error count on success
      this.resetErrorCount(context.component);
      
      return result;
    } catch (error) {
      // Log error with context
      this.logError(error, context);
      
      // Update error statistics
      this.updateErrorStats(context.component);
      
      // Check if component should be disabled
      const stats = this.errorStats.get(context.component);
      if (stats && stats.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.disableComponent(context.component, ErrorSeverity.High);
      }
      
      // Try fallback if available
      if (fallback) {
        try {
          console.log(`[ErrorHandler] Attempting fallback for ${context.component}`);
          return await fallback();
        } catch (fallbackError) {
          this.logError(fallbackError, { ...context, operation: `${context.operation} (fallback)` });
        }
      }
      
      return null;
    }
  }

  /**
   * Wrap a synchronous effect trigger with error handling
   */
  safeExecuteSync<T>(
    fn: () => T,
    context: ErrorContext,
    fallback?: () => T
  ): T | null {
    // Check if component is disabled
    if (this.disabledComponents.has(context.component)) {
      console.log(`[ErrorHandler] Component ${context.component} is disabled, skipping`);
      return null;
    }

    try {
      const result = fn();
      
      // Reset error count on success
      this.resetErrorCount(context.component);
      
      return result;
    } catch (error) {
      // Log error with context
      this.logError(error, context);
      
      // Update error statistics
      this.updateErrorStats(context.component);
      
      // Check if component should be disabled
      const stats = this.errorStats.get(context.component);
      if (stats && stats.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.disableComponent(context.component, ErrorSeverity.High);
      }
      
      // Try fallback if available
      if (fallback) {
        try {
          console.log(`[ErrorHandler] Attempting fallback for ${context.component}`);
          return fallback();
        } catch (fallbackError) {
          this.logError(fallbackError, { ...context, operation: `${context.operation} (fallback)` });
        }
      }
      
      return null;
    }
  }

  /**
   * Log error with context
   */
  private logError(error: any, context: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    console.error(
      `[ErrorHandler] ${context.component}.${context.operation} failed:`,
      {
        error: errorMessage,
        stack,
        intensity: context.intensity,
        additionalInfo: context.additionalInfo
      }
    );
  }

  /**
   * Update error statistics for a component
   */
  private updateErrorStats(component: string): void {
    const stats = this.errorStats.get(component) || {
      component,
      errorCount: 0,
      lastError: new Date(),
      consecutiveErrors: 0
    };
    
    const now = new Date();
    const timeSinceLastError = now.getTime() - stats.lastError.getTime();
    
    // Reset consecutive errors if enough time has passed
    if (timeSinceLastError > this.ERROR_RESET_TIME) {
      stats.consecutiveErrors = 1;
    } else {
      stats.consecutiveErrors++;
    }
    
    stats.errorCount++;
    stats.lastError = now;
    
    this.errorStats.set(component, stats);
    
    console.log(`[ErrorHandler] Error stats for ${component}:`, {
      total: stats.errorCount,
      consecutive: stats.consecutiveErrors
    });
  }

  /**
   * Reset error count for a component (on successful execution)
   */
  private resetErrorCount(component: string): void {
    const stats = this.errorStats.get(component);
    if (stats) {
      stats.consecutiveErrors = 0;
      this.errorStats.set(component, stats);
    }
  }

  /**
   * Disable a component due to repeated failures
   */
  private disableComponent(component: string, severity: ErrorSeverity): void {
    this.disabledComponents.add(component);
    
    console.error(`[ErrorHandler] Component ${component} disabled due to repeated failures (severity: ${severity})`);
    
    // Show user-friendly error message
    const message = this.getUserFriendlyMessage(component, severity);
    
    if (severity === ErrorSeverity.Critical) {
      vscode.window.showErrorMessage(message, 'OK');
    } else {
      vscode.window.showWarningMessage(message, 'OK');
    }
    
    // Schedule automatic recovery for non-critical errors
    if (severity !== ErrorSeverity.Critical) {
      setTimeout(() => {
        this.enableComponent(component);
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  /**
   * Enable a previously disabled component
   */
  enableComponent(component: string): void {
    if (this.disabledComponents.has(component)) {
      this.disabledComponents.delete(component);
      
      // Reset error stats
      const stats = this.errorStats.get(component);
      if (stats) {
        stats.consecutiveErrors = 0;
        this.errorStats.set(component, stats);
      }
      
      console.log(`[ErrorHandler] Component ${component} re-enabled after recovery period`);
      
      vscode.window.showInformationMessage(
        `codeblooded: ${component} effects have been re-enabled.`
      );
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(component: string, severity: ErrorSeverity): string {
    const componentNames: Record<string, string> = {
      'jumpscare': 'Jumpscare popups',
      'screenDistortion': 'Screen distortion effects',
      'phantomTyping': 'Phantom typing',
      'whisperingVariables': 'Whispering variables',
      'entityPresence': 'Entity presence (eyes)',
      'contextTrigger': 'Context-aware triggers',
      'timeDilation': 'Time dilation effects',
      'easterEgg': 'Easter eggs'
    };
    
    const friendlyName = componentNames[component] || component;
    
    if (severity === ErrorSeverity.Critical) {
      return `⚠️ codeblooded: ${friendlyName} have been permanently disabled due to critical errors. Please restart VS Code to re-enable.`;
    } else {
      return `⚠️ codeblooded: ${friendlyName} have been temporarily disabled due to errors. They will automatically re-enable in 5 minutes.`;
    }
  }

  /**
   * Check if a component is disabled
   */
  isComponentDisabled(component: string): boolean {
    return this.disabledComponents.has(component);
  }

  /**
   * Get error statistics for all components
   */
  getErrorStats(): Map<string, ErrorStats> {
    return new Map(this.errorStats);
  }

  /**
   * Get list of disabled components
   */
  getDisabledComponents(): string[] {
    return Array.from(this.disabledComponents);
  }

  /**
   * Reset all error statistics
   */
  resetAllStats(): void {
    this.errorStats.clear();
    this.disabledComponents.clear();
    console.log('[ErrorHandler] All error statistics reset');
  }

  /**
   * Manually disable a component
   */
  manuallyDisableComponent(component: string): void {
    this.disabledComponents.add(component);
    console.log(`[ErrorHandler] Component ${component} manually disabled`);
  }

  /**
   * Get error report for debugging
   */
  getErrorReport(): string {
    const lines: string[] = ['codeblooded Error Report', '='.repeat(50), ''];
    
    if (this.errorStats.size === 0) {
      lines.push('No errors recorded.');
    } else {
      lines.push('Component Error Statistics:');
      lines.push('');
      
      for (const [component, stats] of this.errorStats.entries()) {
        const disabled = this.disabledComponents.has(component) ? ' [DISABLED]' : '';
        lines.push(`${component}${disabled}:`);
        lines.push(`  Total Errors: ${stats.errorCount}`);
        lines.push(`  Consecutive Errors: ${stats.consecutiveErrors}`);
        lines.push(`  Last Error: ${stats.lastError.toLocaleString()}`);
        lines.push('');
      }
    }
    
    if (this.disabledComponents.size > 0) {
      lines.push('Disabled Components:');
      for (const component of this.disabledComponents) {
        lines.push(`  - ${component}`);
      }
    }
    
    return lines.join('\n');
  }
}
