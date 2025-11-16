/**
 * Sensory Mapper
 *
 * Translates code complexity metrics into audio-visual representations
 * following the horror theme aesthetic.
 */

import {
  ComplexityLevel,
  WaveformType,
  AudioMapping,
  VisualMapping,
  ThemeMapping,
  Animation,
  AudioEffect,
} from '../types';

/**
 * Maps cyclomatic complexity value to ComplexityLevel enum
 * @param complexity - Cyclomatic complexity value
 * @returns ComplexityLevel enum value
 */
export function classifyComplexity(complexity: number): ComplexityLevel {
  // Handle edge cases
  if (complexity < 0) {
    return ComplexityLevel.Low;
  }
  if (complexity === 0) {
    return ComplexityLevel.Low;
  }

  // Map complexity ranges to levels
  if (complexity >= 1 && complexity <= 5) {
    return ComplexityLevel.Low;
  } else if (complexity >= 6 && complexity <= 10) {
    return ComplexityLevel.Medium;
  } else if (complexity >= 11 && complexity <= 15) {
    return ComplexityLevel.High;
  } else {
    // 16+
    return ComplexityLevel.Critical;
  }
}

/**
 * Maps complexity level to audio frequency and waveform
 * @param complexity - Cyclomatic complexity value
 * @returns AudioMapping with frequency, waveform, and effects
 */
export function mapToAudio(complexity: number): AudioMapping {
  const level = classifyComplexity(complexity);
  
  let frequency: number;
  let waveform: WaveformType;
  let effects: AudioEffect[];

  switch (level) {
    case ComplexityLevel.Low:
      // Low (1-5): 220-330Hz with sine waveform and reverb
      frequency = 220 + (complexity - 1) * ((330 - 220) / 4);
      waveform = WaveformType.Sine;
      effects = [{ type: 'reverb', intensity: 0.3 }];
      break;

    case ComplexityLevel.Medium:
      // Medium (6-10): 330-523Hz with triangle waveform and tremolo
      frequency = 330 + (complexity - 6) * ((523 - 330) / 4);
      waveform = WaveformType.Triangle;
      effects = [{ type: 'tremolo', intensity: 0.5 }];
      break;

    case ComplexityLevel.High:
      // High (11-15): 523-880Hz with sawtooth waveform and medium distortion
      frequency = 523 + (complexity - 11) * ((880 - 523) / 4);
      waveform = WaveformType.Sawtooth;
      effects = [{ type: 'distortion', intensity: 0.5 }];
      break;

    case ComplexityLevel.Critical:
      // Critical (16+): 880Hz+ with square waveform and high distortion
      frequency = 880 + (complexity - 16) * 20; // Increase by 20Hz per point above 16
      waveform = WaveformType.Square;
      effects = [{ type: 'distortion', intensity: 0.8 }];
      break;
  }

  return {
    frequency,
    waveform,
    duration: 1000, // 1 second default
    volume: 0.5,
    effects,
  };
}

/**
 * Maps complexity level to visual colors
 * @param complexity - Cyclomatic complexity value
 * @returns VisualMapping with colors and opacity
 */
export function mapToVisual(complexity: number): VisualMapping {
  const level = classifyComplexity(complexity);
  
  let color: string;
  let opacity: number;

  switch (level) {
    case ComplexityLevel.Low:
      // Midnight Blue
      color = '#191970';
      opacity = 0.6;
      break;

    case ComplexityLevel.Medium:
      // Toxic Purple
      color = '#9400D3';
      opacity = 0.7;
      break;

    case ComplexityLevel.High:
      // Blood Orange
      color = '#CC5500';
      opacity = 0.8;
      break;

    case ComplexityLevel.Critical:
      // Crimson Red
      color = '#DC143C';
      opacity = 0.9;
      break;
  }

  return {
    color,
    backgroundColor: '#1C1C1C', // Eerie Black
    textColor: '#FFFFFF',
    opacity,
  };
}

/**
 * Assigns animations based on complexity level
 * @param complexity - Cyclomatic complexity value
 * @returns Array of Animation objects
 */
export function mapToAnimations(complexity: number): Animation[] {
  const level = classifyComplexity(complexity);
  const animations: Animation[] = [];

  switch (level) {
    case ComplexityLevel.Low:
    case ComplexityLevel.Medium:
      // No animations for low and medium complexity
      break;

    case ComplexityLevel.High:
      // Cobweb animation for high complexity
      animations.push({
        type: 'cobweb',
        duration: 2000,
        intensity: 0.6,
      });
      break;

    case ComplexityLevel.Critical:
      // Both cobweb and blood drip for critical complexity
      animations.push(
        {
          type: 'cobweb',
          duration: 2000,
          intensity: 0.8,
        },
        {
          type: 'drip',
          duration: 3000,
          intensity: 0.9,
        }
      );
      break;
  }

  return animations;
}

