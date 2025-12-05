/**
 * Performance Optimizer - Utilities for throttling, debouncing, and caching
 * 
 * Provides performance optimization utilities to reduce computational overhead.
 */

/**
 * Throttle function - limits execution to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastRun = 0;
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    
    if (now - lastRun >= limitMs) {
      lastRun = now;
      return func.apply(this, args);
    }
    
    return undefined;
  };
}

/**
 * Debounce function - delays execution until after wait period of inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, waitMs);
  };
}

/**
 * Request animation frame wrapper for smooth animations
 */
export class AnimationFrameScheduler {
  private rafId: number | undefined;
  private callback: ((time: number) => void) | undefined;
  
  /**
   * Schedule a callback to run on next animation frame
   */
  schedule(callback: (time: number) => void): void {
    if (this.rafId !== undefined) {
      this.cancel();
    }
    
    this.callback = callback;
    
    // Use setTimeout as fallback since we're in Node.js environment
    // In browser, this would use requestAnimationFrame
    this.rafId = setTimeout(() => {
      if (this.callback) {
        this.callback(Date.now());
      }
      this.rafId = undefined;
    }, 16) as any; // ~60fps
  }
  
  /**
   * Cancel scheduled callback
   */
  cancel(): void {
    if (this.rafId !== undefined) {
      clearTimeout(this.rafId as any);
      this.rafId = undefined;
    }
  }
  
  /**
   * Check if a callback is scheduled
   */
  isScheduled(): boolean {
    return this.rafId !== undefined;
  }
}

/**
 * Value cache with TTL support
 */
export class ValueCache<T> {
  private cache: Map<string, { value: T; timestamp: number }> = new Map();
  private ttl: number;
  
  constructor(ttlMs: number = 1000) {
    this.ttl = ttlMs;
  }
  
  /**
   * Get cached value if still valid
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set cached value
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.cache.delete(key);
    }
  }
}

/**
 * Memoization decorator for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    return result;
  } as T;
}

/**
 * Batch processor - collects items and processes them in batches
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timeout: NodeJS.Timeout | undefined;
  private processor: (items: T[]) => void;
  private batchSize: number;
  private batchDelay: number;
  
  constructor(
    processor: (items: T[]) => void,
    batchSize: number = 10,
    batchDelayMs: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.batchDelay = batchDelayMs;
  }
  
  /**
   * Add item to batch
   */
  add(item: T): void {
    this.batch.push(item);
    
    // Process immediately if batch is full
    if (this.batch.length >= this.batchSize) {
      this.flush();
      return;
    }
    
    // Otherwise schedule delayed processing
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }
  
  /**
   * Process all pending items immediately
   */
  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    
    if (this.batch.length === 0) {
      return;
    }
    
    const items = [...this.batch];
    this.batch = [];
    
    this.processor(items);
  }
  
  /**
   * Get current batch size
   */
  size(): number {
    return this.batch.length;
  }
  
  /**
   * Clear batch without processing
   */
  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    this.batch = [];
  }
}

/**
 * Performance monitor for tracking execution times
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  private maxSamples: number;
  
  constructor(maxSamples: number = 100) {
    this.maxSamples = maxSamples;
  }
  
  /**
   * Start timing an operation
   */
  start(label: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.record(label, duration);
    };
  }
  
  /**
   * Record a measurement
   */
  record(label: string, duration: number): void {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    
    const samples = this.measurements.get(label)!;
    samples.push(duration);
    
    // Keep only last maxSamples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }
  
  /**
   * Get average duration for a label
   */
  getAverage(label: string): number {
    const samples = this.measurements.get(label);
    if (!samples || samples.length === 0) {
      return 0;
    }
    
    const sum = samples.reduce((a, b) => a + b, 0);
    return sum / samples.length;
  }
  
  /**
   * Get statistics for a label
   */
  getStats(label: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  } {
    const samples = this.measurements.get(label);
    if (!samples || samples.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, total: 0 };
    }
    
    const count = samples.length;
    const total = samples.reduce((a, b) => a + b, 0);
    const average = total / count;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    
    return { count, average, min, max, total };
  }
  
  /**
   * Get all statistics
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const result: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const label of this.measurements.keys()) {
      result[label] = this.getStats(label);
    }
    
    return result;
  }
  
  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }
  
  /**
   * Get report string
   */
  getReport(): string {
    const stats = this.getAllStats();
    const lines: string[] = ['Performance Report:'];
    
    for (const [label, data] of Object.entries(stats)) {
      lines.push(
        `  ${label}: avg=${data.average.toFixed(2)}ms, ` +
        `min=${data.min}ms, max=${data.max}ms, count=${data.count}`
      );
    }
    
    return lines.join('\n');
  }
}
