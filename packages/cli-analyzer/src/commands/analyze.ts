import { traverseDirectory } from '../utils/file-traversal';
import { BatchAnalyzer } from '../analyzer/batch-analyzer';
import { checkThreshold, formatViolations } from '../analyzer/threshold-checker';
import { generateHTMLReport } from '../reporters/html-reporter';
import { exportJSON } from '../reporters/json-reporter';
import { exportAudioSignatures } from '../reporters/audio-exporter';
import { printSummary, printFileList, printErrors } from '../reporters/text-formatter';

/**
 * Options for analyze command
 */
interface AnalyzeOptions {
  recursive: boolean;
  threshold?: number;
  output?: string;
  format: string;
  exportAudio: boolean;
  audioPath: string;
}

/**
 * Main analyze command handler
 */
export async function analyzeCommand(
  targetPath: string,
  options: AnalyzeOptions
): Promise<void> {
  try {
    // Step 1: Traverse file system
    const { files, errors: traversalErrors } = await traverseDirectory(targetPath, {
      recursive: options.recursive,
      showProgress: true,
    });

    if (files.length === 0) {
      console.error('No supported files found to analyze.');
      process.exit(1);
    }

    // Step 2: Batch analyze files
    const analyzer = new BatchAnalyzer();
    const { files: results, summary, errors: analysisErrors } = await analyzer.analyzeFiles(
      files,
      {
        showProgress: true,
        threshold: options.threshold,
      }
    );

    // Combine errors (normalize traversal errors to match analysis error format)
    const normalizedTraversalErrors = traversalErrors.map(e => ({
      file: e.path,
      error: e.error,
    }));
    const allErrors = [...normalizedTraversalErrors, ...analysisErrors];

    // Step 3: Check threshold (if specified)
    let exitCode = 0;
    if (options.threshold !== undefined) {
      const thresholdResult = checkThreshold(results, options.threshold);
      exitCode = thresholdResult.exitCode;

      if (!thresholdResult.passed) {
        console.error(formatViolations(thresholdResult.violations));
      }
    }

    // Step 4: Generate output based on format
    switch (options.format.toLowerCase()) {
      case 'html':
        if (!options.output) {
          console.error('Error: --output path is required for HTML format');
          process.exit(1);
        }
        await generateHTMLReport(results, summary, options.output);
        console.log(`\n✓ HTML report generated: ${options.output}`);
        break;

      case 'json':
        await exportJSON(results, summary, options.output);
        if (options.output) {
          console.log(`\n✓ JSON report generated: ${options.output}`);
        }
        break;

      case 'text':
      default:
        printSummary(summary, options.threshold);
        printFileList(results, options.threshold);
        break;
    }

    // Step 5: Export audio signatures (if requested)
    if (options.exportAudio) {
      await exportAudioSignatures(results, options.audioPath);
      console.log(`\n✓ Audio signatures exported to: ${options.audioPath}`);
    }

    // Step 6: Print errors (if any)
    if (allErrors.length > 0) {
      printErrors(allErrors);
    }

    // Exit with appropriate code
    process.exit(exitCode);
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