/**
 * Creates a complete theme mapping for a given complexity value
 * @param complexity - Cyclomatic complexity value
 * @returns ThemeMapping with audio, visual, and animation data
 */
export function mapToTheme(complexity: number): ThemeMapping {
  return {
    audio: mapToAudio(complexity),
    visual: mapToVisual(complexity),
    complexity: classifyComplexity(complexity),
    animations: mapToAnimations(complexity),
  };
}

/**
 * Creates a combined theme mapping with both complexity and diagnostic scores
 * @param complexity - Cyclomatic complexity value
 * @param diagnosticScore - Horror score from diagnostics (0-100)
 * @param diagnosticSeverity - Severity level from diagnostics
 * @returns ThemeMapping with combined scoring
 */
export function mapToCombinedTheme(
  complexity: number,
  diagnosticScore: number,
  diagnosticSeverity: 'none' | 'info' | 'warning' | 'error' | 'critical'
): ThemeMapping {
  // Calculate combined score: 70% complexity, 30% diagnostics
  const complexityScore = Math.min(100, complexity * 5); // Scale complexity to 0-100
  const combinedScore = complexityScore * 0.7 + diagnosticScore * 0.3;

  // Use higher of the two scores for determining effects
  const effectiveComplexity = Math.max(complexity, Math.floor(combinedScore / 5));

  const baseTheme = mapToTheme(effectiveComplexity);

  // Enhance with diagnostic-specific effects
  const enhancedAudio = enhanceAudioWithDiagnostics(baseTheme.audio, diagnosticSeverity);
  const enhancedVisual = enhanceVisualWithDiagnostics(baseTheme.visual, diagnosticSeverity, combinedScore);
  const enhancedAnimations = enhanceAnimationsWithDiagnostics(baseTheme.animations, diagnosticSeverity);

  return {
    audio: enhancedAudio,
    visual: enhancedVisual,
    complexity: baseTheme.complexity,
    animations: enhancedAnimations,
    combinedScore,
    diagnosticSeverity,
  };
}

/**
 * Enhance audio mapping with diagnostic-specific sounds
 */
function enhanceAudioWithDiagnostics(
  baseAudio: AudioMapping,
  severity: 'none' | 'info' | 'warning' | 'error' | 'critical'
): AudioMapping {
  const enhanced = { ...baseAudio };

  switch (severity) {
    case 'critical':
      // Add intense distortion and reverb for critical errors
      enhanced.effects = [
        ...enhanced.effects,
        { type: 'distortion', intensity: 0.9 },
        { type: 'reverb', intensity: 0.8 },
        { type: 'tremolo', intensity: 0.7 },
      ];
      enhanced.frequency = Math.max(enhanced.frequency, 1000); // Higher pitch for urgency
      enhanced.waveform = WaveformType.Square; // Harsh sound
      break;

    case 'error':
      // Add moderate distortion for errors
      enhanced.effects = [
        ...enhanced.effects,
        { type: 'distortion', intensity: 0.6 },
        { type: 'tremolo', intensity: 0.5 },
      ];
      enhanced.frequency = Math.max(enhanced.frequency, 700);
      break;

    case 'warning':
      // Add tremolo for warnings (creates unease)
      enhanced.effects = [
        ...enhanced.effects,
        { type: 'tremolo', intensity: 0.4 },
      ];
      break;

    case 'info':
    case 'none':
      // No enhancement needed
      break;
  }

  return enhanced;
}

/**
 * Enhance visual mapping with diagnostic-specific colors
 */
function enhanceVisualWithDiagnostics(
  baseVisual: VisualMapping,
  severity: 'none' | 'info' | 'warning' | 'error' | 'critical',
  combinedScore: number
): VisualMapping {
  const enhanced = { ...baseVisual };

  // Override colors based on severity for immediate feedback
  switch (severity) {
    case 'critical':
      // Deep blood red with pulsing effect
      enhanced.color = '#8B0000'; // Dark red
      enhanced.backgroundColor = '#1A0000'; // Almost black with red tint
      enhanced.opacity = 0.95;
      break;

    case 'error':
      // Bright crimson for errors
      enhanced.color = '#DC143C';
      enhanced.backgroundColor = '#1C0A0A';
      enhanced.opacity = 0.85;
      break;

    case 'warning':
      // Keep existing orange but ensure it's visible
      if (combinedScore > 50) {
        enhanced.color = '#FF8C00'; // Darker orange for high combined scores
        enhanced.opacity = 0.8;
      }
      break;

    case 'info':
      // Subtle blue tint
      enhanced.color = '#4169E1'; // Royal blue
      enhanced.opacity = 0.5;
      break;

    case 'none':
      // Keep base colors
      break;
  }

  return enhanced;
}

