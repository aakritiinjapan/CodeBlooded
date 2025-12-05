import { AnalysisResult } from '../types';
export interface HealthScoreBreakdown {
    overall: number;
    complexity: number;
    maintainability: number;
    size: number;
    distribution: number;
}
export interface HealthScoreWeights {
    complexity: number;
    maintainability: number;
    size: number;
    distribution: number;
}
export declare const DEFAULT_HEALTH_WEIGHTS: HealthScoreWeights;
export declare function calculateHealthScore(analysis: AnalysisResult, weights?: HealthScoreWeights): HealthScoreBreakdown;
export declare function calculateAggregateHealthScore(analyses: AnalysisResult[], weights?: HealthScoreWeights): HealthScoreBreakdown;
export declare function getHealthGrade(score: number): string;
export declare function getHealthDescription(score: number): string;
export declare function getHealthColor(score: number): string;
export interface HealthSummary {
    totalFiles: number;
    averageScore: number;
    grade: string;
    description: string;
    filesAboveThreshold: number;
    filesBelowThreshold: number;
    breakdown: HealthScoreBreakdown;
}
export declare function calculateHealthSummary(analyses: AnalysisResult[], threshold?: number, weights?: HealthScoreWeights): HealthSummary;
//# sourceMappingURL=index.d.ts.map