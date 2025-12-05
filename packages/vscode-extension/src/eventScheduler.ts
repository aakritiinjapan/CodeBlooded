/**
 * Event Scheduler
 * 
 * Manages timer-based event scheduling with cooldown management and intensity-based frequency adjustment.
 * Works with RandomEventEngine to trigger horror events at appropriate intervals.
 */

import { RandomEventEngine, EventType } from './randomEventEngine';

/**
 * Configuration for event scheduling
 */
export interface SchedulerConfig {
  minCooldownMs: number;        // Minimum time between any events
  maxCooldownMs: number;        // Maximum time between events
  intensityScaling: boolean;    // Whether to scale frequency with intensity
  enabled: boolean;             // Master enable/disable
}

/**
 * Event trigger callback
 */
export type EventTriggerCallback = (eventType: EventType) => Promise<void>;

/**
 * Event Scheduler manages automatic event triggering
 */
export class EventScheduler {
  private randomEngine: RandomEventEngine;
  private config: SchedulerConfig;
  private schedulerTimer: NodeJS.Timeout | undefined;
  private isRunning: boolean = false;
  private currentIntensity: number = 0;
  private lastEventTime: number = 0;
  private eventTriggerCallback: EventTriggerCallback | undefined;
  private sessionEventCount: number = 0;
  private readonly MAX_EVENTS_PER_SESSION = 100; // Safety limit

  constructor(randomEngine: RandomEventEngine, config?: Partial<SchedulerConfig>) {
    this.randomEngine = randomEngine;
    this.config = {
      minCooldownMs: 30000,      // 30 seconds minimum
      maxCooldownMs: 120000,     // 2 minutes maximum
      intensityScaling: true,
      enabled: true,
      ...config
    };

    console.log('[EventScheduler] Initialized with config:', this.config);
  }

  /**
   * Start the event scheduler
   * 
   * @param intensity - Initial horror intensity (0-100)
   * @param callback - Function to call when an event should be triggered
   */
  start(intensity: number, callback: EventTriggerCallback): void {
    if (this.isRunning) {
      console.log('[EventScheduler] Already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[EventScheduler] Scheduler is disabled');
      return;
    }

    this.isRunning = true;
    this.currentIntensity = intensity;
    this.eventTriggerCallback = callback;
    this.lastEventTime = Date.now();
    this.sessionEventCount = 0;

    console.log('[EventScheduler] Started with intensity:', intensity);
    this.scheduleNextEvent();
  }

  /**
   * Stop the event scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = undefined;
    }

    console.log('[EventScheduler] Stopped');
  }

  /**
   * Update current horror intensity
   * 
   * @param intensity - New intensity value (0-100)
   */
  updateIntensity(intensity: number): void {
    const previousIntensity = this.currentIntensity;
    this.currentIntensity = Math.max(0, Math.min(100, intensity));

    if (previousIntensity !== this.currentIntensity) {
      console.log('[EventScheduler] Intensity updated:', {
        previous: previousIntensity,
        current: this.currentIntensity
      });

      // If intensity increased significantly, potentially trigger an event sooner
      if (this.currentIntensity > previousIntensity + 20 && this.isRunning) {
        this.rescheduleForIntensityChange();
      }
    }
  }

  /**
   * Calculate next event delay based on intensity and configuration
   * 
   * @returns Delay in milliseconds until next event
   */
  private calculateNextEventDelay(): number {
    const { minCooldownMs, maxCooldownMs, intensityScaling } = this.config;

    if (!intensityScaling) {
      // Random delay between min and max
      return minCooldownMs + Math.random() * (maxCooldownMs - minCooldownMs);
    }

    // Scale delay based on intensity
    // Higher intensity = shorter delays (more frequent events)
    // Intensity 0 = maxCooldown
    // Intensity 100 = minCooldown
    const intensityFactor = this.currentIntensity / 100;
    const delayRange = maxCooldownMs - minCooldownMs;
    const baseDelay = maxCooldownMs - (delayRange * intensityFactor);

    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    const delay = baseDelay * randomFactor;

    // Clamp to min/max
    return Math.max(minCooldownMs, Math.min(maxCooldownMs, delay));
  }

  /**
   * Schedule the next event
   */
  private scheduleNextEvent(): void {
    if (!this.isRunning) {
      return;
    }

    // Check session limit
    if (this.sessionEventCount >= this.MAX_EVENTS_PER_SESSION) {
      console.log('[EventScheduler] Session event limit reached, pausing scheduler');
      this.stop();
      return;
    }

    const delay = this.calculateNextEventDelay();

    console.log('[EventScheduler] Next event scheduled in', Math.round(delay / 1000), 'seconds');

    this.schedulerTimer = setTimeout(() => {
      this.triggerEvent();
    }, delay);
  }

