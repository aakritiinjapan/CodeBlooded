/**
 * Health Score Calculation Tests
 */

import {
  calculateHealthScore,
  calculateAggregateHealthScore,
  getHealthGrade,
  getHealthDescription,
  calculateHealthSummary,
} from '../health';
import { AnalysisResult } from '../types';

describe('Health Score Calculation', () => {
  // Sample analysis result with low complexity
  const lowComplexityAnalysis: AnalysisResult = {
    file: 'test-low.ts',
    metrics: {
      totalLines: 50,
      codeLines: 40,
      commentLines: 10,
      cyclomaticComplexity: 3,
      maintainabilityIndex: 85,
    },
    functions: [
      {
        name: 'simpleFunction',
        startLine: 1,
        endLine: 10,
        cyclomaticComplexity: 2,
        linesOfCode: 10,
        parameters: 1,
        nestingDepth: 1,
      },
      {
        name: 'anotherSimpleFunction',
        startLine: 12,
        endLine: 20,
        cyclomaticComplexity: 3,
        linesOfCode: 8,
        parameters: 2,
        nestingDepth: 1,
      },
    ],
    dependencies: [],
  };

  // Sample analysis result with high complexity
  const highComplexityAnalysis: AnalysisResult = {
    file: 'test-high.ts',
    metrics: {
      totalLines: 200,
      codeLines: 180,
      commentLines: 20,
      cyclomaticComplexity: 25,
      maintainabilityIndex: 40,
    },
    functions: [
      {
        name: 'complexFunction',
        startLine: 1,
        endLine: 100,
        cyclomaticComplexity: 18,
        linesOfCode: 100,
        parameters: 5,
        nestingDepth: 4,
      },
      {
        name: 'anotherComplexFunction',
        startLine: 102,
        endLine: 180,
        cyclomaticComplexity: 22,
        linesOfCode: 78,
        parameters: 4,
        nestingDepth: 5,
      },
    ],
    dependencies: [],
  };

  describe('calculateHealthScore', () => {
    it('should return high score for low complexity code', () => {
      const result = calculateHealthScore(lowComplexityAnalysis);

      expect(result.overall).toBeGreaterThan(80);
      expect(result.complexity).toBeGreaterThan(80);
      expect(result.maintainability).toBeGreaterThan(80);
    });

    it('should return low score for high complexity code', () => {
      const result = calculateHealthScore(highComplexityAnalysis);

      expect(result.overall).toBeLessThan(60);
      expect(result.complexity).toBeLessThan(60);
    });

    it('should return scores between 0 and 100', () => {
      const result = calculateHealthScore(lowComplexityAnalysis);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.complexity).toBeGreaterThanOrEqual(0);
      expect(result.complexity).toBeLessThanOrEqual(100);
      expect(result.maintainability).toBeGreaterThanOrEqual(0);
      expect(result.maintainability).toBeLessThanOrEqual(100);
      expect(result.size).toBeGreaterThanOrEqual(0);
      expect(result.size).toBeLessThanOrEqual(100);
      expect(result.distribution).toBeGreaterThanOrEqual(0);
      expect(result.distribution).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateAggregateHealthScore', () => {
    it('should aggregate scores weighted by lines of code', () => {
      const analyses = [lowComplexityAnalysis, highComplexityAnalysis];
      const result = calculateAggregateHealthScore(analyses);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      
      // Score should be weighted more toward high complexity file (more lines)
      const lowScore = calculateHealthScore(lowComplexityAnalysis).overall;
      const highScore = calculateHealthScore(highComplexityAnalysis).overall;
      
      // Aggregate should be closer to high complexity score due to more lines
      expect(Math.abs(result.overall - highScore)).toBeLessThan(
        Math.abs(result.overall - lowScore)
      );
    });

    it('should return perfect score for empty array', () => {
      const result = calculateAggregateHealthScore([]);

      expect(result.overall).toBe(100);
      expect(result.complexity).toBe(100);
      expect(result.maintainability).toBe(100);
      expect(result.size).toBe(100);
      expect(result.distribution).toBe(100);
    });
  });

  describe('getHealthGrade', () => {
    it('should return correct grades', () => {
      expect(getHealthGrade(95)).toBe('A');
      expect(getHealthGrade(85)).toBe('B');
      expect(getHealthGrade(75)).toBe('C');
      expect(getHealthGrade(65)).toBe('D');
      expect(getHealthGrade(50)).toBe('F');
    });
  });

  describe('getHealthDescription', () => {
    it('should return correct descriptions', () => {
      expect(getHealthDescription(95)).toBe('Excellent');
      expect(getHealthDescription(85)).toBe('Good');
      expect(getHealthDescription(75)).toBe('Fair');
      expect(getHealthDescription(65)).toBe('Poor');
      expect(getHealthDescription(50)).toBe('Critical');
    });
  });

  describe('calculateHealthSummary', () => {
    it('should calculate summary statistics', () => {
      const analyses = [lowComplexityAnalysis, highComplexityAnalysis];
      const summary = calculateHealthSummary(analyses, 70);

      expect(summary.totalFiles).toBe(2);
      expect(summary.averageScore).toBeGreaterThanOrEqual(0);
      expect(summary.averageScore).toBeLessThanOrEqual(100);
      expect(summary.grade).toBeDefined();
      expect(summary.description).toBeDefined();
      expect(summary.filesAboveThreshold + summary.filesBelowThreshold).toBe(2);
    });
  });
});
