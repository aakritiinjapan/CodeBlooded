/**
 * Core type definitions for CodeChroma
 */

// Language support
export enum Language {
  TypeScript = 'typescript',
  JavaScript = 'javascript',
  Unknown = 'unknown',
}

// Complexity levels
export enum ComplexityLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

// Waveform types for audio synthesis
export enum WaveformType {
  Sine = 'sine',
  Square = 'square',
  Sawtooth = 'sawtooth',
  Triangle = 'triangle',
}

// AST Analysis types
export interface ParseResult {
  ast: any;
  language: Language;
  parseTime: number;
}

export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
}

export interface FunctionMetric {
  name: string;
  startLine: number;
  endLine: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
  parameters: number;
  nestingDepth: number;
}

export interface Dependency {
  from: string;
  to: string;
  type: 'import' | 'call' | 'inheritance';
}

export interface AnalysisResult {
  file: string;
  metrics: CodeMetrics;
  functions: FunctionMetric[];
  dependencies: Dependency[];
}

// Parser Plugin interface
export interface ParserPlugin {
  language: Language;
  extensions: string[];
  parse(code: string, filePath?: string): any;
}

// Sensory Mapping types
export interface AudioEffect {
  type: 'distortion' | 'reverb' | 'delay' | 'tremolo';
  intensity: number;
}

export interface AudioMapping {
  frequency: number;
  waveform: WaveformType;
  duration: number;
  volume: number;
  effects: AudioEffect[];
}

export interface VisualMapping {
  color: string;
  backgroundColor: string;
  textColor: string;
  opacity: number;
}

export interface Animation {
  type: 'pulse' | 'drip' | 'glow' | 'cobweb' | 'fog';
  duration: number;
  intensity: number;
}

export interface ThemeMapping {
  audio: AudioMapping;
  visual: VisualMapping;
  complexity: ComplexityLevel;
  animations: Animation[];
}

// Visualization types
export interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'function' | 'class' | 'module';
  metrics: CodeMetrics;
  complexity: ComplexityLevel;
  color: string;
  size: number;
  icon?: 'skull' | 'cobweb' | 'default';
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'import' | 'call' | 'inheritance';
  weight: number;
}

export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  averageComplexity: number;
  healthScore: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

// D3.js Force Simulation Configuration
export interface ForceSimulationConfig {
  charge: number;
  linkDistance: number;
  centerForce: number;
  collisionRadius: number;
}

// Visualization Engine Configuration
export interface VisualizationConfig {
  width: number;
  height: number;
  forceConfig: ForceSimulationConfig;
  enableAnimations: boolean;
  theme: 'horror' | 'default';
}

// Visualization Engine Interface
export interface VisualizationEngine {
  generateGraph(analysis: AnalysisResult): GraphData;
  renderGraph(container: HTMLElement, data: GraphData, config?: Partial<VisualizationConfig>): void;
  applyTheme(theme: ThemeMapping): void;
  addAnimation(nodeId: string, animation: Animation): void;
  dispose(): void;
}

// Audio Engine types
export interface AudioEngineConfig {
  enabled: boolean;
  volume: number;
  maxOscillators: number;
  fadeTime: number; // in seconds
}

export interface OscillatorConfig {
  frequency: number;
  waveform: WaveformType;
  duration: number;
  volume: number;
}

export interface EffectConfig {
  type: 'distortion' | 'reverb' | 'tremolo';
  intensity: number;
}

export interface AudioEngine {
  initialize(): Promise<void>;
  play(mapping: AudioMapping): Promise<void>;
  playChord(frequencies: number[], waveform: WaveformType, duration: number): Promise<void>;
  playTritone(baseFrequency?: number, duration?: number): Promise<void>;
  playGothicChord(rootFrequency?: number, duration?: number): Promise<void>;
  stop(): void;
  setVolume(volume: number): void;
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
  dispose(): void;
}

export interface AudioContextWrapper {
  context: AudioContext | null;
  masterGain: GainNode | null;
  oscillators: Map<string, OscillatorNode>;
}

// Configuration types
export interface CodeChromaConfig {
  audio: {
    enabled: boolean;
    volume: number;
    waveform: WaveformType;
  };
  visual: {
    theme: 'horror' | 'default';
    animations: boolean;
  };
  analysis: {
    threshold: number;
    languages: Language[];
  };
}

// Error handling
export enum ErrorCode {
  PARSE_ERROR = 'PARSE_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  AUDIO_ERROR = 'AUDIO_ERROR',
  VISUALIZATION_ERROR = 'VISUALIZATION_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
}

export class CodeChromaError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: any
  ) {
    super(message);
    this.name = 'CodeChromaError';
  }
}
