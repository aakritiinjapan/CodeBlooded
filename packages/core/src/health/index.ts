/**
 * Health Score Calculation
 * 
 * Aggregates complexity metrics into a single health score (0-100)
 * Higher scores indicate better code health
 */

import { AnalysisResult, CodeMetrics, FunctionMetric, ComplexityLevel } from '../types';
import { classifyComplexity } from '../sensory-mapper';

/**
 * Health score breakdown by category
 */
export interface HealthScoreBreakdown {
  overall: number;
  complexity: number;
  maintainability: number;
  size: number;
  distribution: number;
}

/**
 * Health score weights for different metrics
 */
export interface HealthScoreWeights {
  complexity: number;
  maintainability: number;
  size: number;
  distribution: number;
}

/**
 * Default weights for health score calculation
 */
export const DEFAULT_HEALTH_WEIGHTS: HealthScoreWeights = {
  complexity: 0.4,      // 40% weight on complexity
  maintainability: 0.3, // 30% weight on maintainability index
  size: 0.15,           // 15% weight on code size
  distribution: 0.15,   // 15% weight on complexity distribution
};

/**
 * Calculate complexity score (0-100)
 * Lower complexity = higher score
 */
function calculateComplexityScore(metrics: CodeMetrics, functions: FunctionMetric[]): number {
  if (functions.length === 0) {
    // No functions, use file-level complexity
    const level = classifyComplexity(metrics.cyclomaticComplexity);
    return complexityLevelToScore(level);
  }

  // Calculate weighted average based on function size
  let totalWeight = 0;
  let weightedScore = 0;

  for (const func of functions) {
    const weight = func.linesOfCode;
    const level = classifyComplexity(func.cyclomaticComplexity);
    const score = complexityLevelToScore(level);

    weightedScore += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 100;
}

/**
 * Convert complexity level to score
 */
function complexityLevelToScore(level: ComplexityLevel): number {
  switch (level) {
    case ComplexityLevel.Low:
      return 100;
    case ComplexityLevel.Medium:
      return 70;
    case ComplexityLevel.High:
      return 40;
    case ComplexityLevel.Critical:
      return 10;
    default:
      return 50;
  }
}

/**
 * Calculate maintainability score (0-100)
 * Uses maintainability index if available, otherwise estimates from complexity
 */
function calculateMaintainabilityScore(metrics: CodeMetrics): number {
  if (metrics.maintainabilityIndex > 0) {
    // Maintainability index is typically 0-100, use directly
    return Math.max(0, Math.min(100, metrics.maintainabilityIndex));
  }

  // Estimate from complexity if maintainability index not available
  // Lower complexity = higher maintainability
  const complexityPenalty = Math.min(metrics.cyclomaticComplexity * 2, 50);
  return Math.max(0, 100 - complexityPenalty);
}

/**
 * Calculate size score (0-100)
 * Penalizes very large files
 */
function calculateSizeScore(metrics: CodeMetrics): number {
  const { codeLines } = metrics;

  // Ideal range: 0-300 lines
  // Acceptable: 300-500 lines
  // Large: 500-1000 lines
  // Very large: 1000+ lines

  if (codeLines <= 300) {
    return 100;
  } else if (codeLines <= 500) {
    // Linear decrease from 100 to 70
    return 100 - ((codeLines - 300) / 200) * 30;
  } else if (codeLines <= 1000) {
    // Linear decrease from 70 to 40
    return 70 - ((codeLines - 500) / 500) * 30;
  } else {
    // Exponential decrease for very large files
    const excess = codeLines - 1000;
    const penalty = Math.min(excess / 100, 30);
    return Math.max(10, 40 - penalty);
  }
}

/**
 * Calculate distribution score (0-100)
 * Rewards even distribution of complexity across functions
 * Penalizes having a few very complex functions
 */
function calculateDistributionScore(functions: FunctionMetric[]): number {
  if (functions.length === 0) {
    return 100;
  }

  if (functions.length === 1) {
    // Single function, score based on its complexity
    const level = classifyComplexity(functions[0].cyclomaticComplexity);
    return complexityLevelToScore(level);
  }

  // Calculate complexity distribution
  const complexities = functions.map((f) => f.cyclomaticComplexity);
  const avgComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
  const maxComplexity = Math.max(...complexities);

  // Calculate standard deviation
  const variance =
    complexities.reduce((sum, c) => sum + Math.pow(c - avgComplexity, 2), 0) /
    complexities.length;
  const stdDev = Math.sqrt(variance);

  // Calculate coefficient of variation (normalized standard deviation)
  const cv = avgComplexity > 0 ? stdDev / avgComplexity : 0;

  // Count critical complexity functions
  const criticalCount = complexities.filter((c) => c > 15).length;
  const criticalRatio = criticalCount / functions.length;

  // Base score from average complexity
  let score = 100 - avgComplexity * 3;

  // Penalty for high variation (uneven distribution)
  score -= cv * 20;

  // Penalty for critical complexity functions
  score -= criticalRatio * 30;

  // Penalty for any single function being too complex
  if (maxComplexity > 20) {
    score -= (maxComplexity - 20) * 2;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall health score for a single file
 */
export function calculateHealthScore(
  analysis: AnalysisResult,
  weights: HealthScoreWeights = DEFAULT_HEALTH_WEIGHTS
): HealthScoreBreakdown {
  const complexityScore = calculateComplexityScore(
    analysis.metrics,
    analysis.functions
  );
  const maintainabilityScore = calculateMaintainabilityScore(analysis.metrics);
  const sizeScore = calculateSizeScore(analysis.metrics);
  const distributionScore = calculateDistributionScore(analysis.functions);

  // Calculate weighted overall score
  const overall =
    complexityScore * weights.complexity +
    maintainabilityScore * weights.maintainability +
    sizeScore * weights.size +
    distributionScore * weights.distribution;

  return {
    overall: Math.round(overall),
    complexity: Math.round(complexityScore),
    maintainability: Math.round(maintainabilityScore),
    size: Math.round(sizeScore),
    distribution: Math.round(distributionScore),
  };
}

/**
 * Calculate aggregate health score for multiple files
 */
export function calculateAggregateHealthScore(
  analyses: AnalysisResult[],
  weights: HealthScoreWeights = DEFAULT_HEALTH_WEIGHTS
): HealthScoreBreakdown {
  if (analyses.length === 0) {
    return {
      overall: 100,
      complexity: 100,
      maintainability: 100,
      size: 100,
      distribution: 100,
    };
  }

  // Calculate health score for each file
  const fileScores = analyses.map((analysis) =>
    calculateHealthScore(analysis, weights)
  );

  // Weight by lines of code
  const totalLines = analyses.reduce(
    (sum, analysis) => sum + analysis.metrics.codeLines,
    0
  );

  let weightedOverall = 0;
  let weightedComplexity = 0;
  let weightedMaintainability = 0;
  let weightedSize = 0;
  let weightedDistribution = 0;

  analyses.forEach((analysis, index) => {
    const weight = totalLines > 0 ? analysis.metrics.codeLines / totalLines : 1 / analyses.length;
    const score = fileScores[index];

    weightedOverall += score.overall * weight;
    weightedComplexity += score.complexity * weight;
    weightedMaintainability += score.maintainability * weight;
    weightedSize += score.size * weight;
    weightedDistribution += score.distribution * weight;
  });

  return {
    overall: Math.round(weightedOverall),
    complexity: Math.round(weightedComplexity),
    maintainability: Math.round(weightedMaintainability),
    size: Math.round(weightedSize),
    distribution: Math.round(weightedDistribution),
  };
}

/**
 * Get health score grade (A-F)
 */
export function getHealthGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get health score description
 */
export function getHealthDescription(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}

/**
 * Get health score color (for UI display)
 */
export function getHealthColor(score: number): string {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#FFC107'; // Yellow
  if (score >= 40) return '#FF9800'; // Orange
  return '#F44336'; // Red
}

/**
 * Summary statistics for health scores
 */
export interface HealthSummary {
  totalFiles: number;
  averageScore: number;
  grade: string;
  description: string;
  filesAboveThreshold: number;
  filesBelowThreshold: number;
  breakdown: HealthScoreBreakdown;
}

/**
 * Calculate health summary for a codebase
 */
export function calculateHealthSummary(
  analyses: AnalysisResult[],
  threshold: number = 70,
  weights: HealthScoreWeights = DEFAULT_HEALTH_WEIGHTS
): HealthSummary {
  const breakdown = calculateAggregateHealthScore(analyses, weights);
  const filesAboveThreshold = analyses.filter(
    (analysis) => calculateHealthScore(analysis, weights).overall >= threshold
  ).length;

  return {
    totalFiles: analyses.length,
    averageScore: breakdown.overall,
    grade: getHealthGrade(breakdown.overall),
    description: getHealthDescription(breakdown.overall),
    filesAboveThreshold,
    filesBelowThreshold: analyses.length - filesAboveThreshold,
    breakdown,
  };
}
