/**
 * CodeChroma Core Package
 *
 * Multi-sensory code analysis framework providing AST parsing,
 * complexity metrics, audio synthesis, and visualization generation.
 */

// ============================================================================
// Type Definitions
// ============================================================================
export * from './types';

// ============================================================================
// Core Components
// ============================================================================

// AST Analyzer
export { ASTAnalyzer } from './ast-analyzer';
export { ParserRegistry } from './ast-analyzer/ParserRegistry';
export { TypeScriptParser } from './ast-analyzer/TypeScriptParser';
export { JavaScriptParser } from './ast-analyzer/JavaScriptParser';
export { ComplexityCalculator } from './ast-analyzer/ComplexityCalculator';
export { MetricsExtractor } from './ast-analyzer/MetricsExtractor';

// Sensory Mapper
export { SensoryMapper } from './sensory-mapper';

// Audio Engine
export { AudioEngine, EffectsProcessor } from './audio-engine';

// Visualization Engine
export { generateGraphData, FogParticleSystem, D3Renderer } from './visualization';

// ============================================================================
// Utility Functions
// ============================================================================

// Sensory mapper utility functions
export {
  classifyComplexity,
  mapToAudio,
  mapToVisual,
  mapToAnimations,
  mapToTheme,
  mapErrorToAudio,
  mapSuccessToAudio,
  mapErrorToAnimation,
} from './sensory-mapper';

// Configuration management
export {
  ConfigManager,
  DEFAULT_CONFIG,
  validateConfig,
  mergeConfig,
  loadConfig,
  loadConfigFromJSON,
  loadConfigFromFile,
  saveConfigToJSON,
  saveConfigToFile,
} from './config';

// Error handling
export {
  ErrorHandler,
  ErrorSeverity,
  InMemoryErrorLogger,
  ConsoleErrorLogger,
  getErrorSeverity,
  getGlobalErrorHandler,
  setGlobalErrorHandler,
  handleError,
  withErrorHandling,
  createError,
  isRecoverable,
  formatError,
  DEFAULT_RECOVERY_STRATEGIES,
} from './error';
export type {
  ErrorLogEntry,
  ErrorRecoveryStrategy,
  ErrorLogger,
} from './error';

// Health score calculation
export {
  calculateHealthScore,
  calculateAggregateHealthScore,
  getHealthGrade,
  getHealthDescription,
  getHealthColor,
  calculateHealthSummary,
  DEFAULT_HEALTH_WEIGHTS,
} from './health';
export type {
  HealthScoreBreakdown,
  HealthScoreWeights,
  HealthSummary,
} from './health';

// ============================================================================
// Constants
// ============================================================================

/**
 * CodeChroma version
 */
export const VERSION = '0.1.0';

/**
 * Default complexity thresholds
 */
export const COMPLEXITY_THRESHOLDS = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 15,
} as const;

/**
 * Default audio frequencies (Hz)
 */
export const AUDIO_FREQUENCIES = {
  LOW_MIN: 220,
  LOW_MAX: 330,
  MEDIUM_MIN: 330,
  MEDIUM_MAX: 523,
  HIGH_MIN: 523,
  HIGH_MAX: 880,
  CRITICAL_MIN: 880,
} as const;

/**
 * Horror theme colors
 */
export const THEME_COLORS = {
  LOW: '#191970',        // Midnight Blue
  MEDIUM: '#9400D3',     // Toxic Purple
  HIGH: '#CC5500',       // Blood Orange
  CRITICAL: '#DC143C',   // Crimson Red
  BACKGROUND: '#1C1C1C', // Eerie Black
} as const;

/**
 * Default analysis timeout (ms)
 */
export const DEFAULT_ANALYSIS_TIMEOUT = 5000;

/**
 * Maximum file size for analysis (bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
