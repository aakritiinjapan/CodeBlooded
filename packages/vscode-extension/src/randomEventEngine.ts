/**
 * Random Event Engine
 * 
 * Generates unpredictable horror events with intelligent timing and probability calculations.
 * Implements weighted random selection, event history tracking, and exponential backoff.
 */

import * as crypto from 'crypto';
import { throttle, ValueCache, PerformanceMonitor } from './performanceOptimizer';

/**
 * Types of horror events that can be triggered
 */
export enum EventType {
  Jumpscare = 'jumpscare',
  ScreenShake = 'screen_shake',
  VHSDistortion = 'vhs_distortion',
  ChromaticAberration = 'chromatic_aberration',
  Glitch = 'glitch',
  PhantomTyping = 'phantom_typing',
  EntitySpawn = 'entity_spawn',
  Whisper = 'whisper',
  ContextTrigger = 'context_trigger',
  TimeDilation = 'time_dilation',
  EasterEgg = 'easter_egg'
}

/**
 * Record of a triggered event
 */
export interface EventRecord {
  type: EventType;
  timestamp: number;
  intensity: number;
  variant?: string;
}

/**
 * Configuration for event probability
 */
export interface EventProbability {
  baseChance: number;           // 0-1 base probability
  intensityMultiplier: number;  // How much intensity affects probability
  cooldownSeconds: number;      // Minimum time between events of this type
  maxPerSession: number;        // Maximum occurrences per session
  weight: number;               // Weight for random selection (higher = more likely)
}

/**
 * Event configuration with probability settings
 */
export interface EventConfig {
  type: EventType;
  probability: EventProbability;
  enabled: boolean;
}

/**
 * Random Event Engine manages unpredictable horror event generation
 */
export class RandomEventEngine {
  private eventHistory: EventRecord[] = [];
  private readonly MAX_HISTORY_SIZE = 10;
  private eventConfigs: Map<EventType, EventConfig>;
  private sessionStartTime: number;
  private eventCounters: Map<EventType, number> = new Map();
  
  // Performance optimizations
  private probabilityCache: ValueCache<number>;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.sessionStartTime = Date.now();
    this.eventConfigs = this.initializeEventConfigs();
    
    // Initialize performance optimizations
    this.probabilityCache = new ValueCache<number>(100); // 100ms cache TTL
    this.performanceMonitor = new PerformanceMonitor(100);
    
