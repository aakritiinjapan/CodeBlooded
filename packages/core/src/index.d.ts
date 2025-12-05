export * from './types';
export { ASTAnalyzer } from './ast-analyzer';
export { ParserRegistry } from './ast-analyzer/ParserRegistry';
export { TypeScriptParser } from './ast-analyzer/TypeScriptParser';
export { JavaScriptParser } from './ast-analyzer/JavaScriptParser';
export { ComplexityCalculator } from './ast-analyzer/ComplexityCalculator';
export { MetricsExtractor } from './ast-analyzer/MetricsExtractor';
export { SensoryMapper } from './sensory-mapper';
export { AudioEngine, EffectsProcessor } from './audio-engine';
export { generateGraphData, FogParticleSystem, D3Renderer } from './visualization';
export { classifyComplexity, mapToAudio, mapToVisual, mapToAnimations, mapToTheme, mapToCombinedTheme, mapErrorToAudio, mapSuccessToAudio, mapErrorToAnimation, } from './sensory-mapper';
export { ConfigManager, DEFAULT_CONFIG, validateConfig, mergeConfig, loadConfig, loadConfigFromJSON, loadConfigFromFile, saveConfigToJSON, saveConfigToFile, } from './config';
export { ErrorHandler, ErrorSeverity, InMemoryErrorLogger, ConsoleErrorLogger, getErrorSeverity, getGlobalErrorHandler, setGlobalErrorHandler, handleError, withErrorHandling, createError, isRecoverable, formatError, DEFAULT_RECOVERY_STRATEGIES, } from './error';
export type { ErrorLogEntry, ErrorRecoveryStrategy, ErrorLogger, } from './error';
export { calculateHealthScore, calculateAggregateHealthScore, getHealthGrade, getHealthDescription, getHealthColor, calculateHealthSummary, DEFAULT_HEALTH_WEIGHTS, } from './health';
export type { HealthScoreBreakdown, HealthScoreWeights, HealthSummary, } from './health';
export declare const VERSION = "0.1.0";
export declare const COMPLEXITY_THRESHOLDS: {
    readonly LOW: 5;
    readonly MEDIUM: 10;
    readonly HIGH: 15;
};
export declare const AUDIO_FREQUENCIES: {
    readonly LOW_MIN: 220;
    readonly LOW_MAX: 330;
    readonly MEDIUM_MIN: 330;
    readonly MEDIUM_MAX: 523;
    readonly HIGH_MIN: 523;
    readonly HIGH_MAX: 880;
    readonly CRITICAL_MIN: 880;
};
export declare const THEME_COLORS: {
    readonly LOW: "#1E90FF";
    readonly MEDIUM: "#9370DB";
    readonly HIGH: "#DAA520";
    readonly CRITICAL: "#FF8C00";
    readonly BACKGROUND: "#1C1C1C";
};
export declare const DEFAULT_ANALYSIS_TIMEOUT = 5000;
export declare const MAX_FILE_SIZE: number;
//# sourceMappingURL=index.d.ts.map