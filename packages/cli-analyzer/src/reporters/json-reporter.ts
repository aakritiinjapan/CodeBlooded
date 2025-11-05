import * as fs from 'fs';
import { AnalysisResult } from '@codechroma/core';
import { SummaryMetrics } from '../analyzer/batch-analyzer';

/**
 * JSON export structure
 */
export interface JSONReport {
  timestamp: string;
  summary: SummaryMetrics;
  files: AnalysisResult[];
  metadata: {
    version: string;
    generator: string;
  };
}

/**
 * Export analysis results as JSON
 */
export async function exportJSON(
  results: AnalysisResult[],
  summary: SummaryMetrics,
  outputPath?: string
): Promise<void> {
  const report: JSONReport = {
    timestamp: new Date().toISOString(),
    summary,
    files: results,
    metadata: {
      version: '0.1.0',
      generator: 'CodeChroma CLI',
    },
  };

  const json = JSON.stringify(report, null, 2);

  if (outputPath) {
    await fs.promises.writeFile(outputPath, json, 'utf-8');
  } else {
    // Write to stdout
    console.log(json);
  }
}
