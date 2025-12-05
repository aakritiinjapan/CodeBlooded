/**
 * Profiler - Performance profiling and optimization utilities
 * 
 * Provides tools for measuring extension activation time, effect trigger overhead,
 * webview rendering performance, and memory footprint.
 */

/**
 * Profiling result for a single operation
 */
export interface ProfilingResult {
  operation: string;
  duration: number;
  timestamp: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
}

/**
 * Profiler class for performance measurement
 */
export class Profiler {
  private results: ProfilingResult[] = [];
  private readonly maxResults = 1000;
  private activationStartTime: number = 0;
  private activationEndTime: number = 0;
  
  /**
   * Start profiling extension activation
   */
  startActivation(): void {
    this.activationStartTime = Date.now();
    console.log('[Profiler] Extension activation started');
  }
  
  /**
   * End profiling extension activation
   */
  endActivation(): void {
    this.activationEndTime = Date.now();
    const duration = this.activationEndTime - this.activationStartTime;
    
    this.record({
      operation: 'extension-activation',
      duration,
      timestamp: this.activationEndTime
    });
    
    console.log(`[Profiler] Extension activation completed in ${duration}ms`);
    
    // Warn if activation is slow
    if (duration > 1000) {
      console.warn(`[Profiler] Slow activation detected: ${duration}ms (target: <1000ms)`);
    }
  }
  
  /**
   * Get activation time
   */
  getActivationTime(): number {
    return this.activationEndTime - this.activationStartTime;
  }
  
