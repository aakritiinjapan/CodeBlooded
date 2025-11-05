/**
 * Audio Engine for CodeChroma
 * 
 * Provides Web Audio API wrapper with oscillator pooling and tone synthesis
 */

import * as Tone from 'tone';
import {
  AudioMapping,
  AudioEngineConfig,
  WaveformType,
  ErrorCode,
  CodeChromaError,
} from '../types';
import { EffectsProcessor } from './effects';

export class AudioEngine {
  private config: AudioEngineConfig;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillatorPool: Map<string, OscillatorNode> = new Map();
  private activeOscillators: Set<OscillatorNode> = new Set();
  private toneInitialized = false;
  private currentPlayback: { stop: () => void } | null = null;
  private effectsProcessor: EffectsProcessor;

  constructor(config?: Partial<AudioEngineConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      volume: config?.volume ?? 0.5,
      maxOscillators: config?.maxOscillators ?? 10,
      fadeTime: config?.fadeTime ?? 0.05,
    };
    this.effectsProcessor = new EffectsProcessor();
  }

  /**
   * Initialize the audio engine and Web Audio API context
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Initialize Tone.js
      if (!this.toneInitialized) {
        await Tone.start();
        this.toneInitialized = true;
      }

      // Initialize Web Audio API context
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.config.volume;
        this.masterGain.connect(this.audioContext.destination);
      }

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      throw new CodeChromaError(
        'Failed to initialize audio engine',
        ErrorCode.AUDIO_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Create an oscillator with specified configuration
   */
  private createOscillator(
    frequency: number,
    waveform: WaveformType
  ): OscillatorNode {
    if (!this.audioContext || !this.masterGain) {
      throw new CodeChromaError(
        'Audio context not initialized',
        ErrorCode.AUDIO_ERROR
      );
    }

    const oscillator = this.audioContext.createOscillator();
    oscillator.type = waveform as OscillatorType;
    oscillator.frequency.value = frequency;

    // Create gain node for individual oscillator volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0; // Start at 0 for fade-in
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    return oscillator;
  }

  /**
   * Get an oscillator from the pool or create a new one
   */
  private getOscillator(frequency: number, waveform: WaveformType): OscillatorNode {
    // Clean up finished oscillators
    this.cleanupOscillators();

    // Check pool size limit
    if (this.activeOscillators.size >= this.config.maxOscillators) {
      // Stop oldest oscillator
      const oldest = this.activeOscillators.values().next().value;
      if (oldest) {
        this.stopOscillator(oldest);
      }
    }

    const oscillator = this.createOscillator(frequency, waveform);
    this.activeOscillators.add(oscillator);
    
    return oscillator;
  }

  /**
   * Stop an oscillator with fade-out
   */
  private stopOscillator(oscillator: OscillatorNode): void {
    if (!this.audioContext) return;

    try {
      const gainNode = oscillator.context.createGain();
      const currentTime = this.audioContext.currentTime;
      
      // Fade out
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + this.config.fadeTime);
      
      // Stop after fade
      oscillator.stop(currentTime + this.config.fadeTime);
      
      // Remove from active set
      this.activeOscillators.delete(oscillator);
    } catch (error) {
      // Oscillator might already be stopped
      this.activeOscillators.delete(oscillator);
    }
  }

  /**
   * Clean up finished oscillators
   */
  private cleanupOscillators(): void {
    this.activeOscillators.forEach((osc) => {
      // Check if oscillator is still playing
      try {
        if (osc.context.state === 'closed') {
          this.activeOscillators.delete(osc);
        }
      } catch {
        this.activeOscillators.delete(osc);
      }
    });
  }

  /**
   * Play audio based on mapping
   */
  async play(mapping: AudioMapping): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      await this.initialize();

      // Stop any current playback
      this.stop();

      // If effects are specified, use Tone.js effects processor
      if (mapping.effects && mapping.effects.length > 0) {
        await this.effectsProcessor.playWithEffects(
          mapping.frequency,
          mapping.waveform,
          mapping.duration,
          mapping.effects,
          mapping.volume * this.config.volume
        );

        // Store reference for stopping
        this.currentPlayback = {
          stop: () => this.effectsProcessor.stop(),
        };

        return;
      }

      // Otherwise use Web Audio API directly
      if (!this.audioContext || !this.masterGain) {
        throw new CodeChromaError(
          'Audio context not initialized',
          ErrorCode.AUDIO_ERROR
        );
      }

      const oscillator = this.getOscillator(mapping.frequency, mapping.waveform);
      const gainNode = oscillator.context.createGain() as GainNode;
      
      // Disconnect and reconnect with gain node
      oscillator.disconnect();
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      const currentTime = this.audioContext.currentTime;
      const duration = mapping.duration / 1000; // Convert ms to seconds
      const volume = mapping.volume * this.config.volume;

      // Fade in
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + this.config.fadeTime);

      // Sustain
      gainNode.gain.setValueAtTime(volume, currentTime + this.config.fadeTime);

      // Fade out
      gainNode.gain.linearRampToValueAtTime(
        0,
        currentTime + duration - this.config.fadeTime
      );

      // Start oscillator
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      // Store reference for stopping
      this.currentPlayback = {
        stop: () => this.stopOscillator(oscillator),
      };

      // Clean up after playback
      oscillator.onended = () => {
        this.activeOscillators.delete(oscillator);
        this.currentPlayback = null;
      };
    } catch (error) {
      if (error instanceof CodeChromaError) {
        throw error;
      }
      throw new CodeChromaError(
        'Failed to play audio',
        ErrorCode.AUDIO_ERROR,
        { originalError: error, mapping }
      );
    }
  }

  /**
   * Play multiple frequencies as a chord
   */
  async playChord(
    frequencies: number[],
    waveform: WaveformType,
    duration: number
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      await this.initialize();

      if (!this.audioContext || !this.masterGain) {
        throw new CodeChromaError(
          'Audio context not initialized',
          ErrorCode.AUDIO_ERROR
        );
      }

      // Stop any current playback
      this.stop();

      const oscillators: OscillatorNode[] = [];
      const currentTime = this.audioContext.currentTime;
      const durationSeconds = duration / 1000;

      frequencies.forEach((frequency) => {
        const oscillator = this.getOscillator(frequency, waveform);
        const gainNode = this.audioContext!.createGain();

        // Disconnect and reconnect with gain node
        oscillator.disconnect();
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain!);

        const volume = this.config.volume / frequencies.length; // Divide volume among oscillators

        // Fade in
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, currentTime + this.config.fadeTime);

        // Sustain
        gainNode.gain.setValueAtTime(volume, currentTime + this.config.fadeTime);

        // Fade out
        gainNode.gain.linearRampToValueAtTime(
          0,
          currentTime + durationSeconds - this.config.fadeTime
        );

        // Start oscillator
        oscillator.start(currentTime);
        oscillator.stop(currentTime + durationSeconds);

        oscillators.push(oscillator);

        // Clean up after playback
        oscillator.onended = () => {
          this.activeOscillators.delete(oscillator);
        };
      });

      // Store reference for stopping
      this.currentPlayback = {
        stop: () => oscillators.forEach((osc) => this.stopOscillator(osc)),
      };
    } catch (error) {
      if (error instanceof CodeChromaError) {
        throw error;
      }
      throw new CodeChromaError(
        'Failed to play chord',
        ErrorCode.AUDIO_ERROR,
        { originalError: error, frequencies, waveform, duration }
      );
    }
  }

  /**
   * Play tritone interval for error states
   * Tritone is an augmented 4th interval (dissonant, unsettling sound)
   * @param baseFrequency - Base frequency (default: 440Hz)
   * @param duration - Duration in milliseconds (default: 1000ms)
   */
  async playTritone(baseFrequency: number = 440, duration: number = 1000): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Tritone is exactly 6 semitones (half octave)
    // Frequency ratio: 2^(6/12) = √2 ≈ 1.414
    const tritoneRatio = Math.sqrt(2);
    const tritoneFrequency = baseFrequency * tritoneRatio;

    // Use square waveform for harsh, dissonant sound
    await this.playChord(
      [baseFrequency, tritoneFrequency],
      WaveformType.Square,
      duration
    );
  }

  /**
   * Play gothic organ chord for success states
   * Minor triad with added 7th (e.g., Am7: A-C-E-G)
   * @param rootFrequency - Root frequency (default: 220Hz = A3)
   * @param duration - Duration in milliseconds (default: 2000ms)
   */
  async playGothicChord(rootFrequency: number = 220, duration: number = 2000): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Minor triad with added minor 7th
    // Root (1), Minor 3rd (3 semitones), Perfect 5th (7 semitones), Minor 7th (10 semitones)
    const minorThird = rootFrequency * Math.pow(2, 3 / 12);  // 1.189...
    const perfectFifth = rootFrequency * Math.pow(2, 7 / 12); // 1.498...
    const minorSeventh = rootFrequency * Math.pow(2, 10 / 12); // 1.782...

    // Use sine waveform for organ-like sound
    await this.playChord(
      [rootFrequency, minorThird, perfectFifth, minorSeventh],
      WaveformType.Sine,
      duration
    );
  }

  /**
   * Stop all currently playing audio
   */
  stop(): void {
    if (this.currentPlayback) {
      this.currentPlayback.stop();
      this.currentPlayback = null;
    }

    // Stop all active oscillators
    this.activeOscillators.forEach((osc) => {
      this.stopOscillator(osc);
    });
  }

  /**
   * Set master volume (0-1 range)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.volume;
    }
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable audio
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable audio
   */
  disable(): void {
    this.config.enabled = false;
    this.stop();
  }

  /**
   * Dispose of audio resources
   */
  dispose(): void {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.oscillatorPool.clear();
    this.activeOscillators.clear();
    this.effectsProcessor.dispose();
  }
}

// Re-export EffectsProcessor
export { EffectsProcessor } from './effects';
