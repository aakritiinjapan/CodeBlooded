/**
 * Audio Engine for codeblooded
 * 
 * Provides Web Audio API wrapper with oscillator pooling and tone synthesis
 */

import type * as ToneNamespace from 'tone';
import {
  AudioMapping,
  AudioEngineConfig,
  WaveformType,
  ErrorCode,
  CodeBloodedError,
} from '../types';
import { EffectsProcessor } from './effects';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

function tryRequire<T = unknown>(moduleId: string): T | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const runtimeRequire = eval('require') as undefined | ((id: string) => T);
    if (typeof runtimeRequire === 'function') {
      return runtimeRequire(moduleId);
    }
  } catch (error) {
    // Ignore resolution failures; we'll report a warning when audio is requested.
    console.warn(`codeblooded: Optional dependency '${moduleId}' not available`, error);
  }
  return undefined;
}
import { loadTone } from './tone-loader';

const execFileAsync = (() => {
  try {
    return promisify(execFile);
  } catch {
    return null;
  }
})();

type ToneModule = typeof ToneNamespace;
type AudioContextConstructor = typeof AudioContext;
type WebAudioApiModule = {
  AudioContext?: AudioContextConstructor;
};

export class AudioEngine {
  private config: AudioEngineConfig;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillatorPool: Map<string, OscillatorNode> = new Map();
  private activeOscillators: Set<OscillatorNode> = new Set();
  private toneInitialized = false;
  private currentPlayback: { stop: () => void } | null = null;
  private effectsProcessor: EffectsProcessor;
  private audioContextCtor: AudioContextConstructor | undefined;
  private toneModule: ToneModule | null = null;
  private toneLoadFailed = false;
  private audioUnsupported = false;
  private fallbackEnabled = false;
  private initializationError: unknown = null;

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

    if (this.audioUnsupported && this.fallbackEnabled) {
      return;
    }

    try {
      const tone = await this.ensureToneModule();
      if (tone && !this.toneInitialized) {
        await tone.start();
        this.toneInitialized = true;
      }
    } catch (toneError) {
      console.warn('codeblooded: Tone.js unavailable, continuing without advanced effects', toneError);
    }

    if (this.audioUnsupported) {
      return;
    }

    if (!this.audioContext) {
      const AudioContextConstructor = this.getAudioContextConstructor();
      if (!AudioContextConstructor) {
        this.markAudioUnsupported(
          new CodeBloodedError(
            'Web Audio API is not available in this environment',
            ErrorCode.AUDIO_ERROR
          )
        );
        return;
      }

      try {
        this.audioContext = new AudioContextConstructor();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.config.volume;
        this.masterGain.connect(this.audioContext.destination);
      } catch (contextError) {
        this.markAudioUnsupported(contextError);
        return;
      }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (resumeError) {
        this.markAudioUnsupported(resumeError);
      }
    }
  }

  private getAudioContextConstructor(): AudioContextConstructor | undefined {
    if (this.audioUnsupported) {
      return undefined;
    }

    if (this.audioContextCtor) {
      return this.audioContextCtor;
    }

    const globalAny = globalThis as any;

    if (typeof globalAny.AudioContext === 'function') {
      this.audioContextCtor = globalAny.AudioContext;
      return this.audioContextCtor;
    }

    if (typeof globalAny.webkitAudioContext === 'function') {
      this.audioContextCtor = globalAny.webkitAudioContext;
      return this.audioContextCtor;
    }

    const webAudioApi = tryRequire<WebAudioApiModule>('web-audio-api');
    if (webAudioApi?.AudioContext) {
      this.audioContextCtor = webAudioApi.AudioContext;
      globalAny.AudioContext = webAudioApi.AudioContext;
      return this.audioContextCtor;
    }

    return undefined;
  }

  private async ensureToneModule(): Promise<ToneModule | null> {
    if (this.toneLoadFailed) {
      return null;
    }

    if (this.toneModule) {
      return this.toneModule;
    }

    const tone = await loadTone();
    if (!tone) {
      this.toneLoadFailed = true;
      return null;
    }

    this.toneModule = tone;
    return this.toneModule;
  }

  /**
   * Create an oscillator with specified configuration
   */
  private createOscillator(
    frequency: number,
    waveform: WaveformType
  ): OscillatorNode {
    if (!this.audioContext || !this.masterGain) {
      throw new CodeBloodedError(
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

      if (this.audioUnsupported || !this.audioContext || !this.masterGain) {
        const fallbackPlayed = await this.playFallbackMapping(
          mapping.frequency,
          mapping.duration,
          mapping.volume
        );

        if (fallbackPlayed) {
          return;
        }

        throw new CodeBloodedError(
          'Audio context not initialized',
          ErrorCode.AUDIO_ERROR,
          {
            originalError: this.initializationError,
            mapping,
            fallbackAttempted: this.fallbackEnabled,
          }
        );
      }

      // Stop any current playback
      this.stop();

      // If effects are specified, use Tone.js effects processor
      if (
        mapping.effects &&
        mapping.effects.length > 0 &&
        this.effectsProcessor.isAvailable()
      ) {
        try {
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
        } catch (effectError) {
          console.warn('codeblooded: Falling back to direct oscillator playback', effectError);
        }
      }

      // Otherwise use Web Audio API directly
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
      if (error instanceof CodeBloodedError) {
        throw error;
      }
      throw new CodeBloodedError(
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

      if (this.audioUnsupported || !this.audioContext || !this.masterGain) {
        let fallbackSuccess = true;
        const toneDuration = duration / Math.max(1, frequencies.length);

        for (const frequency of frequencies) {
          const played = await this.playFallbackMapping(
            frequency,
            toneDuration,
            this.config.volume
          );
          fallbackSuccess = fallbackSuccess && played;
        }

        if (fallbackSuccess) {
          return;
        }

        throw new CodeBloodedError(
          'Audio context not initialized',
          ErrorCode.AUDIO_ERROR,
          {
            originalError: this.initializationError,
            fallbackAttempted: this.fallbackEnabled,
          }
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
      if (error instanceof CodeBloodedError) {
        throw error;
      }
      throw new CodeBloodedError(
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

  private canUseFallbackAudio(): boolean {
    return typeof process !== 'undefined' && typeof process.platform === 'string';
  }

  private markAudioUnsupported(error: unknown): void {
    if (!this.audioUnsupported) {
      console.warn('codeblooded: Web Audio unavailable, enabling fallback audio', error);
    }
    this.audioUnsupported = true;
    this.initializationError = error;
    if (!this.fallbackEnabled) {
      this.fallbackEnabled = this.canUseFallbackAudio();
    }
  }

  private async playFallbackMapping(
    frequency: number,
    durationMs: number,
    _volume: number
  ): Promise<boolean> {
    if (!this.canUseFallbackAudio()) {
      return false;
    }

    this.fallbackEnabled = true;

    const duration = Math.max(1, Math.round(durationMs));
    const clampedFrequency = Math.max(37, Math.min(32767, Math.round(frequency)));

    if (typeof process === 'undefined') {
      return false;
    }

    try {
      if (process.platform === 'win32' && execFileAsync) {
        await execFileAsync('powershell.exe', [
          '-Command',
          `[console]::Beep(${clampedFrequency},${duration})`,
        ]);
        return true;
      }

      // Fall back to terminal bell on other platforms
      process.stdout?.write?.('\u0007');
      await new Promise<void>((resolve) => setTimeout(resolve, duration));
      return true;
    } catch (error) {
      console.warn('codeblooded: Fallback audio playback failed', error);
      return false;
    }
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