  /**
   * Profile an async operation
   */
  async profileAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    measureMemory: boolean = false
  ): Promise<T> {
    const startTime = Date.now();
    const memoryBefore = measureMemory ? this.getMemoryUsage() : undefined;
    
    try {
      const result = await fn();
      const endTime = Date.now();
      const memoryAfter = measureMemory ? this.getMemoryUsage() : undefined;
      
      this.record({
        operation,
        duration: endTime - startTime,
        timestamp: endTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: memoryAfter && memoryBefore ? memoryAfter - memoryBefore : undefined
      });
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      this.record({
        operation: `${operation} (failed)`,
        duration: endTime - startTime,
        timestamp: endTime
      });
      throw error;
    }
  }
  
  /**
   * Profile a sync operation
   */
  profileSync<T>(
    operation: string,
    fn: () => T,
    measureMemory: boolean = false
  ): T {
    const startTime = Date.now();
    const memoryBefore = measureMemory ? this.getMemoryUsage() : undefined;
    
    try {
      const result = fn();
      const endTime = Date.now();
      const memoryAfter = measureMemory ? this.getMemoryUsage() : undefined;
      
      this.record({
        operation,
        duration: endTime - startTime,
        timestamp: endTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: memoryAfter && memoryBefore ? memoryAfter - memoryBefore : undefined
      });
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      this.record({
        operation: `${operation} (failed)`,
        duration: endTime - startTime,
        timestamp: endTime
      });
      throw error;
    }
  }
  
  /**
   * Start timing an operation (returns end function)
   */
  startTiming(operation: string, measureMemory: boolean = false): () => void {
    const startTime = Date.now();
    const memoryBefore = measureMemory ? this.getMemoryUsage() : undefined;
    
    return () => {
      const endTime = Date.now();
      const memoryAfter = measureMemory ? this.getMemoryUsage() : undefined;
      
      this.record({
        operation,
        duration: endTime - startTime,
        timestamp: endTime,
        memoryBefore,
        memoryAfter,
        memoryDelta: memoryAfter && memoryBefore ? memoryAfter - memoryBefore : undefined
      });
    };
  }
  
  /**
   * Record a profiling result
   */
  private record(result: ProfilingResult): void {
    this.results.push(result);
    
    // Keep only last maxResults
    if (this.results.length > this.maxResults) {
      this.results.shift();
    }
    
    // Log slow operations
    if (result.duration > 100) {
      console.warn(`[Profiler] Slow operation: ${result.operation} took ${result.duration}ms`);
    }
    
    // Log memory-intensive operations
    if (result.memoryDelta && result.memoryDelta > 10 * 1024 * 1024) { // 10MB
      console.warn(`[Profiler] Memory-intensive operation: ${result.operation} used ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  /**
   * Get current memory usage in bytes
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
  
  /**
   * Get all profiling results
   */
  getResults(): ProfilingResult[] {
    return [...this.results];
  }
  
  /**
   * Get results for a specific operation
   */
  getResultsForOperation(operation: string): ProfilingResult[] {
    return this.results.filter(r => r.operation === operation);
  }
  
  /**
   * Get statistics for an operation
   */
  getOperationStats(operation: string): {
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalMemoryDelta: number;
  } {
    const results = this.getResultsForOperation(operation);
    
    if (results.length === 0) {
      return {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalMemoryDelta: 0
      };
    }
    
    const durations = results.map(r => r.duration);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const totalMemoryDelta = results
      .filter(r => r.memoryDelta !== undefined)
      .reduce((sum, r) => sum + (r.memoryDelta || 0), 0);
    
    return {
      count: results.length,
      totalDuration,
      averageDuration: totalDuration / results.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalMemoryDelta
    };
  }
  
  /**
   * Get all operation statistics
   */
  getAllStats(): Record<string, ReturnType<typeof this.getOperationStats>> {
    const operations = new Set(this.results.map(r => r.operation));
    const stats: Record<string, ReturnType<typeof this.getOperationStats>> = {};
    
    for (const operation of operations) {
      stats[operation] = this.getOperationStats(operation);
    }
    
    return stats;
  }
  
  /**
   * Get slow operations (>100ms)
   */
  getSlowOperations(): ProfilingResult[] {
    return this.results.filter(r => r.duration > 100);
  }
  
  /**
   * Get memory-intensive operations (>5MB)
   */
  getMemoryIntensiveOperations(): ProfilingResult[] {
    return this.results.filter(r => 
      r.memoryDelta !== undefined && r.memoryDelta > 5 * 1024 * 1024
    );
  }
  
  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getAllStats();
    const slowOps = this.getSlowOperations();
    const memoryOps = this.getMemoryIntensiveOperations();
    
    let report = '📊 Performance Profiling Report\n\n';
    
    // Activation time
    if (this.activationStartTime > 0 && this.activationEndTime > 0) {
      const activationTime = this.getActivationTime();
      report += `⚡ Extension Activation: ${activationTime}ms\n`;
      if (activationTime > 1000) {
        report += `  ⚠️ Warning: Activation time exceeds 1000ms target\n`;
      }
      report += '\n';
    }
    
    // Operation statistics
    report += '📈 Operation Statistics:\n';
    const sortedOps = Object.entries(stats)
      .sort((a, b) => b[1].averageDuration - a[1].averageDuration)
      .slice(0, 10); // Top 10 slowest
    
    for (const [operation, data] of sortedOps) {
      report += `  ${operation}:\n`;
      report += `    Count: ${data.count}\n`;
      report += `    Avg: ${data.averageDuration.toFixed(2)}ms\n`;
      report += `    Min: ${data.minDuration}ms, Max: ${data.maxDuration}ms\n`;
      if (data.totalMemoryDelta > 0) {
        report += `    Memory: ${(data.totalMemoryDelta / 1024 / 1024).toFixed(2)}MB\n`;
      }
    }
    report += '\n';
    
    // Slow operations
    if (slowOps.length > 0) {
      report += `⚠️ Slow Operations (${slowOps.length}):\n`;
      const recentSlow = slowOps.slice(-5); // Last 5
      for (const op of recentSlow) {
        report += `  ${op.operation}: ${op.duration}ms\n`;
      }
      report += '\n';
    }
    
    // Memory-intensive operations
    if (memoryOps.length > 0) {
      report += `💾 Memory-Intensive Operations (${memoryOps.length}):\n`;
      const recentMemory = memoryOps.slice(-5); // Last 5
      for (const op of recentMemory) {
        const mb = ((op.memoryDelta || 0) / 1024 / 1024).toFixed(2);
        report += `  ${op.operation}: ${mb}MB\n`;
      }
      report += '\n';
    }
    
    // Current memory usage
    const currentMemory = this.getMemoryUsage();
    if (currentMemory > 0) {
      report += `💾 Current Memory Usage: ${(currentMemory / 1024 / 1024).toFixed(2)}MB\n`;
    }
    
    return report;
  }
  
  /**
   * Clear all profiling results
   */
  clear(): void {
    this.results = [];
    console.log('[Profiler] Profiling results cleared');
  }
  
  /**
   * Export results as JSON
   */
  exportResults(): string {
    return JSON.stringify({
      activationTime: this.getActivationTime(),
      results: this.results,
      stats: this.getAllStats(),
      slowOperations: this.getSlowOperations(),
      memoryIntensiveOperations: this.getMemoryIntensiveOperations()
    }, null, 2);
  }
}

/**
 * Global profiler instance
 */
export const profiler = new Profiler();
