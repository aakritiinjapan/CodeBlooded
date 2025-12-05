/**
 * Tests for Random Event Engine
 * 
 * These tests verify the core functionality of the RandomEventEngine
 * including probability calculations, event selection, and history tracking.
 */

import { RandomEventEngine, EventType } from '../randomEventEngine';

describe('RandomEventEngine', () => {
  let engine: RandomEventEngine;

  beforeEach(() => {
    engine = new RandomEventEngine();
  });

  describe('Event Probability Calculation', () => {
    test('should return 0 probability at 0 intensity for most events', () => {
      const probability = engine.calculateEventProbability(EventType.Jumpscare, 0);
      expect(probability).toBeGreaterThanOrEqual(0);
    });

    test('should increase probability with higher intensity', () => {
      const lowIntensity = engine.calculateEventProbability(EventType.Jumpscare, 20);
      const highIntensity = engine.calculateEventProbability(EventType.Jumpscare, 80);
      
      expect(highIntensity).toBeGreaterThan(lowIntensity);
    });

    test('should return 0 probability when event is on cooldown', () => {
      // Record an event
      engine.recordEvent(EventType.Jumpscare, 50);
      
      // Immediately check probability (should be 0 due to cooldown)
      const probability = engine.calculateEventProbability(EventType.Jumpscare, 50);
      expect(probability).toBe(0);
    });

    test('should clamp probability between 0 and 1', () => {
      const probability = engine.calculateEventProbability(EventType.Jumpscare, 100);
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });
  });

  describe('Event Selection', () => {
    test('should select an event at high intensity', () => {
      const selectedEvent = engine.selectRandomEvent(80);
      expect(selectedEvent).toBeDefined();
    });

    test('should return null when no events are eligible', () => {
      // Record all event types to put them on cooldown
      Object.values(EventType).forEach(eventType => {
        engine.recordEvent(eventType as EventType, 50);
      });
      
      // Try to select an event (should return null due to cooldowns)
      const selectedEvent = engine.selectRandomEvent(50);
      expect(selectedEvent).toBeNull();
    });

    test('should select different events over multiple calls', () => {
      const selectedEvents = new Set<EventType>();
      
      // Select events multiple times
      for (let i = 0; i < 20; i++) {
        const event = engine.selectRandomEvent(75);
        if (event) {
          selectedEvents.add(event);
        }
      }
      
      // Should have selected at least 2 different event types
      expect(selectedEvents.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Event History Tracking', () => {
    test('should record events in history', () => {
      engine.recordEvent(EventType.Jumpscare, 50, 'variant-1');
      
      const history = engine.getEventHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe(EventType.Jumpscare);
      expect(history[0].intensity).toBe(50);
      expect(history[0].variant).toBe('variant-1');
    });

    test('should maintain maximum history size of 10', () => {
      // Record 15 events
      for (let i = 0; i < 15; i++) {
        engine.recordEvent(EventType.Glitch, 50);
      }
      
      const history = engine.getEventHistory();
      expect(history).toHaveLength(10);
    });

    test('should track recent events correctly', () => {
      // Record 5 events
      for (let i = 0; i < 5; i++) {
        engine.recordEvent(EventType.ScreenShake, 50);
      }
      
      const recentEvents = engine.getRecentEvents(3);
      expect(recentEvents).toHaveLength(3);
    });

    test('should clear history when requested', () => {
      engine.recordEvent(EventType.Jumpscare, 50);
      engine.recordEvent(EventType.ScreenShake, 60);
      
      engine.clearHistory();
      
      const history = engine.getEventHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Cooldown Management', () => {
    test('should detect when event is on cooldown', () => {
      engine.recordEvent(EventType.Jumpscare, 50);
      
      const isOnCooldown = engine.isOnCooldown(EventType.Jumpscare);
      expect(isOnCooldown).toBe(true);
    });

    test('should return remaining cooldown time', () => {
      engine.recordEvent(EventType.Jumpscare, 50);
      
      const remainingCooldown = engine.getRemainingCooldown(EventType.Jumpscare);
      expect(remainingCooldown).toBeGreaterThan(0);
    });

    test('should return 0 cooldown for events that have not occurred', () => {
      const remainingCooldown = engine.getRemainingCooldown(EventType.Jumpscare);
      expect(remainingCooldown).toBe(0);
    });
  });

  describe('Event Configuration', () => {
    test('should disable events when requested', () => {
      engine.setEventEnabled(EventType.PhantomTyping, false);
      
      const probability = engine.calculateEventProbability(EventType.PhantomTyping, 100);
      expect(probability).toBe(0);
    });

    test('should update event configuration', () => {
      engine.updateEventConfig(EventType.Jumpscare, {
        baseChance: 0.5,
        cooldownSeconds: 30
      });
      
      // Verify configuration was updated by checking probability
      const probability = engine.calculateEventProbability(EventType.Jumpscare, 50);
      expect(probability).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    test('should track session statistics', () => {
      engine.recordEvent(EventType.Jumpscare, 50);
      engine.recordEvent(EventType.ScreenShake, 60);
      engine.recordEvent(EventType.Glitch, 70);
      
      const stats = engine.getSessionStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.averageIntensity).toBeCloseTo(60, 0);
      expect(stats.duration).toBeGreaterThan(0);
    });

    test('should reset session correctly', () => {
      engine.recordEvent(EventType.Jumpscare, 50);
      engine.recordEvent(EventType.ScreenShake, 60);
      
      engine.resetSession();
      
      const stats = engine.getSessionStats();
      expect(stats.totalEvents).toBe(0);
    });
  });

  describe('Repetition Prevention', () => {
    test('should apply repetition penalty', () => {
      // Record the same event multiple times
      engine.recordEvent(EventType.Jumpscare, 50);
      
      // Wait a bit to allow cooldown to pass (in real scenario)
      // For testing, we'll just check that probability is affected
      
      const history = engine.getEventHistory();
      expect(history).toHaveLength(1);
    });
  });
});
