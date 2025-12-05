/**
 * Horror Engine - Central coordinator for psychological horror features
 * 
 * Manages horror intensity, session tracking, and coordinates all horror effect managers.
 * Implements progressive escalation system that increases tension over time.
 */

import * as vscode from 'vscode';
import { RandomEventEngine } from './randomEventEngine';
import { SafetyManager } from './safetyManager';
import { ErrorHandler, ErrorContext } from './errorHandler';
import { ResourceManager } from './resourceManager';

/**
 * Performance metrics for effect triggers
 */
interface PerformanceMetrics {
  component: string;
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

/**
 * Event log entry for debugging
 */
interface EventLogEntry {
  timestamp: number;
  eventType: string;
  component: string;
  intensity: number;
  success: boolean;
  duration?: number;
}

/**
 * Horror configuration loaded from VS Code settings
 */
export interface HorrorConfig {
  enabled: boolean;
  intensity: number;              // 0-100 user-configured base intensity
  safeMode: boolean;
  
  // Feature toggles
  enableJumpscares: boolean;
  enableScreenEffects: boolean;
  enablePhantomEvents: boolean;
  enableEntityPresence: boolean;
  enableEasterEggs: boolean;
  
  // Accessibility
  respectReduceMotion: boolean;
  maxFlashFrequency: number;
  
  // Advanced
  jumpscareCooldownMin: number;
  jumpscareCooldownMax: number;
  escalationRate: number;         // Intensity increase per minute
}

/**
 * Horror engine state
 */
export interface HorrorEngineState {
  intensity: number;              // Current dynamic intensity (0-100)
  sessionStartTime: number;
  lastEventTime: number;
  lastActivityTime: number;
  isActive: boolean;
  isSafeMode: boolean;
  userConfig: HorrorConfig;
}

/**
 * Effect manager interface - all horror effect managers should implement this
 */
export interface IEffectManager {
  initialize(): Promise<void>;
  dispose(): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}

/**
 * Horror Engine - Central coordinator for all psychological horror features
 */
export class HorrorEngine {
  private context: vscode.ExtensionContext;
  private safetyManager: SafetyManager;
  private randomEventEngine: RandomEventEngine;
  private errorHandler: ErrorHandler;
  private resourceManager: ResourceManager;
  
  // State
  private state: HorrorEngineState;
  
  // Effect managers registry
  private effectManagers: Map<string, IEffectManager> = new Map();
  
  // Timers
  private escalationTimer: NodeJS.Timeout | undefined;
  private inactivityCheckTimer: NodeJS.Timeout | undefined;
  private phantomTypingCheckTimer: NodeJS.Timeout | undefined;
  private whisperingVariablesCheckTimer: NodeJS.Timeout | undefined;
  private timeDilationCheckTimer: NodeJS.Timeout | undefined;
  private randomEventTimer: NodeJS.Timeout | undefined;
  
  // Performance tracking
  private performanceMetrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 metrics
  
  // Event logging
  private eventLog: EventLogEntry[] = [];
  private readonly MAX_EVENT_LOG = 50; // Keep last 50 events
  
  // Event emitters
  private onIntensityChangedEmitter = new vscode.EventEmitter<number>();
  public readonly onIntensityChanged = this.onIntensityChangedEmitter.event;
  
  private onSessionResetEmitter = new vscode.EventEmitter<void>();
  public readonly onSessionReset = this.onSessionResetEmitter.event;

  constructor(
    context: vscode.ExtensionContext,
    safetyManager: SafetyManager,
    randomEventEngine: RandomEventEngine
  ) {
    this.context = context;
    this.safetyManager = safetyManager;
    this.randomEventEngine = randomEventEngine;
    this.errorHandler = new ErrorHandler();
    this.resourceManager = new ResourceManager({
      maxWebviews: 2,
      maxDecorations: 50,
      assetCacheSize: 20,
      assetCacheTTL: 5 * 60 * 1000
    });
    
    // Initialize state
    const config = this.loadConfiguration();
    this.state = {
      intensity: 20, // Start at 20% intensity
      sessionStartTime: Date.now(),
      lastEventTime: Date.now(),
      lastActivityTime: Date.now(),
      isActive: false,
      isSafeMode: config.safeMode || safetyManager.isSafeModeActive(),
      userConfig: config
    };
    
    console.log('[HorrorEngine] Initialized', {
      intensity: this.state.intensity,
      safeMode: this.state.isSafeMode,
      config: this.state.userConfig
    });
  }

  /**
   * Load horror configuration from VS Code settings
   */
  private loadConfiguration(): HorrorConfig {
    const config = vscode.workspace.getConfiguration('codeblooded');
    
    return {
      enabled: config.get<boolean>('horror.enabled', false),
      intensity: config.get<number>('horror.intensity', 50),
      safeMode: config.get<boolean>('horror.safeMode', true),
      
      // Feature toggles - load from configuration
      enableJumpscares: config.get<boolean>('horror.enableJumpscares', true),
      enableScreenEffects: config.get<boolean>('horror.enableScreenEffects', true),
      enablePhantomEvents: config.get<boolean>('horror.enablePhantomEvents', true),
      enableEntityPresence: config.get<boolean>('horror.enableEntityPresence', true),
      enableEasterEggs: config.get<boolean>('horror.enableEasterEggs', true),
      
      // Accessibility
      respectReduceMotion: config.get<boolean>('safety.respectReduceMotion', true),
      maxFlashFrequency: config.get<number>('safety.maxFlashFrequency', 3),
      
      // Advanced
      jumpscareCooldownMin: config.get<number>('advanced.jumpscareCooldownMin', 30),
      jumpscareCooldownMax: config.get<number>('advanced.jumpscareCooldownMax', 120),
      escalationRate: config.get<number>('advanced.escalationRate', 5)
    };
  }

