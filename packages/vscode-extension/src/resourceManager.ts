/**
 * Resource Manager - Manages webviews, decorations, and other resources
 * 
 * Implements resource limits, disposal, lazy loading, and caching to optimize performance.
 */

import * as vscode from 'vscode';

/**
 * Resource types that can be managed
 */
export enum ResourceType {
  Webview = 'webview',
  Decoration = 'decoration',
  Asset = 'asset',
  Timer = 'timer'
}

/**
 * Resource entry for tracking
 */
interface ResourceEntry {
  id: string;
  type: ResourceType;
  resource: any;
  createdAt: number;
  lastAccessedAt: number;
  size?: number;
}

/**
 * Asset cache entry
 */
interface AssetCacheEntry {
  data: any;
  loadedAt: number;
  accessCount: number;
  lastAccessedAt: number;
}

/**
 * Resource Manager Configuration
 */
interface ResourceManagerConfig {
  maxWebviews: number;
  maxDecorations: number;
  assetCacheSize: number;
  assetCacheTTL: number; // Time to live in milliseconds
}

/**
 * Resource Manager - Central resource management for performance optimization
 */
export class ResourceManager {
  private resources: Map<string, ResourceEntry> = new Map();
  private assetCache: Map<string, AssetCacheEntry> = new Map();
  private config: ResourceManagerConfig;
  private disposables: vscode.Disposable[] = [];
  
  // Resource counters
  private webviewCount = 0;
  private decorationCount = 0;
  
