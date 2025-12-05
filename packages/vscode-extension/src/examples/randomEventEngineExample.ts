/**
 * Random Event Engine Usage Example
 * 
 * This file demonstrates how to use the RandomEventEngine and EventScheduler
 * to create unpredictable horror events in codeblooded.
 */

import { RandomEventEngine, EventType } from '../randomEventEngine';
import { EventScheduler } from '../eventScheduler';

/**
 * Example: Basic usage of RandomEventEngine
 */
export function exampleBasicUsage() {
  // Create the random event engine
  const engine = new RandomEventEngine();

  // Calculate probability for a jumpscare at 50% intensity
  const jumpscareProb = engine.calculateEventProbability(EventType.Jumpscare, 50);
  console.log('Jumpscare probability at 50% intensity:', jumpscareProb);

  // Select a random event based on current intensity
  const selectedEvent = engine.selectRandomEvent(75);
  console.log('Selected event at 75% intensity:', selectedEvent);

  // Record an event
  if (selectedEvent) {
    engine.recordEvent(selectedEvent, 75, 'variant-1');
  }

  // Check event history
  const history = engine.getEventHistory();
  console.log('Event history:', history);

  // Check if an event is on cooldown
  const isOnCooldown = engine.isOnCooldown(EventType.Jumpscare);
  console.log('Jumpscare on cooldown:', isOnCooldown);

  // Get remaining cooldown time
  const remainingCooldown = engine.getRemainingCooldown(EventType.Jumpscare);
  console.log('Remaining cooldown (ms):', remainingCooldown);
}

/**
 * Example: Using EventScheduler for automatic event triggering
 */
export function exampleSchedulerUsage() {
  // Create the random event engine
  const engine = new RandomEventEngine();

  // Create the event scheduler
  const scheduler = new EventScheduler(engine, {
    minCooldownMs: 30000,    // 30 seconds minimum between events
    maxCooldownMs: 120000,   // 2 minutes maximum between events
    intensityScaling: true,  // Scale frequency with intensity
    enabled: true
  });

  // Define event trigger callback
  const handleEventTrigger = async (eventType: EventType) => {
    console.log('Event triggered:', eventType);
    
    // Handle different event types
    switch (eventType) {
      case EventType.Jumpscare:
        // Show jumpscare popup
        console.log('Showing jumpscare...');
        break;
      
      case EventType.ScreenShake:
        // Apply screen shake effect
        console.log('Applying screen shake...');
        break;
      
      case EventType.PhantomTyping:
        // Trigger phantom typing
        console.log('Triggering phantom typing...');
        break;
      
      // ... handle other event types
    }
  };

  // Start the scheduler with initial intensity
  scheduler.start(30, handleEventTrigger);

  // Update intensity as user codes
  setTimeout(() => {
    scheduler.updateIntensity(60);
  }, 60000); // After 1 minute, increase intensity

  // Stop scheduler when needed
  setTimeout(() => {
    scheduler.stop();
  }, 300000); // Stop after 5 minutes
}

/**
 * Example: Progressive intensity escalation
 */
export function exampleProgressiveEscalation() {
  const engine = new RandomEventEngine();
  const scheduler = new EventScheduler(engine);

  let currentIntensity = 20; // Start at 20%
  const escalationRate = 5;  // Increase by 5% every 2 minutes
  const maxIntensity = 100;

  // Event trigger callback
  const handleEventTrigger = async (eventType: EventType) => {
    console.log(`Event triggered at ${currentIntensity}% intensity:`, eventType);
  };

  // Start scheduler
  scheduler.start(currentIntensity, handleEventTrigger);

  // Escalate intensity every 2 minutes
  const escalationInterval = setInterval(() => {
    currentIntensity = Math.min(currentIntensity + escalationRate, maxIntensity);
    scheduler.updateIntensity(currentIntensity);
    
    console.log('Intensity escalated to:', currentIntensity);

    if (currentIntensity >= maxIntensity) {
      clearInterval(escalationInterval);
      console.log('Maximum intensity reached!');
    }
  }, 120000); // Every 2 minutes

  // Reset after 5 minutes of inactivity
  let lastActivityTime = Date.now();
  const inactivityCheck = setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    
    if (timeSinceActivity > 300000) { // 5 minutes
      currentIntensity = 20;
      scheduler.updateIntensity(currentIntensity);
      engine.resetSession();
      scheduler.resetSession();
      
      console.log('Session reset due to inactivity');
      lastActivityTime = Date.now();
    }
  }, 60000); // Check every minute

  // Cleanup function
  return () => {
    clearInterval(escalationInterval);
    clearInterval(inactivityCheck);
    scheduler.dispose();
  };
}

/**
 * Example: Custom event configuration
 */