  /**
   * Trigger an event
   */
  private async triggerEvent(): Promise<void> {
    if (!this.isRunning || !this.eventTriggerCallback) {
      return;
    }

    // Select a random event based on current intensity
    const selectedEvent = this.randomEngine.selectRandomEvent(this.currentIntensity);

    if (selectedEvent) {
      console.log('[EventScheduler] Triggering event:', selectedEvent);

      try {
        // Call the trigger callback
        await this.eventTriggerCallback(selectedEvent);

        // Record the event
        this.randomEngine.recordEvent(selectedEvent, this.currentIntensity);
        this.lastEventTime = Date.now();
        this.sessionEventCount++;

        console.log('[EventScheduler] Event triggered successfully:', {
          type: selectedEvent,
          intensity: this.currentIntensity,
          sessionCount: this.sessionEventCount
        });
      } catch (error) {
        console.error('[EventScheduler] Error triggering event:', error);
      }
    } else {
      console.log('[EventScheduler] No eligible events at current intensity:', this.currentIntensity);
    }

    // Schedule next event
    this.scheduleNextEvent();
  }

  /**
   * Reschedule event due to intensity change
   */
  private rescheduleForIntensityChange(): void {
    if (!this.isRunning) {
      return;
    }

    // Clear current timer
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = undefined;
    }

    // Calculate time since last event
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    const minCooldown = this.config.minCooldownMs;

    // If enough time has passed, trigger immediately
    if (timeSinceLastEvent >= minCooldown) {
      console.log('[EventScheduler] Intensity spike - triggering event immediately');
      this.triggerEvent();
    } else {
      // Otherwise, schedule with reduced delay
      const remainingCooldown = minCooldown - timeSinceLastEvent;
      console.log('[EventScheduler] Intensity spike - rescheduling in', Math.round(remainingCooldown / 1000), 'seconds');
      
      this.schedulerTimer = setTimeout(() => {
        this.triggerEvent();
      }, remainingCooldown);
    }
  }

  /**
   * Update scheduler configuration
   * 
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[EventScheduler] Configuration updated:', this.config);

    // If scheduler was disabled, stop it
    if (!this.config.enabled && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Get current scheduler state
   * 
   * @returns Object containing scheduler state
   */
  getState(): {
    isRunning: boolean;
    currentIntensity: number;
    sessionEventCount: number;
    timeSinceLastEvent: number;
    nextEventIn: number | null;
  } {
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    
    // Calculate approximate time until next event
    let nextEventIn: number | null = null;
    if (this.isRunning && this.schedulerTimer) {
      // This is an approximation since we can't get the exact remaining time from setTimeout
      const expectedDelay = this.calculateNextEventDelay();
      nextEventIn = Math.max(0, expectedDelay - timeSinceLastEvent);
    }

    return {
      isRunning: this.isRunning,
      currentIntensity: this.currentIntensity,
      sessionEventCount: this.sessionEventCount,
      timeSinceLastEvent,
      nextEventIn
    };
  }

  /**
   * Reset session counters
   */
  resetSession(): void {
    this.sessionEventCount = 0;
    this.lastEventTime = Date.now();
    console.log('[EventScheduler] Session reset');
  }

  /**
   * Force trigger an event immediately (bypasses cooldowns)
   * Useful for testing or special circumstances
   * 
   * @param eventType - Optional specific event type to trigger
   */
  async forceTrigger(eventType?: EventType): Promise<void> {
    if (!this.eventTriggerCallback) {
      console.warn('[EventScheduler] No trigger callback set');
      return;
    }

    const selectedEvent = eventType || this.randomEngine.selectRandomEvent(this.currentIntensity);

    if (selectedEvent) {
      console.log('[EventScheduler] Force triggering event:', selectedEvent);

      try {
        await this.eventTriggerCallback(selectedEvent);
        this.randomEngine.recordEvent(selectedEvent, this.currentIntensity);
        this.lastEventTime = Date.now();
        this.sessionEventCount++;
      } catch (error) {
        console.error('[EventScheduler] Error force triggering event:', error);
      }
    }
  }

  /**
   * Check if scheduler is currently running
   * 
   * @returns True if scheduler is active
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get time until next event can be triggered (respecting cooldowns)
   * 
   * @returns Milliseconds until next event is eligible, or 0 if ready
   */
  getTimeUntilNextEligibleEvent(): number {
    const timeSinceLastEvent = Date.now() - this.lastEventTime;
    const minCooldown = this.config.minCooldownMs;

    if (timeSinceLastEvent >= minCooldown) {
      return 0;
    }

    return minCooldown - timeSinceLastEvent;
  }

  /**
   * Dispose scheduler and clean up resources
   */
  dispose(): void {
    this.stop();
    console.log('[EventScheduler] Disposed');
  }
}