  // Performance tracking
  private disposeCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config?: Partial<ResourceManagerConfig>) {
    this.config = {
      maxWebviews: 2,
      maxDecorations: 50,
      assetCacheSize: 20,
      assetCacheTTL: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    
    console.log('[ResourceManager] Initialized with config:', this.config);
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Register a webview panel
   */
  registerWebview(panel: vscode.WebviewPanel, id?: string): string {
    const resourceId = id || `webview-${Date.now()}-${Math.random()}`;
    
    // Check if we've hit the limit
    if (this.webviewCount >= this.config.maxWebviews) {
      console.log('[ResourceManager] Webview limit reached, disposing oldest');
      this.disposeOldestResource(ResourceType.Webview);
    }
    
    // Register the webview
    const entry: ResourceEntry = {
      id: resourceId,
      type: ResourceType.Webview,
      resource: panel,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    
    this.resources.set(resourceId, entry);
    this.webviewCount++;
    
    // Listen for disposal
    panel.onDidDispose(() => {
      this.unregisterResource(resourceId);
    });
    
    console.log(`[ResourceManager] Registered webview: ${resourceId} (${this.webviewCount}/${this.config.maxWebviews})`);
    
    return resourceId;
  }

  /**
   * Register a decoration type
   */
  registerDecoration(decoration: vscode.TextEditorDecorationType, id?: string): string {
    const resourceId = id || `decoration-${Date.now()}-${Math.random()}`;
    
    // Check if we've hit the limit
    if (this.decorationCount >= this.config.maxDecorations) {
      console.log('[ResourceManager] Decoration limit reached, disposing oldest');
      this.disposeOldestResource(ResourceType.Decoration);
    }
    
    // Register the decoration
    const entry: ResourceEntry = {
      id: resourceId,
      type: ResourceType.Decoration,
      resource: decoration,
      createdAt: Date.now(),
      lastAccessedAt: Date.now()
    };
    
    this.resources.set(resourceId, entry);
    this.decorationCount++;
    
    console.log(`[ResourceManager] Registered decoration: ${resourceId} (${this.decorationCount}/${this.config.maxDecorations})`);
    
    return resourceId;
  }

  /**
   * Unregister a resource
   */
  unregisterResource(id: string): void {
    const entry = this.resources.get(id);
    if (!entry) {
      return;
    }
    
    // Update counters
    if (entry.type === ResourceType.Webview) {
      this.webviewCount--;
    } else if (entry.type === ResourceType.Decoration) {
      this.decorationCount--;
    }
    
    this.resources.delete(id);
    console.log(`[ResourceManager] Unregistered ${entry.type}: ${id}`);
  }

  /**
   * Dispose oldest resource of a specific type
   */
  private disposeOldestResource(type: ResourceType): void {
    let oldest: ResourceEntry | undefined;
    
    for (const entry of this.resources.values()) {
      if (entry.type === type) {
        if (!oldest || entry.lastAccessedAt < oldest.lastAccessedAt) {
          oldest = entry;
        }
      }
    }
    
    if (oldest) {
      this.disposeResource(oldest.id);
    }
  }

  /**
   * Dispose a specific resource
   */
  disposeResource(id: string): void {
    const entry = this.resources.get(id);
    if (!entry) {
      return;
    }
    
    try {
      // Dispose the resource
      if (entry.resource && typeof entry.resource.dispose === 'function') {
        entry.resource.dispose();
      }
      
      this.disposeCount++;
      console.log(`[ResourceManager] Disposed ${entry.type}: ${id}`);
    } catch (error) {
      console.error(`[ResourceManager] Error disposing ${entry.type} ${id}:`, error);
    }
    
    this.unregisterResource(id);
  }

  /**
   * Dispose all resources of a specific type
   */
  disposeAllOfType(type: ResourceType): void {
    const toDispose: string[] = [];
    
    for (const [id, entry] of this.resources.entries()) {
      if (entry.type === type) {
        toDispose.push(id);
      }
    }
    
    for (const id of toDispose) {
      this.disposeResource(id);
    }
    
    console.log(`[ResourceManager] Disposed all ${type} resources (${toDispose.length})`);
  }

  /**
   * Update last accessed time for a resource
   */
  touchResource(id: string): void {
    const entry = this.resources.get(id);
    if (entry) {
      entry.lastAccessedAt = Date.now();
    }
  }

  /**
   * Get a resource by ID
   */
  getResource(id: string): any {
    const entry = this.resources.get(id);
    if (entry) {
      entry.lastAccessedAt = Date.now();
      return entry.resource;
    }
    return undefined;
  }

  /**
   * Load an asset with caching
   */
  async loadAsset<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.assetCache.get(key);
    if (cached) {
      // Check if cache is still valid
      const age = Date.now() - cached.loadedAt;
      if (age < this.config.assetCacheTTL) {
        cached.accessCount++;
        cached.lastAccessedAt = Date.now();
        this.cacheHits++;
        console.log(`[ResourceManager] Asset cache hit: ${key} (age: ${age}ms, hits: ${cached.accessCount})`);
        return cached.data as T;
      } else {
        // Cache expired
        this.assetCache.delete(key);
        console.log(`[ResourceManager] Asset cache expired: ${key}`);
      }
    }
    
    // Cache miss - load the asset
    this.cacheMisses++;
    console.log(`[ResourceManager] Asset cache miss: ${key}, loading...`);
    
    const data = await loader();
    
    // Check if we need to evict old entries
    if (this.assetCache.size >= this.config.assetCacheSize) {
      this.evictLeastRecentlyUsedAsset();
    }
    
    // Add to cache
    this.assetCache.set(key, {
      data,
      loadedAt: Date.now(),
      accessCount: 1,
      lastAccessedAt: Date.now()
    });
    
    console.log(`[ResourceManager] Asset cached: ${key} (cache size: ${this.assetCache.size}/${this.config.assetCacheSize})`);
    
    return data;
  }

  /**
   * Evict least recently used asset from cache
   */
  private evictLeastRecentlyUsedAsset(): void {
    let lruKey: string | undefined;
    let lruTime = Infinity;
    
    for (const [key, entry] of this.assetCache.entries()) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.assetCache.delete(lruKey);
      console.log(`[ResourceManager] Evicted LRU asset: ${lruKey}`);
    }
  }

  /**
   * Clear asset cache
   */
  clearAssetCache(): void {
    const size = this.assetCache.size;
    this.assetCache.clear();
    console.log(`[ResourceManager] Cleared asset cache (${size} entries)`);
  }

  /**
   * Get asset from cache without loading
   */
  getCachedAsset<T>(key: string): T | undefined {
    const cached = this.assetCache.get(key);
    if (cached) {
      const age = Date.now() - cached.loadedAt;
      if (age < this.config.assetCacheTTL) {
        cached.accessCount++;
        cached.lastAccessedAt = Date.now();
        return cached.data as T;
      } else {
        this.assetCache.delete(key);
      }
    }
    return undefined;
  }

  /**
   * Start periodic cleanup of expired resources
   */
  private startPeriodicCleanup(): void {
    const cleanupInterval = setInterval(() => {
      this.cleanupExpiredAssets();
    }, 60 * 1000); // Every minute
    
    this.disposables.push({
      dispose: () => clearInterval(cleanupInterval)
    });
  }

  /**
   * Clean up expired assets from cache
   */
  private cleanupExpiredAssets(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.assetCache.entries()) {
      const age = now - entry.loadedAt;
      if (age >= this.config.assetCacheTTL) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.assetCache.delete(key);
    }
    
    if (toDelete.length > 0) {
      console.log(`[ResourceManager] Cleaned up ${toDelete.length} expired assets`);
    }
  }

  /**
   * Get resource statistics
   */
  getStatistics(): {
    webviews: number;
    decorations: number;
    totalResources: number;
    cachedAssets: number;
    cacheHitRate: number;
    disposeCount: number;
  } {
    const totalCacheAccess = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheAccess > 0 ? (this.cacheHits / totalCacheAccess) * 100 : 0;
    
    return {
      webviews: this.webviewCount,
      decorations: this.decorationCount,
      totalResources: this.resources.size,
      cachedAssets: this.assetCache.size,
      cacheHitRate,
      disposeCount: this.disposeCount
    };
  }

  /**
   * Get detailed resource report
   */
  getResourceReport(): string {
    const stats = this.getStatistics();
    const now = Date.now();
    
    let report = `
📊 Resource Manager Report:

Resources:
- Webviews: ${stats.webviews}/${this.config.maxWebviews}
- Decorations: ${stats.decorations}/${this.config.maxDecorations}
- Total Tracked: ${stats.totalResources}

Asset Cache:
- Cached Assets: ${stats.cachedAssets}/${this.config.assetCacheSize}
- Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%
- Cache Hits: ${this.cacheHits}
- Cache Misses: ${this.cacheMisses}

Performance:
- Total Disposals: ${stats.disposeCount}

Active Resources:
`;
    
    for (const [id, entry] of this.resources.entries()) {
      const age = Math.floor((now - entry.createdAt) / 1000);
      const lastAccess = Math.floor((now - entry.lastAccessedAt) / 1000);
      report += `  - ${entry.type}: ${id.substring(0, 20)}... (age: ${age}s, last access: ${lastAccess}s ago)\n`;
    }
    
    return report.trim();
  }

  /**
   * Dispose all resources and cleanup
   */
  dispose(): void {
    console.log('[ResourceManager] Disposing all resources...');
    
    // Dispose all tracked resources
    for (const [id, entry] of this.resources.entries()) {
      try {
        if (entry.resource && typeof entry.resource.dispose === 'function') {
          entry.resource.dispose();
        }
      } catch (error) {
        console.error(`[ResourceManager] Error disposing ${entry.type} ${id}:`, error);
      }
    }
    
    this.resources.clear();
    this.assetCache.clear();
    
    // Dispose cleanup timers
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    
    console.log('[ResourceManager] Disposed');
  }
}
