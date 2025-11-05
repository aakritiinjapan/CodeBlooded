/**
 * Audio Effects Processor using Tone.js
 * 
 * Implements reverb, tremolo, and distortion effects for horror-themed audio
 */

import * as Tone from 'tone';
import { AudioEffect, WaveformType } from '../types';

export class EffectsProcessor {
  private reverb: Tone.Reverb | null = null;
  private tremolo: Tone.Tremolo | null = null;
  private distortion: Tone.Distortion | null = null;
  private synth: Tone.Synth | null = null;
  private polySynth: Tone.PolySynth | null = null;
  private initialized = false;

  /**
   * Initialize effects chain
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure Tone.js is started
      await Tone.start();

      // Create effects
      this.reverb = new Tone.Reverb({
        decay: 3,
        preDelay: 0.01,
        wet: 0.5,
      });

      this.tremolo = new Tone.Tremolo({
        frequency: 5,
        depth: 0.5,
      }).start();

      this.distortion = new Tone.Distortion({
        distortion: 0.4,
        wet: 0.5,
      });

      // Create synth for single tones
      this.synth = new Tone.Synth({
        oscillator: {
          type: 'sine',
        },
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5,
        },
      });

      // Create polyphonic synth for chords
      this.polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine',
        },
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5,
        },
      });

      // Connect to destination (will be routed through effects as needed)
      this.synth.toDestination();
      this.polySynth.toDestination();

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize effects processor: ${error}`);
    }
  }

  /**
   * Play a tone with specified effects
   */
  async playWithEffects(
    frequency: number,
    waveform: WaveformType,
    duration: number,
    effects: AudioEffect[],
    volume: number = 0.5
  ): Promise<void> {
    await this.initialize();

    if (!this.synth) {
      throw new Error('Synth not initialized');
    }

    // Disconnect from current routing
    this.synth.disconnect();

    // Set waveform
    this.synth.oscillator.type = waveform as any;

    // Set volume
    this.synth.volume.value = Tone.gainToDb(volume);

    // Route through effects
    let currentNode: Tone.ToneAudioNode = this.synth;

    effects.forEach((effect) => {
      switch (effect.type) {
        case 'reverb':
          if (this.reverb) {
            this.reverb.wet.value = effect.intensity;
            currentNode.connect(this.reverb);
            currentNode = this.reverb;
          }
          break;
        case 'tremolo':
          if (this.tremolo) {
            this.tremolo.wet.value = effect.intensity;
            this.tremolo.depth.value = effect.intensity;
            currentNode.connect(this.tremolo);
            currentNode = this.tremolo;
          }
          break;
        case 'distortion':
          if (this.distortion) {
            this.distortion.wet.value = effect.intensity;
            this.distortion.distortion = effect.intensity;
            currentNode.connect(this.distortion);
            currentNode = this.distortion;
          }
          break;
      }
    });

    // Connect final node to destination
    currentNode.toDestination();

    // Convert frequency to note
    const note = Tone.Frequency(frequency, 'hz').toNote();

    // Play the note
    this.synth.triggerAttackRelease(note, duration / 1000);
  }

  /**
   * Play a chord with specified effects
   */
  async playChordWithEffects(
    frequencies: number[],
    waveform: WaveformType,
    duration: number,
    effects: AudioEffect[],
    volume: number = 0.5
  ): Promise<void> {
    await this.initialize();

    if (!this.polySynth) {
      throw new Error('PolySynth not initialized');
    }

    // Disconnect from current routing
    this.polySynth.disconnect();

    // Set waveform for all voices
    this.polySynth.set({
      oscillator: {
        type: waveform as any,
      },
    });

    // Set volume
    this.polySynth.volume.value = Tone.gainToDb(volume / frequencies.length);

    // Route through effects
    let currentNode: Tone.ToneAudioNode = this.polySynth;

    effects.forEach((effect) => {
      switch (effect.type) {
        case 'reverb':
          if (this.reverb) {
            this.reverb.wet.value = effect.intensity;
            currentNode.connect(this.reverb);
            currentNode = this.reverb;
          }
          break;
        case 'tremolo':
          if (this.tremolo) {
            this.tremolo.wet.value = effect.intensity;
            this.tremolo.depth.value = effect.intensity;
            currentNode.connect(this.tremolo);
            currentNode = this.tremolo;
          }
          break;
        case 'distortion':
          if (this.distortion) {
            this.distortion.wet.value = effect.intensity;
            this.distortion.distortion = effect.intensity;
            currentNode.connect(this.distortion);
            currentNode = this.distortion;
          }
          break;
      }
    });

    // Connect final node to destination
    currentNode.toDestination();

    // Convert frequencies to notes
    const notes = frequencies.map((freq) => Tone.Frequency(freq, 'hz').toNote());

    // Play the chord
    this.polySynth.triggerAttackRelease(notes, duration / 1000);
  }

  /**
   * Stop all currently playing sounds
   */
  stop(): void {
    if (this.synth) {
      this.synth.triggerRelease();
    }
    if (this.polySynth) {
      this.polySynth.releaseAll();
    }
  }

  /**
   * Dispose of all effects and synths
   */
  dispose(): void {
    this.stop();

    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
    if (this.tremolo) {
      this.tremolo.dispose();
      this.tremolo = null;
    }
    if (this.distortion) {
      this.distortion.dispose();
      this.distortion = null;
    }
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    if (this.polySynth) {
      this.polySynth.dispose();
      this.polySynth = null;
    }

    this.initialized = false;
  }
}
