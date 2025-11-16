/**
 * Audio Effects Processor using Tone.js
 * 
 * Implements reverb, tremolo, and distortion effects for horror-themed audio
 */

import type * as ToneNamespace from 'tone';
import { AudioEffect, WaveformType } from '../types';
import { loadTone } from './tone-loader';

type ToneModule = typeof ToneNamespace;
type ToneAudioNode = ToneNamespace.ToneAudioNode;

export class EffectsProcessor {
  private reverb: ToneNamespace.Reverb | null = null;
  private tremolo: ToneNamespace.Tremolo | null = null;
  private distortion: ToneNamespace.Distortion | null = null;
  private synth: ToneNamespace.Synth | null = null;
  private polySynth: ToneNamespace.PolySynth | null = null;
  private initialized = false;
  private tone: ToneModule | null = null;
  private toneUnavailable = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.toneUnavailable) {
      throw new Error('Tone.js is not available in this environment');
    }

    const tone = await this.getTone();

    try {
      await tone.start();

      this.reverb = new tone.Reverb({
        decay: 3,
        preDelay: 0.01,
        wet: 0.5,
      });

      this.tremolo = new tone.Tremolo({
        frequency: 5,
        depth: 0.5,
      }).start();

      this.distortion = new tone.Distortion({
        distortion: 0.4,
        wet: 0.5,
      });

      this.synth = new tone.Synth({
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

      this.polySynth = new tone.PolySynth(tone.Synth, {
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

      this.synth.toDestination();
      this.polySynth.toDestination();

      this.initialized = true;
    } catch (error) {
      this.disposeResources();
      this.toneUnavailable = true;
      throw new Error(`Failed to initialize effects processor: ${error}`);
    }
  }

  isAvailable(): boolean {
    return !this.toneUnavailable;
  }

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

    const tone = await this.getTone();

    this.synth.disconnect();
    this.synth.oscillator.type = waveform as any;
    this.synth.volume.value = tone.gainToDb(volume);

    let currentNode: ToneAudioNode = this.synth;

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

    currentNode.toDestination();

    const note = tone.Frequency(frequency, 'hz').toNote();
    this.synth.triggerAttackRelease(note, duration / 1000);
  }

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

    const tone = await this.getTone();

    this.polySynth.disconnect();
    this.polySynth.set({
      oscillator: {
        type: waveform as any,
      },
    });
    this.polySynth.volume.value = tone.gainToDb(volume / frequencies.length);

    let currentNode: ToneAudioNode = this.polySynth;

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

    currentNode.toDestination();

    const notes = frequencies.map((freq) => tone.Frequency(freq, 'hz').toNote());
    this.polySynth.triggerAttackRelease(notes, duration / 1000);
  }

  stop(): void {
    if (this.synth) {
      this.synth.triggerRelease();
    }
    if (this.polySynth) {
      this.polySynth.releaseAll();
    }
  }

  dispose(): void {
    this.stop();
    this.disposeResources();
    this.tone = null;
    this.toneUnavailable = false;
  }

  private disposeResources(): void {
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

  private async getTone(): Promise<ToneModule> {
    if (this.tone) {
      return this.tone;
    }

    if (this.toneUnavailable) {
      throw new Error('Tone.js is not available in this environment');
    }

    const tone = await loadTone();
    if (!tone) {
      this.toneUnavailable = true;
      throw new Error('Tone.js is not available in this environment');
    }

    this.tone = tone;
    return tone;
  }
}
