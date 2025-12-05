import { AudioEffect, WaveformType } from '../types';
export declare class EffectsProcessor {
    private reverb;
    private tremolo;
    private distortion;
    private synth;
    private polySynth;
    private initialized;
    private tone;
    private toneUnavailable;
    initialize(): Promise<void>;
    isAvailable(): boolean;
    playWithEffects(frequency: number, waveform: WaveformType, duration: number, effects: AudioEffect[], volume?: number): Promise<void>;
    playChordWithEffects(frequencies: number[], waveform: WaveformType, duration: number, effects: AudioEffect[], volume?: number): Promise<void>;
    stop(): void;
    dispose(): void;
    private disposeResources;
    private getTone;
}
//# sourceMappingURL=effects.d.ts.map