    console.log('[RandomEventEngine] Initialized with performance optimizations');
  }

  /**
   * Initialize default event configurations
   */
  private initializeEventConfigs(): Map<EventType, EventConfig> {
    const configs = new Map<EventType, EventConfig>();

    // Jumpscare - rare but impactful
    configs.set(EventType.Jumpscare, {
      type: EventType.Jumpscare,
      probability: {
        baseChance: 0.10,
        intensityMultiplier: 2.0,
        cooldownSeconds: 300, // 5 minutes
        maxPerSession: 5,
        weight: 1.0
      },
      enabled: true
    });

    // Screen Shake - moderate frequency
    configs.set(EventType.ScreenShake, {
      type: EventType.ScreenShake,
      probability: {
        baseChance: 0.20,
        intensityMultiplier: 1.5,
        cooldownSeconds: 180, // 3 minutes
        maxPerSession: 10,
        weight: 2.0
      },
      enabled: true
    });

    // VHS Distortion - atmospheric
    configs.set(EventType.VHSDistortion, {
      type: EventType.VHSDistortion,
      probability: {
        baseChance: 0.20,
        intensityMultiplier: 1.3,
        cooldownSeconds: 180, // 3 minutes
        maxPerSession: 10,
        weight: 2.5
      },
      enabled: true
    });

    // Chromatic Aberration - high intensity only
    configs.set(EventType.ChromaticAberration, {
      type: EventType.ChromaticAberration,
      probability: {
        baseChance: 0.15,
        intensityMultiplier: 2.5,
        cooldownSeconds: 240, // 4 minutes
        maxPerSession: 8,
        weight: 1.5
      },
      enabled: true
    });

    // Glitch - moderate frequency
    configs.set(EventType.Glitch, {
      type: EventType.Glitch,
      probability: {
        baseChance: 0.20,
        intensityMultiplier: 1.2,
        cooldownSeconds: 150, // 2.5 minutes
        maxPerSession: 12,
        weight: 3.0
      },
      enabled: true
    });

    // Phantom Typing - unsettling
    configs.set(EventType.PhantomTyping, {
      type: EventType.PhantomTyping,
      probability: {
        baseChance: 0.08,
        intensityMultiplier: 1.8,
        cooldownSeconds: 300, // 5 minutes
        maxPerSession: 5,
        weight: 1.0
      },
      enabled: true
    });

    // Entity Spawn - creepy presence
    configs.set(EventType.EntitySpawn, {
      type: EventType.EntitySpawn,
      probability: {
        baseChance: 0.15,
        intensityMultiplier: 1.6,
        cooldownSeconds: 210, // 3.5 minutes
        maxPerSession: 8,
        weight: 1.5
      },
      enabled: true
    });

    // Whisper - rare and disturbing
    configs.set(EventType.Whisper, {
      type: EventType.Whisper,
      probability: {
        baseChance: 0.10,
        intensityMultiplier: 1.7,
        cooldownSeconds: 240, // 4 minutes
        maxPerSession: 6,
        weight: 1.2
      },
      enabled: true
    });

    // Time Dilation - very rare
    configs.set(EventType.TimeDilation, {
      type: EventType.TimeDilation,
      probability: {
        baseChance: 0.05,
        intensityMultiplier: 2.2,
        cooldownSeconds: 420, // 7 minutes
        maxPerSession: 3,
        weight: 0.5
      },
      enabled: true
    });

    return configs;
  }

  /**
   * Calculate event probability based on intensity, time, and history
   * 
   * @param eventType - Type of event to calculate probability for
   * @param intensity - Current horror intensity (0-100)
   * @returns Probability value between 0 and 1
   */
  calculateEventProbability(eventType: EventType, intensity: number): number {
    // Check cache first
    const cacheKey = `${eventType}-${intensity}`;
    const cached = this.probabilityCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    // Track performance
    const endTiming = this.performanceMonitor.start('calculateEventProbability');
    
    const config = this.eventConfigs.get(eventType);
    if (!config || !config.enabled) {
      endTiming();
      return 0;
    }

    const { baseChance, intensityMultiplier, cooldownSeconds, maxPerSession } = config.probability;

    // Check if event has reached session limit
    const eventCount = this.eventCounters.get(eventType) || 0;
    if (eventCount >= maxPerSession) {
      endTiming();
      return 0;
    }

    // Check cooldown
    const timeSinceLastEvent = this.getTimeSinceLastEvent(eventType);
    if (timeSinceLastEvent < cooldownSeconds * 1000) {
      endTiming();
      return 0;
    }

    // Calculate intensity factor (0-100 -> 0-1)
    const intensityFactor = (intensity / 100) * intensityMultiplier;

    // Calculate time factor with exponential backoff
    // Events become more likely the longer it's been since the last one
    const timeFactor = Math.min(timeSinceLastEvent / (cooldownSeconds * 1000 * 2), 2.0);

    // Calculate repetition penalty
    const repetitionPenalty = this.getRepetitionPenalty(eventType);

    // Final probability calculation
    const probability = baseChance * (1 + intensityFactor) * timeFactor * repetitionPenalty;

    // Clamp between 0 and 1
    const result = Math.max(0, Math.min(1, probability));
    
    // Cache the result
    this.probabilityCache.set(cacheKey, result);
    
    endTiming();
    return result;
  }



  /**
   * Get time since last event of a specific type
   * 
   * @param eventType - Type of event to check
   * @returns Time in milliseconds since last event, or Infinity if never occurred
   */
  private getTimeSinceLastEvent(eventType: EventType): number {
    const lastEvent = this.eventHistory
      .slice()
      .reverse()
      .find(event => event.type === eventType);

    if (!lastEvent) {
      return Infinity;
    }

    return Date.now() - lastEvent.timestamp;
  }

  /**
   * Calculate repetition penalty to prevent same events from occurring too frequently
   * 
   * @param eventType - Type of event to check
   * @returns Penalty multiplier (0-1, where 1 = no penalty)
   */
  private getRepetitionPenalty(eventType: EventType): number {
    const recentEvents = this.eventHistory.slice(-5); // Last 5 events
    const occurrences = recentEvents.filter(event => event.type === eventType).length;

    // More occurrences = higher penalty
    // 0 occurrences = 1.0 (no penalty)
    // 1 occurrence = 0.7
    // 2 occurrences = 0.4
    // 3+ occurrences = 0.1
    switch (occurrences) {
      case 0:
        return 1.0;
      case 1:
        return 0.7;
      case 2:
        return 0.4;
      default:
        return 0.1;
    }
  }

  /**
   * Generate cryptographically secure random number between 0 and 1
   * 
   * @returns Random number [0, 1)
   */
  private secureRandom(): number {
    const buffer = crypto.randomBytes(4);
    const value = buffer.readUInt32BE(0);
    return value / 0xFFFFFFFF;
  }

  /**
   * Weighted random selection from available events
   * 
   * @param intensity - Current horror intensity (0-100)
   * @returns Selected event type, or null if no events are eligible
   */
  selectRandomEvent(intensity: number): EventType | null {
    // Get all eligible events with their probabilities
    const eligibleEvents: Array<{ type: EventType; weight: number; probability: number }> = [];

    for (const [eventType, config] of this.eventConfigs.entries()) {
      if (!config.enabled) {
        continue;
      }

      const probability = this.calculateEventProbability(eventType, intensity);
      if (probability > 0) {
        eligibleEvents.push({
          type: eventType,
          weight: config.probability.weight,
          probability
        });
      }
    }

    if (eligibleEvents.length === 0) {
      return null;
    }

    // Calculate weighted probabilities
    const weightedEvents = eligibleEvents.map(event => ({
      type: event.type,
      weight: event.weight * event.probability
    }));

    // Calculate total weight
    const totalWeight = weightedEvents.reduce((sum, event) => sum + event.weight, 0);

    if (totalWeight === 0) {
      return null;
    }

    // Select using weighted random
    const random = this.secureRandom() * totalWeight;
    let cumulativeWeight = 0;

    for (const event of weightedEvents) {
      cumulativeWeight += event.weight;
      if (random <= cumulativeWeight) {
        return event.type;
      }
    }

    // Fallback to last event (shouldn't reach here)
    return weightedEvents[weightedEvents.length - 1].type;
  }

  /**
   * Record an event in history
   * 
   * @param eventType - Type of event that occurred
   * @param intensity - Horror intensity at time of event
   * @param variant - Optional variant identifier
   */
  recordEvent(eventType: EventType, intensity: number, variant?: string): void {
    const record: EventRecord = {
      type: eventType,
      timestamp: Date.now(),
      intensity,
      variant
    };

    this.eventHistory.push(record);

    // Maintain history size limit
    if (this.eventHistory.length > this.MAX_HISTORY_SIZE) {
      this.eventHistory.shift();
    }

    // Increment event counter
    const currentCount = this.eventCounters.get(eventType) || 0;
    this.eventCounters.set(eventType, currentCount + 1);

    console.log('[RandomEventEngine] Event recorded:', {
      type: eventType,
      intensity,
      variant,
      historySize: this.eventHistory.length,
      sessionCount: currentCount + 1
    });
  }

  /**
   * Get event history
   * 
   * @returns Array of event records
   */
  getEventHistory(): EventRecord[] {
    return [...this.eventHistory];
  }

  /**
   * Get last N events from history
   * 
   * @param count - Number of events to retrieve
   * @returns Array of most recent event records
   */
  getRecentEvents(count: number): EventRecord[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Check if an event type is on cooldown
   * 
   * @param eventType - Type of event to check
   * @returns True if event is on cooldown
   */
  isOnCooldown(eventType: EventType): boolean {
    const config = this.eventConfigs.get(eventType);
    if (!config) {
      return true;
    }

    const timeSinceLastEvent = this.getTimeSinceLastEvent(eventType);
    return timeSinceLastEvent < config.probability.cooldownSeconds * 1000;
  }

  /**
   * Get remaining cooldown time for an event type
   * 
   * @param eventType - Type of event to check
   * @returns Remaining cooldown in milliseconds, or 0 if not on cooldown
   */
  getRemainingCooldown(eventType: EventType): number {
    const config = this.eventConfigs.get(eventType);
    if (!config) {
      return 0;
    }

    const timeSinceLastEvent = this.getTimeSinceLastEvent(eventType);
    const cooldownMs = config.probability.cooldownSeconds * 1000;

    if (timeSinceLastEvent >= cooldownMs) {
      return 0;
    }

    return cooldownMs - timeSinceLastEvent;
  }

  /**
   * Enable or disable a specific event type
   * 
   * @param eventType - Type of event to configure
   * @param enabled - Whether the event should be enabled
   */
  setEventEnabled(eventType: EventType, enabled: boolean): void {
    const config = this.eventConfigs.get(eventType);
    if (config) {
      config.enabled = enabled;
      console.log(`[RandomEventEngine] Event ${eventType} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Update event configuration
   * 
   * @param eventType - Type of event to configure
   * @param probability - New probability settings
   */
  updateEventConfig(eventType: EventType, probability: Partial<EventProbability>): void {
    const config = this.eventConfigs.get(eventType);
    if (config) {
      config.probability = { ...config.probability, ...probability };
      console.log(`[RandomEventEngine] Event ${eventType} config updated:`, probability);
    }
  }

  /**
   * Reset session counters and history
   */
  resetSession(): void {
    this.eventHistory = [];
    this.eventCounters.clear();
    this.sessionStartTime = Date.now();
    console.log('[RandomEventEngine] Session reset');
  }

  /**
   * Get session statistics
   * 
   * @returns Object containing session stats
   */
  getSessionStats(): {
    duration: number;
    totalEvents: number;
    eventCounts: Map<EventType, number>;
    averageIntensity: number;
  } {
    const duration = Date.now() - this.sessionStartTime;
    const totalEvents = this.eventHistory.length;
    const averageIntensity = totalEvents > 0
      ? this.eventHistory.reduce((sum, event) => sum + event.intensity, 0) / totalEvents
      : 0;

    return {
      duration,
      totalEvents,
      eventCounts: new Map(this.eventCounters),
      averageIntensity
    };
  }

  /**
   * Clear all event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    console.log('[RandomEventEngine] History cleared');
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    cacheSize: number;
    performanceReport: string;
  } {
    return {
      cacheSize: this.probabilityCache.size(),
      performanceReport: this.performanceMonitor.getReport()
    };
  }

  /**
   * Clear performance caches
   */
  clearCaches(): void {
    this.probabilityCache.clear();
    this.performanceMonitor.clear();
    console.log('[RandomEventEngine] Performance caches cleared');
  }

  /**
   * Cleanup expired cache entries
   */
  cleanup(): void {
    this.probabilityCache.cleanup();
  }
}
