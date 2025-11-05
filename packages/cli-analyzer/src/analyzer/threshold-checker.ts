import { AnalysisResult } from '@codechroma/core';

/**
 * File that exceeds complexity threshold
 */
export interface ThresholdViolation {
  file: string;
  complexity: number;
  threshold: number;
  functions: Array<{
    name: string;
    complexity: number;
    line: number;
  }>;
}

/**
 * Result of threshold checking
 */
export interface ThresholdCheckResult {
  passed: boolean;
  violations: ThresholdViolation[];
  exitCode: number;
}

/**
 * Check if analysis results exceed complexity threshold
 */
export function checkThreshold(
  results: AnalysisResult[],
  threshold: number
): ThresholdCheckResult {
  const violations: ThresholdViolation[] = [];

  for (const result of results) {
    if (result.metrics.cyclomaticComplexity > threshold) {
      // Find functions that contribute to high complexity
      const problematicFunctions = result.functions
        .filter((fn) => fn.cyclomaticComplexity > threshold)
        .map((fn) => ({
          name: fn.name,
          complexity: fn.cyclomaticComplexity,
          line: fn.startLine,
        }));

      violations.push({
        file: result.file,
        complexity: result.metrics.cyclomaticComplexity,
        threshold,
        functions: problematicFunctions,
      });
    }
  }

  const passed = violations.length === 0;
  const exitCode = passed ? 0 : 1;

  return {
    passed,
    violations,
    exitCode,
  };
}

/**
 * Format threshold violations for display
 */
export function formatViolations(violations: ThresholdViolation[]): string {
  if (violations.length === 0) {
    return 'All files passed complexity threshold check.';
  }

  const lines: string[] = [
    `\n❌ ${violations.length} file(s) exceeded complexity threshold:\n`,
  ];

  for (const violation of violations) {
    lines.push(`  ${violation.file}`);
    lines.push(`    Complexity: ${violation.complexity} (threshold: ${violation.threshold})`);

    if (violation.functions.length > 0) {
      lines.push(`    Problematic functions:`);
      for (const fn of violation.functions) {
        lines.push(`      - ${fn.name} (line ${fn.line}): ${fn.complexity}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
