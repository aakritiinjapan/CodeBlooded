/**
 * Document Analyzer
 *
 * Handles document analysis with debouncing to avoid excessive processing.
 * Uses core ASTAnalyzer to analyze changed documents.
 */

import { Connection } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ASTAnalyzer } from '@codechroma/core';
import type { AnalysisResult, Language } from '@codechroma/core';

/**
 * Debounce delay in milliseconds
 */
const DEBOUNCE_DELAY = 1000;

/**
 * Document Analyzer class
 */
export class DocumentAnalyzer {
  private connection: Connection;
  private analyzer: ASTAnalyzer;
  private analysisCache: Map<string, AnalysisResult>;
  private debounceTimers: Map<string, NodeJS.Timeout>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.analyzer = new ASTAnalyzer();
    this.analysisCache = new Map();
    this.debounceTimers = new Map();
  }

  /**
   * Analyze a text document with debouncing
   */
  public analyzeDocument(
    document: TextDocument,
    callback: (result: AnalysisResult) => void
  ): void {
    const uri = document.uri;

    // Clear existing timer for this document
    const existingTimer = this.debounceTimers.get(uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(async () => {
      try {
        this.connection.console.log(`Analyzing document: ${uri}`);
        
        const code = document.getText();
        const language = this.detectLanguage(document.uri);

        // Parse and analyze
        const parseResult = await this.analyzer.parse(code, language);
        const analysisResult = this.analyzer.analyze(parseResult, code, uri);

        // Cache the result
        this.analysisCache.set(uri, analysisResult);

        // Invoke callback with result
        callback(analysisResult);

        this.connection.console.log(
          `Analysis complete for ${uri}: ${analysisResult.functions.length} functions, ` +
          `complexity ${analysisResult.metrics.cyclomaticComplexity}`
        );
      } catch (error) {
        this.connection.console.error(
          `Error analyzing document ${uri}: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        // Clean up timer
        this.debounceTimers.delete(uri);
      }
    }, DEBOUNCE_DELAY);

    this.debounceTimers.set(uri, timer);
  }

  /**
   * Get cached analysis result for a document
   */
  public getCachedAnalysis(uri: string): AnalysisResult | undefined {
    return this.analysisCache.get(uri);
  }

  /**
   * Clear analysis cache for a document
   */
  public clearAnalysis(uri: string): void {
    this.analysisCache.delete(uri);
    
    const timer = this.debounceTimers.get(uri);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(uri);
    }
  }

  /**
   * Clear all analysis caches
   */
  public clearAllAnalyses(): void {
    this.analysisCache.clear();
    
    // Clear all pending timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Detect language from file URI
   */
  private detectLanguage(uri: string): Language {
    const lowerUri = uri.toLowerCase();
    
    if (lowerUri.endsWith('.ts') || lowerUri.endsWith('.tsx')) {
      return 'typescript' as Language;
    } else if (lowerUri.endsWith('.js') || lowerUri.endsWith('.jsx')) {
      return 'javascript' as Language;
    }
    
    return 'unknown' as Language;
  }
}