/**
 * Enhance animations with diagnostic-specific effects
 */
function enhanceAnimationsWithDiagnostics(
  baseAnimations: Animation[],
  severity: 'none' | 'info' | 'warning' | 'error' | 'critical'
): Animation[] {
  const enhanced = [...baseAnimations];

  switch (severity) {
    case 'critical':
      // Add all horror effects
      enhanced.push(
        {
          type: 'drip',
          duration: 2000,
          intensity: 1.0,
        },
        {
          type: 'cobweb',
          duration: 3000,
          intensity: 0.9,
        },
        {
          type: 'fog',
          duration: 5000,
          intensity: 0.8,
        }
      );
      break;

    case 'error':
      // Add blood drip and cobweb
      enhanced.push(
        {
          type: 'drip',
          duration: 2500,
          intensity: 0.8,
        },
        {
          type: 'cobweb',
          duration: 3000,
          intensity: 0.7,
        }
      );
      break;

    case 'warning':
      // Just cobweb for warnings
      if (!enhanced.some(a => a.type === 'cobweb')) {
        enhanced.push({
          type: 'cobweb',
          duration: 3000,
          intensity: 0.5,
        });
      }
      break;

    case 'info':
    case 'none':
      // No additional animations
      break;
  }

  return enhanced;
}

/**
 * Creates audio mapping for error states (tritone interval)
 * @returns AudioMapping for error state
 */
export function mapErrorToAudio(): AudioMapping {
  // Tritone interval: 440Hz + 622Hz (augmented 4th)
  return {
    frequency: 440, // Base frequency, tritone will be added in synthesis
    waveform: WaveformType.Sine,
    duration: 500,
    volume: 0.6,
    effects: [
      { type: 'distortion', intensity: 0.4 },
      { type: 'reverb', intensity: 0.5 },
    ],
  };
}

/**
 * Creates audio mapping for success states (gothic organ chord)
 * @returns AudioMapping for success state
 */
export function mapSuccessToAudio(): AudioMapping {
  // Gothic organ chord: minor triad with added 7th
  return {
    frequency: 220, // Base frequency, chord will be built in synthesis
    waveform: WaveformType.Sine,
    duration: 1500,
    volume: 0.5,
    effects: [
      { type: 'reverb', intensity: 0.7 },
    ],
  };
}

/**
 * Creates animation for error states (ghostly glow)
 * @returns Animation for error state
 */
export function mapErrorToAnimation(): Animation {
  return {
    type: 'glow',
    duration: 1000,
    intensity: 0.8,
  };
}

/**
 * SensoryMapper class for translating code metrics to sensory outputs
 */
export class SensoryMapper {
  /**
   * Maps cyclomatic complexity to ComplexityLevel
   */
  classifyComplexity(complexity: number): ComplexityLevel {
    return classifyComplexity(complexity);
  }

  /**
   * Maps complexity to audio representation
   */
  mapToAudio(complexity: number): AudioMapping {
    return mapToAudio(complexity);
  }

  /**
   * Maps complexity to visual representation
   */
  mapToVisual(complexity: number): VisualMapping {
    return mapToVisual(complexity);
  }

  /**
   * Maps complexity to complete theme
   */
  mapToTheme(complexity: number): ThemeMapping {
    return mapToTheme(complexity);
  }

  /**
   * Maps complexity and diagnostics to combined theme
   */
  mapToCombinedTheme(
    complexity: number,
    diagnosticScore: number,
    diagnosticSeverity: 'none' | 'info' | 'warning' | 'error' | 'critical'
  ): ThemeMapping {
    return mapToCombinedTheme(complexity, diagnosticScore, diagnosticSeverity);
  }

  /**
   * Maps error state to audio
   */
  mapErrorToAudio(): AudioMapping {
    return mapErrorToAudio();
  }

  /**
   * Maps success state to audio
   */
  mapSuccessToAudio(): AudioMapping {
    return mapSuccessToAudio();
  }

  /**
   * Maps error state to animation
   */
  mapErrorToAnimation(): Animation {
    return mapErrorToAnimation();
  }
}
