/**
 * CodeChroma CLI Analyzer
 * 
 * Command-line tool for batch code analysis and CI/CD integration
 */

// Export main components
export { BatchAnalyzer } from './analyzer/batch-analyzer';
export type { SummaryMetrics, BatchAnalysisResult } from './analyzer/batch-analyzer';

export { checkThreshold, formatViolations } from './analyzer/threshold-checker';
export type { ThresholdViolation, ThresholdCheckResult } from './analyzer/threshold-checker';

export { traverseDirectory } from './utils/file-traversal';
export type { TraversalOptions, TraversalResult } from './utils/file-traversal';

export { generateHTMLReport } from './reporters/html-reporter';
export { exportJSON } from './reporters/json-reporter';
export type { JSONReport } from './reporters/json-reporter';
export { exportAudioSignatures } from './reporters/audio-exporter';
export { printSummary, printFileList, printErrors } from './reporters/text-formatter';

export { analyzeCommand } from './commands/analyze';