export function exampleCustomConfiguration() {
  const engine = new RandomEventEngine();

  // Disable specific event types
  engine.setEventEnabled(EventType.PhantomTyping, false);
  engine.setEventEnabled(EventType.TimeDilation, false);

  // Update event configuration
  engine.updateEventConfig(EventType.Jumpscare, {
    baseChance: 0.20,        // Increase base chance
    cooldownSeconds: 45,     // Reduce cooldown
    maxPerSession: 15        // Allow more per session
  });

  // Create scheduler with custom config
  const scheduler = new EventScheduler(engine, {
    minCooldownMs: 20000,    // More frequent events
    maxCooldownMs: 90000,
    intensityScaling: true,
    enabled: true
  });

  return { engine, scheduler };
}

/**
 * Example: Event history analysis
 */
export function exampleHistoryAnalysis() {
  const engine = new RandomEventEngine();

  // Simulate some events
  engine.recordEvent(EventType.Jumpscare, 50, 'skull');
  engine.recordEvent(EventType.ScreenShake, 55);
  engine.recordEvent(EventType.Glitch, 60);
  engine.recordEvent(EventType.EntitySpawn, 65, 'eye');
  engine.recordEvent(EventType.VHSDistortion, 70);

  // Get recent events
  const recentEvents = engine.getRecentEvents(3);
  console.log('Last 3 events:', recentEvents);

  // Get full history
  const fullHistory = engine.getEventHistory();
  console.log('Full event history:', fullHistory);

  // Get session statistics
  const stats = engine.getSessionStats();
  console.log('Session stats:', {
    duration: `${Math.round(stats.duration / 1000)}s`,
    totalEvents: stats.totalEvents,
    averageIntensity: Math.round(stats.averageIntensity),
    eventCounts: Array.from(stats.eventCounts.entries())
  });
}

/**
 * Example: Force triggering events (for testing)
 */
export function exampleForceTrigger() {
  const engine = new RandomEventEngine();
  const scheduler = new EventScheduler(engine);

  const handleEventTrigger = async (eventType: EventType) => {
    console.log('Force triggered event:', eventType);
  };

  scheduler.start(50, handleEventTrigger);

  // Force trigger a specific event (bypasses cooldowns)
  scheduler.forceTrigger(EventType.Jumpscare);

  // Force trigger a random event
  scheduler.forceTrigger();
}

/**
 * Example: Integration with VS Code extension
 */
export function exampleVSCodeIntegration() {
  const engine = new RandomEventEngine();
  const scheduler = new EventScheduler(engine);

  // Track typing activity
  let lastTypingTime = Date.now();
  let sessionIntensity = 20;

  // Event trigger callback that integrates with extension managers
  const handleEventTrigger = async (eventType: EventType) => {
    console.log('Triggering event in VS Code:', eventType);

    // Example integration points:
    switch (eventType) {
      case EventType.Jumpscare:
        // await horrorPopupManager.showRandomJumpscare();
        break;
      
      case EventType.ScreenShake:
        // await screenDistortionManager.applyShake();
        break;
      
      case EventType.PhantomTyping:
        // await phantomTypingManager.triggerPhantomTyping();
        break;
      
      case EventType.EntitySpawn:
        // await entityPresenceManager.spawnEye();
        break;
      
      // ... other event types
    }
  };

  // Start scheduler
  scheduler.start(sessionIntensity, handleEventTrigger);

  // Update intensity based on typing activity
  const updateIntensity = () => {
    const timeSinceTyping = Date.now() - lastTypingTime;
    
    // Reset if inactive for 5 minutes
    if (timeSinceTyping > 300000) {
      sessionIntensity = 20;
      engine.resetSession();
      scheduler.resetSession();
    } else {
      // Escalate intensity every 2 minutes of activity
      const activeMinutes = Math.floor((Date.now() - lastTypingTime) / 120000);
      sessionIntensity = Math.min(20 + (activeMinutes * 5), 100);
    }
    
    scheduler.updateIntensity(sessionIntensity);
  };

  // Check intensity every minute
  const intensityInterval = setInterval(updateIntensity, 60000);

  // Cleanup
  return () => {
    clearInterval(intensityInterval);
    scheduler.dispose();
  };
}

/**
 * Example: Scheduler state monitoring
 */
export function exampleStateMonitoring() {
  const engine = new RandomEventEngine();
  const scheduler = new EventScheduler(engine);

  const handleEventTrigger = async (eventType: EventType) => {
    console.log('Event triggered:', eventType);
  };

  scheduler.start(50, handleEventTrigger);

  // Monitor scheduler state
  const monitorInterval = setInterval(() => {
    const state = scheduler.getState();
    
    console.log('Scheduler state:', {
      isRunning: state.isRunning,
      intensity: state.currentIntensity,
      sessionEvents: state.sessionEventCount,
      timeSinceLastEvent: `${Math.round(state.timeSinceLastEvent / 1000)}s`,
      nextEventIn: state.nextEventIn ? `${Math.round(state.nextEventIn / 1000)}s` : 'N/A'
    });
  }, 10000); // Every 10 seconds

  // Cleanup
  return () => {
    clearInterval(monitorInterval);
    scheduler.dispose();
  };
}
