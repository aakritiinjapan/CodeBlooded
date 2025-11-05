import chalk from 'chalk';
import * as path from 'path';
import { AnalysisResult } from '@codechroma/core';
import { SummaryMetrics } from '../analyzer/batch-analyzer';

/**
 * Format and print summary metrics to console
 */
export function printSummary(summary: SummaryMetrics, threshold?: number): void {
  console.log('\n' + chalk.bold.red('☠️  CodeChroma Analysis Summary'));
  console.log(chalk.gray('═'.repeat(50)));
  
  console.log(chalk.cyan('Total Files:       ') + chalk.white(summary.totalFiles));
  console.log(chalk.cyan('Total Functions:   ') + chalk.white(summary.totalFunctions));
  console.log(chalk.cyan('Total Lines:       ') + chalk.white(summary.totalLines));
  console.log(chalk.cyan('Code Lines:        ') + chalk.white(summary.totalCodeLines));
  console.log(chalk.cyan('Avg Complexity:    ') + formatComplexity(summary.averageComplexity));
  console.log(chalk.cyan('Health Score:      ') + formatHealthScore(summary.healthScore));

  if (threshold !== undefined) {
    console.log(chalk.cyan('Threshold:         ') + chalk.white(threshold));
    
    if (summary.filesAboveThreshold > 0) {
      console.log(
        chalk.red('Files Over Threshold: ') + 
        chalk.bold.red(summary.filesAboveThreshold)
      );
    } else {
      console.log(chalk.green('✓ All files passed threshold check'));
    }
  }

  console.log(chalk.gray('═'.repeat(50)) + '\n');
}

/**
 * Format and print file list with complexity indicators
 */
export function printFileList(
  results: AnalysisResult[],
  threshold?: number
): void {
  if (results.length === 0) {
    console.log(chalk.yellow('No files analyzed.'));
    return;
  }

  console.log(chalk.bold('Files Analyzed:\n'));

  // Sort by complexity (descending)
  const sortedResults = [...results].sort(
    (a, b) => b.metrics.cyclomaticComplexity - a.metrics.cyclomaticComplexity
  );

  for (const result of sortedResults) {
    const fileName = path.basename(result.file);
    const complexity = result.metrics.cyclomaticComplexity;
    const exceedsThreshold = threshold !== undefined && complexity > threshold;

    const complexityStr = formatComplexity(complexity);
    const indicator = getComplexityIndicator(complexity);
    
    if (exceedsThreshold) {
      console.log(
        chalk.red('❌ ') +
        chalk.bold.red(fileName) +
        chalk.gray(' - ') +
        indicator +
        ' ' +
        complexityStr +
        chalk.red(` (exceeds threshold: ${threshold})`)
      );
    } else {
      console.log(
        chalk.green('✓ ') +
        chalk.white(fileName) +
        chalk.gray(' - ') +
        indicator +
        ' ' +
        complexityStr
      );
    }

    // Show top complex functions
    const topFunctions = result.functions
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 3);

    if (topFunctions.length > 0) {
      for (const fn of topFunctions) {
        const fnComplexity = formatComplexity(fn.cyclomaticComplexity);
        console.log(
          chalk.gray('  └─ ') +
          chalk.gray(fn.name) +
          chalk.gray(` (line ${fn.startLine}): `) +
          fnComplexity
        );
      }
    }

    console.log('');
  }
}

/**
 * Format complexity value with color
 */
function formatComplexity(complexity: number): string {
  const rounded = complexity.toFixed(1);
  
  if (complexity <= 5) {
    return chalk.blue(rounded);
  } else if (complexity <= 10) {
    return chalk.magenta(rounded);
  } else if (complexity <= 15) {
    return chalk.yellow(rounded);
  } else {
    return chalk.red(rounded);
  }
}

/**
 * Get complexity indicator emoji/symbol
 */
function getComplexityIndicator(complexity: number): string {
  if (complexity <= 5) {
    return chalk.blue('●');
  } else if (complexity <= 10) {
    return chalk.magenta('●');
  } else if (complexity <= 15) {
    return chalk.yellow('●');
  } else {
    return chalk.red('☠️');
  }
}

/**
 * Format health score with color
 */
function formatHealthScore(score: number): string {
  const rounded = score.toFixed(1);
  
  if (score >= 80) {
    return chalk.green(rounded);
  } else if (score >= 60) {
    return chalk.yellow(rounded);
  } else if (score >= 40) {
    return chalk.yellow(rounded);
  } else {
    return chalk.red(rounded);
  }
}

/**
 * Print error messages
 */
export function printErrors(errors: Array<{ file: string; error: Error }>): void {
  if (errors.length === 0) {
    return;
  }

  console.log(chalk.bold.red('\n⚠️  Errors:\n'));

  for (const { file, error } of errors) {
    console.log(chalk.red('✗ ') + chalk.white(file));
    console.log(chalk.gray('  └─ ') + chalk.red(error.message));
  }

  console.log('');
}
