import * as fs from 'fs';
import ora from 'ora';
import { ASTAnalyzer, AnalysisResult, calculateHealthScore } from '@codechroma/core';

/**
 * Summary metrics for batch analysis
 */
export interface SummaryMetrics {
  totalFiles: number;
  totalFunctions: number;
  averageComplexity: number;
  filesAboveThreshold: number;
  healthScore: number;
  totalLines: number;
  totalCodeLines: number;
}

/**
 * Result of batch analysis
 */
export interface BatchAnalysisResult {
  files: AnalysisResult[];
  summary: SummaryMetrics;
  errors: Array<{ file: string; error: Error }>;
}

/**
 * Batch analyzer for processing multiple files
 */
export class BatchAnalyzer {
  private analyzer: ASTAnalyzer;

  constructor() {
    this.analyzer = new ASTAnalyzer();
  }

  /**
   * Analyze multiple files and collect results
   */
  async analyzeFiles(
    filePaths: string[],
    options: { showProgress?: boolean; threshold?: number } = {}
  ): Promise<BatchAnalysisResult> {
    const results: AnalysisResult[] = [];
    const errors: Array<{ file: string; error: Error }> = [];

    const spinner = options.showProgress
      ? ora(`Analyzing 0/${filePaths.length} files...`).start()
      : null;

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];

      try {
        if (spinner) {
          spinner.text = `Analyzing ${i + 1}/${filePaths.length} files: ${filePath}`;
        }

        const code = await fs.promises.readFile(filePath, 'utf-8');
        const result = await this.analyzer.analyzeFile(code, filePath);
        results.push(result);
      } catch (error) {
        errors.push({
          file: filePath,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    if (spinner) {
      spinner.succeed(`Analyzed ${results.length} file(s)`);
    }

    const summary = this.calculateSummary(results, options.threshold);

    return {
      files: results,
      summary,
      errors,
    };
  }

  /**
   * Calculate aggregate summary metrics
   */
  private calculateSummary(
    results: AnalysisResult[],
    threshold?: number
  ): SummaryMetrics {
    if (results.length === 0) {
      return {
        totalFiles: 0,
        totalFunctions: 0,
        averageComplexity: 0,
        filesAboveThreshold: 0,
        healthScore: 0,
        totalLines: 0,
        totalCodeLines: 0,
      };
    }

    let totalComplexity = 0;
    let totalFunctions = 0;
    let filesAboveThreshold = 0;
    let totalLines = 0;
    let totalCodeLines = 0;
    const healthScores: number[] = [];

    for (const result of results) {
      totalComplexity += result.metrics.cyclomaticComplexity;
      totalFunctions += result.functions.length;
      totalLines += result.metrics.totalLines;
      totalCodeLines += result.metrics.codeLines;

      // Calculate health score for this file
      const healthScoreBreakdown = calculateHealthScore(result);
      healthScores.push(healthScoreBreakdown.overall);

      // Check threshold
      if (threshold !== undefined && result.metrics.cyclomaticComplexity > threshold) {
        filesAboveThreshold++;
      }
    }

    const averageComplexity = totalComplexity / results.length;
    const healthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    return {
      totalFiles: results.length,
      totalFunctions,
      averageComplexity,
      filesAboveThreshold,
      healthScore,
      totalLines,
      totalCodeLines,
    };
  }
}
