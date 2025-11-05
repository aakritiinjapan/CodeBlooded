import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';

/**
 * Supported file extensions for analysis
 */
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Options for file traversal
 */
export interface TraversalOptions {
  recursive: boolean;
  showProgress?: boolean;
}

/**
 * Result of file traversal
 */
export interface TraversalResult {
  files: string[];
  errors: Array<{ path: string; error: Error }>;
}

/**
 * Check if a file has a supported extension
 */
function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Recursively traverse directory and collect supported source files
 */
export async function traverseDirectory(
  targetPath: string,
  options: TraversalOptions = { recursive: false }
): Promise<TraversalResult> {
  const files: string[] = [];
  const errors: Array<{ path: string; error: Error }> = [];
  
  const spinner = options.showProgress ? ora('Scanning files...').start() : null;

  try {
    const stats = await fs.promises.stat(targetPath);

    if (stats.isFile()) {
      // Single file
      if (isSupportedFile(targetPath)) {
        files.push(path.resolve(targetPath));
      } else {
        errors.push({
          path: targetPath,
          error: new Error('Unsupported file type'),
        });
      }
    } else if (stats.isDirectory()) {
      // Directory
      await traverseDirectoryRecursive(targetPath, files, errors, options.recursive);
    }

    if (spinner) {
      spinner.succeed(`Found ${files.length} file(s) to analyze`);
    }
  } catch (error) {
    if (spinner) {
      spinner.fail('Failed to scan files');
    }
    errors.push({
      path: targetPath,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  return { files, errors };
}

/**
 * Internal recursive directory traversal
 */
async function traverseDirectoryRecursive(
  dirPath: string,
  files: string[],
  errors: Array<{ path: string; error: Error }>,
  recursive: boolean
): Promise<void> {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip node_modules and hidden directories
      if (entry.isDirectory() && (entry.name === 'node_modules' || entry.name.startsWith('.'))) {
        continue;
      }

      try {
        if (entry.isFile() && isSupportedFile(entry.name)) {
          files.push(path.resolve(fullPath));
        } else if (entry.isDirectory() && recursive) {
          await traverseDirectoryRecursive(fullPath, files, errors, recursive);
        }
      } catch (error) {
        errors.push({
          path: fullPath,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  } catch (error) {
    errors.push({
      path: dirPath,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
