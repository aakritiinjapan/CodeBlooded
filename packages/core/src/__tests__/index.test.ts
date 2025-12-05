import { VERSION, Language, ComplexityLevel, WaveformType } from '../index';

describe('codeblooded Core', () => {
  it('should export version', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should export Language enum', () => {
    expect(Language.TypeScript).toBe('typescript');
    expect(Language.JavaScript).toBe('javascript');
    expect(Language.Unknown).toBe('unknown');
  });

  it('should export ComplexityLevel enum', () => {
    expect(ComplexityLevel.Low).toBe('low');
    expect(ComplexityLevel.Medium).toBe('medium');
    expect(ComplexityLevel.High).toBe('high');
    expect(ComplexityLevel.Critical).toBe('critical');
  });

  it('should export WaveformType enum', () => {
    expect(WaveformType.Sine).toBe('sine');
    expect(WaveformType.Square).toBe('square');
    expect(WaveformType.Sawtooth).toBe('sawtooth');
    expect(WaveformType.Triangle).toBe('triangle');
  });
});