  /**
   * Validate configuration values
   */
  private validateConfiguration(config: HorrorConfig): HorrorConfig {
    return {
      ...config,
      intensity: Math.max(0, Math.min(100, config.intensity)),
      escalationRate: Math.max(0, Math.min(20, config.escalationRate)),
      maxFlashFrequency: Math.max(1, Math.min(10, config.maxFlashFrequency)),
      jumpscareCooldownMin: Math.max(10, config.jumpscareCooldownMin),
      jumpscareCooldownMax: Math.max(config.jumpscareCooldownMin, config.jumpscareCooldownMax)
    };
  }

  /**
   * Initialize the horror engine
   */
  async initialize(): Promise<void> {
    console.log('[HorrorEngine] Starting initialization...');
    
    // Load and validate configuration
    this.state.userConfig = this.validateConfiguration(this.loadConfiguration());
    
    // Check if horror features should be enabled
    if (!this.state.userConfig.enabled || this.state.isSafeMode) {
      console.log('[HorrorEngine] Horror features disabled', {
        enabled: this.state.userConfig.enabled,
        safeMode: this.state.isSafeMode
      });
      return;
    }
    
    // Initialize all registered effect managers with error handling
    for (const [name, manager] of this.effectManagers.entries()) {
      await this.errorHandler.safeExecute(
        async () => {
          await manager.initialize();
          console.log(`[HorrorEngine] Initialized effect manager: ${name}`);
        },
        {
          component: name,
          operation: 'initialize'
        }
      );
    }
    
    // Start the session
    this.startSession();
    
    // Apply effect manager states based on configuration
    this.updateEffectManagerStates();
    
    // Listen for safe mode changes
    this.safetyManager.onSafeModeChanged(isSafeMode => {
      this.handleSafeModeChange(isSafeMode);
    });
    
    // Listen for accessibility changes
    this.safetyManager.onAccessibilityChanged(accessibilityState => {
      this.handleAccessibilityChange(accessibilityState);
    });
    
    // Listen for debugging changes
    this.safetyManager.onDebuggingChanged(isDebugging => {
      this.handleDebuggingChange(isDebugging);
    });
    
    // Listen for configuration changes
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('codeblooded.horror') ||
            event.affectsConfiguration('codeblooded.safety') ||
            event.affectsConfiguration('codeblooded.advanced')) {
          this.handleConfigurationChange();
        }
      })
    );
    
    console.log('[HorrorEngine] Initialization complete');
  }

  /**
   * Register an effect manager
   */
  registerEffectManager(name: string, manager: IEffectManager): void {
    this.effectManagers.set(name, manager);
    console.log(`[HorrorEngine] Registered effect manager: ${name}`);
    
    // If horror engine is already active, initialize the manager
    if (this.state.isActive && !this.state.isSafeMode && this.state.userConfig.enabled) {
      manager.initialize().catch(error => {
        console.error(`[HorrorEngine] Failed to initialize ${name} during registration:`, error);
      });
    }
  }

  /**
   * Unregister an effect manager
   */
  unregisterEffectManager(name: string): void {
    const manager = this.effectManagers.get(name);
    if (manager) {
      manager.dispose();
      this.effectManagers.delete(name);
      console.log(`[HorrorEngine] Unregistered effect manager: ${name}`);
    }
  }

  /**
   * Get an effect manager by name
   */
  getEffectManager(name: string): IEffectManager | undefined {
    return this.effectManagers.get(name);
  }

  /**
   * Start a new horror session
   */
  private startSession(): void {
    console.log('[HorrorEngine] Starting new session');
    
    this.state.sessionStartTime = Date.now();
    this.state.lastActivityTime = Date.now();
    this.state.intensity = 20; // Reset to starting intensity
    this.state.isActive = true;
    
    // Reset random event engine
    this.randomEventEngine.resetSession();
    
    // Start escalation timer (check every 2 minutes)
    this.startEscalationTimer();
    
    // Start inactivity check timer (check every 30 seconds)
    this.startInactivityCheckTimer();
    
    // Start phantom typing check timer (check every 15 seconds)
    this.startPhantomTypingCheckTimer();
    
    // Start whispering variables check timer (check every 20 seconds)
    this.startWhisperingVariablesCheckTimer();
    
    // Start time dilation check timer (check every 2-5 minutes)
    this.startTimeDilationCheckTimer();
    
    // Start random event timer for jumpscares, screen shake, VHS, etc.
    this.startRandomEventTimer();
    
    this.onSessionResetEmitter.fire();
    this.onIntensityChangedEmitter.fire(this.state.intensity);
  }

  /**
   * Start the progressive escalation timer
   */
  private startEscalationTimer(): void {
    if (this.escalationTimer) {
      clearInterval(this.escalationTimer);
    }
    
    // Check every 2 minutes for intensity increase
    this.escalationTimer = setInterval(() => {
      this.updateIntensity();
    }, 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Start the inactivity check timer
   */
  private startInactivityCheckTimer(): void {
    if (this.inactivityCheckTimer) {
      clearInterval(this.inactivityCheckTimer);
    }
    
    // Check every 30 seconds for inactivity
    this.inactivityCheckTimer = setInterval(() => {
      this.checkInactivity();
    }, 30 * 1000); // 30 seconds
  }

  /**
   * Start the phantom typing check timer
   */
  private startPhantomTypingCheckTimer(): void {
    if (this.phantomTypingCheckTimer) {
      clearInterval(this.phantomTypingCheckTimer);
    }
    
    // Check every 45 seconds for phantom typing trigger
    this.phantomTypingCheckTimer = setInterval(() => {
      this.checkPhantomTypingTrigger();
    }, 45 * 1000); // 45 seconds
  }

  /**
   * Start the whispering variables check timer
   */
  private startWhisperingVariablesCheckTimer(): void {
    if (this.whisperingVariablesCheckTimer) {
      clearInterval(this.whisperingVariablesCheckTimer);
    }
    
    // Check every 60 seconds for whispering variables trigger
    this.whisperingVariablesCheckTimer = setInterval(() => {
      this.checkWhisperingVariablesTrigger();
    }, 60 * 1000); // 60 seconds
  }

  /**
   * Check if phantom typing should be triggered
   */
  private checkPhantomTypingTrigger(): void {
    if (!this.isActive() || !this.state.userConfig.enablePhantomEvents) {
      return;
    }

    const phantomTypingManager = this.effectManagers.get('phantomTyping');
    if (!phantomTypingManager) {
      return;
    }

    // Cast to access phantom typing specific methods
    const manager = phantomTypingManager as any;
    
    // Check if phantom typing can be triggered based on intensity
    if (manager.canTrigger && manager.canTrigger(this.state.intensity)) {
      console.log('[HorrorEngine] Triggering phantom typing event');
      this.errorHandler.safeExecute(
        async () => await manager.triggerPhantomTyping(),
        {
          component: 'phantomTyping',
          operation: 'triggerPhantomTyping',
          intensity: this.state.intensity
        }
      );
    }
  }

  /**
   * Check if whispering variables should be triggered
   */
  private checkWhisperingVariablesTrigger(): void {
    if (!this.isActive() || !this.state.userConfig.enablePhantomEvents) {
      return;
    }

    const whisperingVariablesManager = this.effectManagers.get('whisperingVariables');
    if (!whisperingVariablesManager) {
      return;
    }

    // Cast to access whispering variables specific methods
    const manager = whisperingVariablesManager as any;
    
    // Check if whispering can be triggered based on intensity
    if (manager.canTrigger && manager.canTrigger(this.state.intensity)) {
      console.log('[HorrorEngine] Triggering whispering variables event');
      this.errorHandler.safeExecute(
        async () => await manager.applyWhisper(),
        {
          component: 'whisperingVariables',
          operation: 'applyWhisper',
          intensity: this.state.intensity
        }
      );
    }
  }

  /**
   * Start the time dilation check timer
   */
  private startTimeDilationCheckTimer(): void {
    if (this.timeDilationCheckTimer) {
      clearInterval(this.timeDilationCheckTimer);
    }
    
    // Check every 2-5 minutes (random interval)
    const checkInterval = (120 + Math.random() * 180) * 1000; // 2-5 minutes
    
    this.timeDilationCheckTimer = setInterval(() => {
      this.checkTimeDilationTrigger();
      
      // Reset timer with new random interval
      this.startTimeDilationCheckTimer();
    }, checkInterval);
  }

  /**
   * Check if time dilation should be triggered
   */
  private checkTimeDilationTrigger(): void {
    if (!this.isActive() || !this.state.userConfig.enableScreenEffects) {
      return;
    }

    const timeDilationManager = this.effectManagers.get('timeDilation');
    if (!timeDilationManager) {
      return;
    }

    // Cast to access time dilation specific methods
    const manager = timeDilationManager as any;
    
    // Check if time dilation can be triggered based on intensity
    if (manager.canTrigger && manager.canTrigger(this.state.intensity)) {
      console.log('[HorrorEngine] Triggering time dilation event');
      this.errorHandler.safeExecute(
        async () => await manager.triggerTimeDilation(this.state.intensity / 100),
        {
          component: 'timeDilation',
          operation: 'triggerTimeDilation',
          intensity: this.state.intensity
        }
      );
    }
  }

  // Track showcase mode - show effects quickly at startup, then slow down
  private showcaseMode: boolean = true;
  private showcaseEventsShown: Set<string> = new Set();
  private lastAnyEventTime: number = 0;
  private readonly GLOBAL_COOLDOWN = 60 * 1000; // 60 seconds between ANY effects

  /**
   * Start the random event timer for jumpscares, screen effects, etc.
   * Showcase mode: Show effects quickly at first (15-30 seconds)
   * Normal mode: Events trigger every 2.5-3.5 minutes
   */
  private startRandomEventTimer(): void {
    if (this.randomEventTimer) {
      clearTimeout(this.randomEventTimer);
    }

    let minInterval: number;
    let maxInterval: number;

    if (this.showcaseMode) {
      // Showcase mode: faster intervals to show user the effects (15-30 seconds)
      minInterval = 15 * 1000;
      maxInterval = 30 * 1000;
    } else {
      // Normal mode: longer intervals (2.5-3.5 minutes)
      minInterval = 150 * 1000; // 2.5 minutes
      maxInterval = 210 * 1000; // 3.5 minutes
    }

    const interval = minInterval + Math.random() * (maxInterval - minInterval);
    
    console.log(`[HorrorEngine] Next random event in ${Math.round(interval / 1000)} seconds (showcase: ${this.showcaseMode})`);

    this.randomEventTimer = setTimeout(() => {
      this.triggerRandomEvent();
      // Reschedule next event
      this.startRandomEventTimer();
    }, interval);
  }

  /**
   * Trigger a random horror event (jumpscare, screen shake, VHS, etc.)
   */
  private async triggerRandomEvent(): Promise<void> {
    if (!this.isActive() || this.state.isSafeMode) {
      return;
    }

    // Check global cooldown - prevent effects from triggering too close together
    const timeSinceLastEvent = Date.now() - this.lastAnyEventTime;
    if (this.lastAnyEventTime > 0 && timeSinceLastEvent < this.GLOBAL_COOLDOWN) {
      console.log(`[HorrorEngine] Global cooldown active, ${Math.round((this.GLOBAL_COOLDOWN - timeSinceLastEvent) / 1000)}s remaining`);
      return;
    }

    // Select a random event type using the random event engine
    let eventType = this.randomEventEngine.selectRandomEvent(this.state.intensity);

    // In showcase mode, prefer events that haven't been shown yet
    if (this.showcaseMode && eventType) {
      const allEventTypes = ['screen_shake', 'vhs_distortion', 'chromatic_aberration', 'glitch', 'entity_spawn'];
      const unshownEvents = allEventTypes.filter(e => !this.showcaseEventsShown.has(e));
      
      if (unshownEvents.length > 0) {
        // Pick a random unshown event
        eventType = unshownEvents[Math.floor(Math.random() * unshownEvents.length)] as any;
      } else {
        // All effects showcased, switch to normal mode
        console.log('[HorrorEngine] Showcase complete, switching to normal mode');
        this.showcaseMode = false;
      }
    }
    
    if (!eventType) {
      console.log('[HorrorEngine] No eligible random event at current intensity');
      return;
    }

    console.log(`[HorrorEngine] Triggering random event: ${eventType}`);

    let success = false;
    try {
      // Map event types to coordinated events
      switch (eventType) {
        case 'jumpscare':
          if (this.state.userConfig.enableJumpscares) {
            await this.triggerCoordinatedEvent('jumpscare');
            success = true;
          }
          break;
        case 'screen_shake':
          if (this.state.userConfig.enableScreenEffects) {
            const screenDistortion = this.effectManagers.get('screenDistortion') as any;
            if (screenDistortion) {
              screenDistortion.setEnabled(true);
              // Use high intensity (0.7-1.0) for noticeable shake
              await screenDistortion.triggerShake(0.7 + (this.state.intensity / 100) * 0.3);
              success = true;
            }
          }
          break;
        case 'vhs_distortion':
          if (this.state.userConfig.enableScreenEffects) {
            const screenDistortion = this.effectManagers.get('screenDistortion') as any;
            if (screenDistortion) {
              screenDistortion.setEnabled(true);
              // Longer duration: 3-5 seconds
              const duration = 3000 + (this.state.intensity * 20);
              await screenDistortion.applyVHS(duration);
              success = true;
            }
          }
          break;
        case 'chromatic_aberration':
          if (this.state.userConfig.enableScreenEffects) {
            const screenDistortion = this.effectManagers.get('screenDistortion') as any;
            if (screenDistortion) {
              screenDistortion.setEnabled(true);
              // Longer duration and higher intensity
              const duration = 2500 + (this.state.intensity * 25);
              await screenDistortion.applyChromaticAberration(duration, 0.6 + (this.state.intensity / 100) * 0.4);
              success = true;
            }
          }
          break;
        case 'glitch':
          if (this.state.userConfig.enableScreenEffects) {
            const screenDistortion = this.effectManagers.get('screenDistortion') as any;
            if (screenDistortion) {
              screenDistortion.setEnabled(true);
              // Longer glitch: 2-4 seconds
              const duration = 2000 + (this.state.intensity * 20);
              await screenDistortion.applyGlitch(duration);
              success = true;
            }
          }
          break;
        case 'entity_spawn':
          if (this.state.userConfig.enableEntityPresence) {
            const entityManager = this.effectManagers.get('entityPresence') as any;
            if (entityManager) {
              entityManager.setEnabled(true);
              // Higher intensity for more visible eye
              entityManager.spawnEye(70 + (this.state.intensity / 100) * 30);
              success = true;
            }
          }
          break;
        default:
          // For other events, trigger a random ambient effect
          await this.triggerCoordinatedEvent('ambient');
          success = true;
          break;
      }

      // Record the event
      this.randomEventEngine.recordEvent(eventType, this.state.intensity);
      this.state.lastEventTime = Date.now();
      
      // Update global cooldown tracker
      if (success) {
        this.lastAnyEventTime = Date.now();
        
        // Track showcased events
        if (this.showcaseMode) {
          this.showcaseEventsShown.add(eventType);
          console.log(`[HorrorEngine] Showcased: ${eventType} (${this.showcaseEventsShown.size}/5 effects shown)`);
        }
      }
      
      console.log(`[HorrorEngine] Event: ${eventType} (intensity: ${this.state.intensity}) - ${success ? 'Success' : 'Failed/Disabled'}`);
      
    } catch (error) {
      console.error('[HorrorEngine] Error triggering random event:', error);
    }
  }

  /**
   * Update intensity based on session duration (progressive escalation)
   */
  private updateIntensity(): void {
    if (!this.state.isActive || this.state.isSafeMode) {
      return;
    }
    
    const sessionDuration = Date.now() - this.state.sessionStartTime;
    const minutesElapsed = sessionDuration / (60 * 1000);
    
    // Calculate intensity increase: 5% every 2 minutes
    const escalationIntervals = Math.floor(minutesElapsed / 2);
    const baseIntensity = 20;
    const calculatedIntensity = baseIntensity + (escalationIntervals * this.state.userConfig.escalationRate);
    
    // Cap at 100%
    const newIntensity = Math.min(100, calculatedIntensity);
    
    if (newIntensity !== this.state.intensity) {
      const oldIntensity = this.state.intensity;
      this.state.intensity = newIntensity;
      
      console.log('[HorrorEngine] Intensity escalated', {
        from: oldIntensity,
        to: newIntensity,
        sessionMinutes: minutesElapsed.toFixed(1)
      });
      
      this.onIntensityChangedEmitter.fire(newIntensity);
    }
  }

  /**
   * Check for user inactivity and reset session if needed
   */
  private checkInactivity(): void {
    const timeSinceActivity = Date.now() - this.state.lastActivityTime;
    const inactivityThreshold = 5 * 60 * 1000; // 5 minutes
    
    if (timeSinceActivity >= inactivityThreshold && this.state.isActive) {
      console.log('[HorrorEngine] User inactive for 5 minutes, resetting session');
      this.resetSession();
    }
  }

  /**
   * Reset the horror session
   */
  private resetSession(): void {
    console.log('[HorrorEngine] Resetting session');
    
    this.state.intensity = 20;
    this.state.sessionStartTime = Date.now();
    this.state.lastActivityTime = Date.now();
    
    this.randomEventEngine.resetSession();
    
    this.onSessionResetEmitter.fire();
    this.onIntensityChangedEmitter.fire(this.state.intensity);
  }

  /**
   * Record user activity (typing, clicking, etc.)
   */
  recordActivity(): void {
    this.state.lastActivityTime = Date.now();
    
    // If session was inactive, restart it
    if (!this.state.isActive && !this.state.isSafeMode && this.state.userConfig.enabled) {
      this.startSession();
    }
  }

  /**
   * Handle safe mode changes
   */
  private handleSafeModeChange(isSafeMode: boolean): void {
    console.log('[HorrorEngine] Safe mode changed:', isSafeMode);
    
    this.state.isSafeMode = isSafeMode;
    
    if (isSafeMode) {
      // Disable all effects
      this.state.isActive = false;
      
      // Stop timers
      if (this.escalationTimer) {
        clearInterval(this.escalationTimer);
        this.escalationTimer = undefined;
      }
      if (this.inactivityCheckTimer) {
        clearInterval(this.inactivityCheckTimer);
        this.inactivityCheckTimer = undefined;
      }
      if (this.phantomTypingCheckTimer) {
        clearInterval(this.phantomTypingCheckTimer);
        this.phantomTypingCheckTimer = undefined;
      }
      if (this.whisperingVariablesCheckTimer) {
        clearInterval(this.whisperingVariablesCheckTimer);
        this.whisperingVariablesCheckTimer = undefined;
      }
      if (this.timeDilationCheckTimer) {
        clearInterval(this.timeDilationCheckTimer);
        this.timeDilationCheckTimer = undefined;
      }
      
      // Disable all effect managers
      for (const manager of this.effectManagers.values()) {
        manager.setEnabled(false);
      }
    } else {
      // Re-enable effects
      this.startSession();
      
      // Re-enable effect managers based on configuration
      for (const manager of this.effectManagers.values()) {
        manager.setEnabled(true);
      }
    }
  }
  
  /**
   * Handle accessibility changes (Reduce Motion, High Contrast, etc.)
   */
  private handleAccessibilityChange(accessibilityState: any): void {
    console.log('[HorrorEngine] Accessibility changed:', accessibilityState);
    
    // Update screen distortion manager with Reduce Motion setting
    const screenDistortionManager = this.effectManagers.get('screenDistortion') as any;
    if (screenDistortionManager && screenDistortionManager.updateReduceMotion) {
      screenDistortionManager.updateReduceMotion(accessibilityState.reduceMotion);
    }
    
    // Update time dilation manager with Reduce Motion setting
    const timeDilationManager = this.effectManagers.get('timeDilation') as any;
    if (timeDilationManager && timeDilationManager.updateReduceMotion) {
      timeDilationManager.updateReduceMotion(accessibilityState.reduceMotion);
    }
    
    // Update horror popup manager with Reduce Motion setting
    // (if it has such a method in the future)
  }
  
  /**
   * Handle debugging state changes
   */
  private handleDebuggingChange(isDebugging: boolean): void {
    console.log('[HorrorEngine] Debugging state changed:', isDebugging);
    
    if (isDebugging) {
      // Pause all effects during debugging
      this.state.isActive = false;
      
      // Disable all effect managers temporarily
      for (const manager of this.effectManagers.values()) {
        manager.setEnabled(false);
      }
    } else {
      // Resume effects after debugging if not in safe mode
      if (!this.state.isSafeMode && this.state.userConfig.enabled) {
        this.state.isActive = true;
        
        // Re-enable effect managers based on configuration
        this.updateEffectManagerStates();
      }
    }
  }

  /**
   * Handle configuration changes
   */
  private handleConfigurationChange(): void {
    console.log('[HorrorEngine] Configuration changed, reloading...');
    
    const oldConfig = this.state.userConfig;
    this.state.userConfig = this.validateConfiguration(this.loadConfiguration());
    
    // Check if safe mode changed
    if (oldConfig.safeMode !== this.state.userConfig.safeMode) {
      this.state.isSafeMode = this.state.userConfig.safeMode;
      this.handleSafeModeChange(this.state.userConfig.safeMode);
      return; // handleSafeModeChange will handle session state
    }
    
    // If horror was disabled, stop the session
    if (oldConfig.enabled && !this.state.userConfig.enabled) {
      this.state.isActive = false;
      
      if (this.escalationTimer) {
        clearInterval(this.escalationTimer);
        this.escalationTimer = undefined;
      }
      if (this.inactivityCheckTimer) {
        clearInterval(this.inactivityCheckTimer);
        this.inactivityCheckTimer = undefined;
      }
      if (this.phantomTypingCheckTimer) {
        clearInterval(this.phantomTypingCheckTimer);
        this.phantomTypingCheckTimer = undefined;
      }
      if (this.whisperingVariablesCheckTimer) {
        clearInterval(this.whisperingVariablesCheckTimer);
        this.whisperingVariablesCheckTimer = undefined;
      }
      if (this.timeDilationCheckTimer) {
        clearInterval(this.timeDilationCheckTimer);
        this.timeDilationCheckTimer = undefined;
      }
    }
    
    // If horror was enabled, start the session
    if (!oldConfig.enabled && this.state.userConfig.enabled && !this.state.isSafeMode) {
      this.startSession();
    }
    
    // Update effect managers based on feature toggles
    this.updateEffectManagerStates();
  }
  
  /**
   * Update effect manager states based on configuration
   */
  private updateEffectManagerStates(): void {
    const config = this.state.userConfig;
    
    // Update each effect manager based on its toggle
    const managerToggles: Record<string, boolean> = {
      'jumpscare': config.enableJumpscares,
      'screenDistortion': config.enableScreenEffects,
      'phantomTyping': config.enablePhantomEvents,
      'whisperingVariables': config.enablePhantomEvents,
      'entityPresence': config.enableEntityPresence,
      'easterEgg': config.enableEasterEggs,
      'contextTrigger': true, // Always enabled if horror is enabled
      'timeDilation': config.enableScreenEffects
    };
    
    for (const [name, enabled] of Object.entries(managerToggles)) {
      const manager = this.effectManagers.get(name);
      if (manager) {
        manager.setEnabled(enabled && this.isActive());
      }
    }
  }

  /**
   * Get current horror intensity (0-100)
   */
  getIntensity(): number {
    return this.state.intensity;
  }

  /**
   * Get current session state
   */
  getState(): Readonly<HorrorEngineState> {
    return { ...this.state };
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number {
    return Date.now() - this.state.sessionStartTime;
  }

  /**
   * Check if horror engine is active
   */
  isActive(): boolean {
    return this.state.isActive && !this.state.isSafeMode && this.state.userConfig.enabled;
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof HorrorConfig): boolean {
    if (!this.isActive()) {
      return false;
    }
    
    return this.state.userConfig[feature] as boolean;
  }

  /**
   * Check if jumpscares are enabled
   */
  areJumscaresEnabled(): boolean {
    return this.isFeatureEnabled('enableJumpscares');
  }

  /**
   * Check if screen effects are enabled
   */
  areScreenEffectsEnabled(): boolean {
    return this.isFeatureEnabled('enableScreenEffects');
  }

  /**
   * Check if phantom events are enabled
   */
  arePhantomEventsEnabled(): boolean {
    return this.isFeatureEnabled('enablePhantomEvents');
  }

  /**
   * Check if entity presence is enabled
   */
  isEntityPresenceEnabled(): boolean {
    return this.isFeatureEnabled('enableEntityPresence');
  }

  /**
   * Check if easter eggs are enabled
   */
  areEasterEggsEnabled(): boolean {
    return this.isFeatureEnabled('enableEasterEggs');
  }

  /**
   * Get user configuration
   */
  getConfiguration(): Readonly<HorrorConfig> {
    return { ...this.state.userConfig };
  }

  /**
   * Trigger a coordinated horror event
   * This method coordinates multiple effect managers to create a cohesive horror experience
   */
  async triggerCoordinatedEvent(eventType: 'jumpscare' | 'ambient' | 'intense' | 'subtle'): Promise<void> {
    if (!this.isActive()) {
      console.log('[HorrorEngine] Cannot trigger event - engine not active');
      return;
    }

    console.log(`[HorrorEngine] Triggering coordinated ${eventType} event at intensity ${this.state.intensity}%`);

    const startTime = Date.now();
    const context: ErrorContext = {
      component: 'HorrorEngine',
      operation: `triggerCoordinatedEvent-${eventType}`,
      intensity: this.state.intensity
    };

    const result = await this.errorHandler.safeExecute(
      async () => {
        switch (eventType) {
          case 'jumpscare':
            // Trigger jumpscare with screen effects
            const horrorPopup = this.effectManagers.get('jumpscare') as any;
            const screenDistortion = this.effectManagers.get('screenDistortion') as any;
            
            if (horrorPopup && this.state.userConfig.enableJumpscares) {
              await this.errorHandler.safeExecute(
                async () => await horrorPopup.showRandomJumpscare?.(),
                { component: 'jumpscare', operation: 'showRandomJumpscare', intensity: this.state.intensity }
              );
            }
            
            if (screenDistortion && this.state.userConfig.enableScreenEffects) {
              await this.errorHandler.safeExecute(
                async () => await screenDistortion.triggerShake?.(0.8),
                { component: 'screenDistortion', operation: 'triggerShake', intensity: this.state.intensity }
              );
            }
            break;

          case 'intense':
            // Combine multiple intense effects
            const screenDist = this.effectManagers.get('screenDistortion') as any;
            const entityPresence = this.effectManagers.get('entityPresence') as any;
            
            if (screenDist && this.state.userConfig.enableScreenEffects) {
              await this.errorHandler.safeExecute(
                async () => await screenDist.triggerChromaticAberration?.(false),
                { component: 'screenDistortion', operation: 'triggerChromaticAberration', intensity: this.state.intensity }
              );
            }
            
            if (entityPresence && this.state.userConfig.enableEntityPresence) {
              this.errorHandler.safeExecuteSync(
                () => {
                  entityPresence.spawnEye?.(this.state.intensity);
                  setTimeout(() => entityPresence.spawnEye?.(this.state.intensity), 500);
                },
                { component: 'entityPresence', operation: 'spawnEye-multiple', intensity: this.state.intensity }
              );
            }
            break;

          case 'ambient':
            // Subtle ambient effects
            const whisperingVars = this.effectManagers.get('whisperingVariables') as any;
            const entities = this.effectManagers.get('entityPresence') as any;
            
            if (whisperingVars && this.state.userConfig.enablePhantomEvents) {
              await this.errorHandler.safeExecute(
                async () => await whisperingVars.applyWhisper?.(),
                { component: 'whisperingVariables', operation: 'applyWhisper', intensity: this.state.intensity }
              );
            }
            
            if (entities && this.state.userConfig.enableEntityPresence) {
              this.errorHandler.safeExecuteSync(
                () => entities.spawnEye?.(this.state.intensity),
                { component: 'entityPresence', operation: 'spawnEye', intensity: this.state.intensity }
              );
            }
            break;

          case 'subtle':
            // Very subtle effects
            const timeDilation = this.effectManagers.get('timeDilation') as any;
            
            if (timeDilation && this.state.userConfig.enableScreenEffects) {
              await this.errorHandler.safeExecute(
                async () => await timeDilation.triggerTimeDilation?.(this.state.intensity / 100),
                { component: 'timeDilation', operation: 'triggerTimeDilation', intensity: this.state.intensity }
              );
            }
            break;
        }

        this.state.lastEventTime = Date.now();
      },
      context
    );
    
    // Track performance and log event
    const duration = Date.now() - startTime;
    const success = result !== null;
    this.trackPerformance('HorrorEngine', `triggerCoordinatedEvent-${eventType}`, duration, success);
    this.logEvent(`coordinated-${eventType}`, 'HorrorEngine', success, duration);
  }

  /**
   * Get all registered effect managers
   */
  getAllEffectManagers(): Map<string, IEffectManager> {
    return new Map(this.effectManagers);
  }

  /**
   * Check if a specific effect manager is registered
   */
  hasEffectManager(name: string): boolean {
    return this.effectManagers.has(name);
  }

  /**
   * Get effect manager status for debugging
   */
  getEffectManagerStatus(): Record<string, { registered: boolean; enabled: boolean; hasErrors: boolean }> {
    const status: Record<string, { registered: boolean; enabled: boolean; hasErrors: boolean }> = {};
    
    for (const [name, manager] of this.effectManagers.entries()) {
      status[name] = {
        registered: true,
        enabled: manager.isEnabled(),
        hasErrors: this.errorHandler.isComponentDisabled(name)
      };
    }
    
    return status;
  }

  /**
   * Get error handler for direct access
   */
  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get error report for debugging
   */
  getErrorReport(): string {
    return this.errorHandler.getErrorReport();
  }

  /**
   * Get resource manager for direct access
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * Get resource statistics
   */
  getResourceStatistics(): string {
    return this.resourceManager.getResourceReport();
  }

  /**
   * Track performance of an effect trigger
   */
  private trackPerformance(component: string, operation: string, duration: number, success: boolean): void {
    const metric: PerformanceMetrics = {
      component,
      operation,
      duration,
      timestamp: Date.now(),
      success
    };
    
    this.performanceMetrics.push(metric);
    
    // Keep only last MAX_METRICS entries
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics.shift();
    }
    
    // Log slow operations (>100ms)
    if (duration > 100) {
      console.warn(`[HorrorEngine] Slow operation: ${component}.${operation} took ${duration}ms`);
    }
  }

  /**
   * Log an event for debugging
   */
  private logEvent(eventType: string, component: string, success: boolean, duration?: number): void {
    const entry: EventLogEntry = {
      timestamp: Date.now(),
      eventType,
      component,
      intensity: this.state.intensity,
      success,
      duration
    };
    
    this.eventLog.push(entry);
    
    // Keep only last MAX_EVENT_LOG entries
    if (this.eventLog.length > this.MAX_EVENT_LOG) {
      this.eventLog.shift();
    }
    
    console.log(`[HorrorEngine] Event: ${eventType} (${component}) - ${success ? 'Success' : 'Failed'}${duration ? ` (${duration}ms)` : ''}`);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get average performance by component
   */
  getAveragePerformance(): Record<string, { avgDuration: number; successRate: number; count: number }> {
    const stats: Record<string, { totalDuration: number; successCount: number; totalCount: number }> = {};
    
    for (const metric of this.performanceMetrics) {
      if (!stats[metric.component]) {
        stats[metric.component] = { totalDuration: 0, successCount: 0, totalCount: 0 };
      }
      
      stats[metric.component].totalDuration += metric.duration;
      stats[metric.component].totalCount++;
      if (metric.success) {
        stats[metric.component].successCount++;
      }
    }
    
    const result: Record<string, { avgDuration: number; successRate: number; count: number }> = {};
    
    for (const [component, data] of Object.entries(stats)) {
      result[component] = {
        avgDuration: data.totalDuration / data.totalCount,
        successRate: (data.successCount / data.totalCount) * 100,
        count: data.totalCount
      };
    }
    
    return result;
  }

  /**
   * Get event log
   */
  getEventLog(): EventLogEntry[] {
    return [...this.eventLog];
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): Record<string, { count: number; successRate: number; avgDuration: number }> {
    const stats: Record<string, { count: number; successCount: number; totalDuration: number; durationCount: number }> = {};
    
    for (const entry of this.eventLog) {
      if (!stats[entry.eventType]) {
        stats[entry.eventType] = { count: 0, successCount: 0, totalDuration: 0, durationCount: 0 };
      }
      
      stats[entry.eventType].count++;
      if (entry.success) {
        stats[entry.eventType].successCount++;
      }
      if (entry.duration !== undefined) {
        stats[entry.eventType].totalDuration += entry.duration;
        stats[entry.eventType].durationCount++;
      }
    }
    
    const result: Record<string, { count: number; successRate: number; avgDuration: number }> = {};
    
    for (const [eventType, data] of Object.entries(stats)) {
      result[eventType] = {
        count: data.count,
        successRate: (data.successCount / data.count) * 100,
        avgDuration: data.durationCount > 0 ? data.totalDuration / data.durationCount : 0
      };
    }
    
    return result;
  }

  /**
   * Clear performance metrics and event log
   */
  clearTelemetry(): void {
    this.performanceMetrics = [];
    this.eventLog = [];
    console.log('[HorrorEngine] Telemetry data cleared');
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    console.log('[HorrorEngine] Disposing...');
    
    // Stop timers
    if (this.escalationTimer) {
      clearInterval(this.escalationTimer);
    }
    if (this.inactivityCheckTimer) {
      clearInterval(this.inactivityCheckTimer);
    }
    if (this.phantomTypingCheckTimer) {
      clearInterval(this.phantomTypingCheckTimer);
    }
    if (this.whisperingVariablesCheckTimer) {
      clearInterval(this.whisperingVariablesCheckTimer);
    }
    if (this.timeDilationCheckTimer) {
      clearInterval(this.timeDilationCheckTimer);
    }
    if (this.randomEventTimer) {
      clearTimeout(this.randomEventTimer);
    }
    
    // Dispose all effect managers
    for (const [name, manager] of this.effectManagers.entries()) {
      try {
        manager.dispose();
        console.log(`[HorrorEngine] Disposed effect manager: ${name}`);
      } catch (error) {
        console.error(`[HorrorEngine] Error disposing ${name}:`, error);
      }
    }
    
    this.effectManagers.clear();
    
    // Dispose resource manager
    this.resourceManager.dispose();
    
    // Dispose event emitters
    this.onIntensityChangedEmitter.dispose();
    this.onSessionResetEmitter.dispose();
    
    console.log('[HorrorEngine] Disposed');
  }
}
