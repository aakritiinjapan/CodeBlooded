/**
 * Complexity Analysis Manager
 * 
 * Analyzes all workspace files on startup and caches complexity data.
 * Used in Safe Mode to show complexity-based highlighting and window coloring.
 */

import * as vscode from 'vscode';
import { ASTAnalyzer, SensoryMapper, AnalysisResult, ComplexityLevel, THEME_COLORS } from '@codeblooded/core';

// SensoryMapper is used in the constructor signature but not stored
// This is intentional - we may use it in the future for more advanced mappings

/**
 * Cached analysis result for a file
 */
export interface FileComplexityData {
  filePath: string;
  maxComplexity: number;
  complexityLevel: ComplexityLevel;
  functions: FunctionComplexity[];
  lastAnalyzed: number;
  analysisResult: AnalysisResult | null;
}

/**
 * Function-level complexity data
 */
export interface FunctionComplexity {
  name: string;
  complexity: number;
  level: ComplexityLevel;
  startLine: number;
  endLine: number;
  linesOfCode: number;
  parameters: number;
  nestingDepth: number;
}

/**
 * Complexity Analysis Manager
 * 
 * Manages workspace-wide complexity analysis and caching.
 * Only active in Safe Mode.
 */
export class ComplexityAnalysisManager implements vscode.Disposable {
  private analyzer: ASTAnalyzer;
  private fileCache: Map<string, FileComplexityData> = new Map();
  private isAnalyzing: boolean = false;
  private disposables: vscode.Disposable[] = [];
  private enabled: boolean = false;
  
  // Event emitter for analysis completion
  private onAnalysisCompleteEmitter = new vscode.EventEmitter<FileComplexityData>();
  public readonly onAnalysisComplete = this.onAnalysisCompleteEmitter.event;
  
  // Event emitter for workspace analysis completion
  private onWorkspaceAnalysisCompleteEmitter = new vscode.EventEmitter<void>();
  public readonly onWorkspaceAnalysisComplete = this.onWorkspaceAnalysisCompleteEmitter.event;

  constructor(
    _context: vscode.ExtensionContext,
    analyzer: ASTAnalyzer,
    _sensoryMapper: SensoryMapper
  ) {
    this.analyzer = analyzer;
    
    console.log('[ComplexityAnalysisManager] Created');
  }

  /**
   * Initialize the manager
   */
  async initialize(): Promise<void> {
    console.log('[ComplexityAnalysisManager] Initializing...');
    
    // Listen for file saves to re-analyze
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(document => {
        if (this.enabled && this.isSupportedLanguage(document.languageId)) {
          this.analyzeFile(document);
        }
      })
    );
    
    // Listen for file changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        if (this.enabled && this.isSupportedLanguage(event.document.languageId)) {
          // Debounce analysis on change
          this.scheduleAnalysis(event.document);
        }
      })
    );
    
    console.log('[ComplexityAnalysisManager] Initialized');
  }

  /**
   * Enable complexity analysis (called when entering Safe Mode)
   */
  async enable(): Promise<void> {
    if (this.enabled) return;
    
    this.enabled = true;
    console.log('[ComplexityAnalysisManager] Enabled - starting workspace analysis');
    
    // Analyze all workspace files
    await this.analyzeWorkspace();
  }

  /**
   * Disable complexity analysis (called when entering Horror Mode)
   */
  disable(): void {
    if (!this.enabled) return;
    
    this.enabled = false;
    console.log('[ComplexityAnalysisManager] Disabled');
    
    // Keep the cache for quick re-enable, but stop analyzing
  }

  /**
   * Check if manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get cached complexity data for a file
   */
  getFileComplexity(filePath: string): FileComplexityData | undefined {
    return this.fileCache.get(filePath);
  }

  /**
   * Get the color for the window edge based on complexity level
   */
  getComplexityColor(level: ComplexityLevel): string {
    switch (level) {
      case ComplexityLevel.Low:
        return THEME_COLORS.LOW;      // #1E90FF - Dodger Blue
      case ComplexityLevel.Medium:
        return THEME_COLORS.MEDIUM;   // #9370DB - Medium Purple
      case ComplexityLevel.High:
        return THEME_COLORS.HIGH;     // #DAA520 - Goldenrod
      case ComplexityLevel.Critical:
        return THEME_COLORS.CRITICAL; // #FF8C00 - Dark Orange
      default:
        return THEME_COLORS.LOW;
    }
  }

  /**
   * Classify complexity value into a level
   */
  classifyComplexity(complexity: number): ComplexityLevel {
    if (complexity <= 5) {
      return ComplexityLevel.Low;
    } else if (complexity <= 10) {
      return ComplexityLevel.Medium;
    } else if (complexity <= 15) {
      return ComplexityLevel.High;
    } else {
      return ComplexityLevel.Critical;
    }
  }

  /**
   * Analyze all supported files in the workspace
   */
  private async analyzeWorkspace(): Promise<void> {
    if (this.isAnalyzing) {
      console.log('[ComplexityAnalysisManager] Already analyzing, skipping');
      return;
    }

    this.isAnalyzing = true;
    console.log('[ComplexityAnalysisManager] Starting workspace analysis...');

    try {
      // Find all supported files
      const files = await vscode.workspace.findFiles(
        '**/*.{ts,tsx,js,jsx,py,java,cs,go,rs,cpp,cc,cxx,c,php,rb,swift,kt,kts,scala}',
        '**/node_modules/**',
        500 // Limit to 500 files for performance
      );

      console.log(`[ComplexityAnalysisManager] Found ${files.length} files to analyze`);

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'codeblooded: Analyzing workspace complexity...',
          cancellable: false
        },
        async (progress) => {
          let analyzed = 0;
          
          for (const fileUri of files) {
            try {
              const document = await vscode.workspace.openTextDocument(fileUri);
              await this.analyzeFile(document, false); // Don't emit individual events
              analyzed++;
              
              progress.report({
                increment: (100 / files.length),
                message: `${analyzed}/${files.length} files`
              });
            } catch (error) {
              console.warn(`[ComplexityAnalysisManager] Failed to analyze ${fileUri.fsPath}:`, error);
            }
          }
        }
      );

      console.log(`[ComplexityAnalysisManager] Workspace analysis complete. Cached ${this.fileCache.size} files`);
      this.onWorkspaceAnalysisCompleteEmitter.fire();
      
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(document: vscode.TextDocument, emitEvent: boolean = true): Promise<FileComplexityData | null> {
    if (!this.isSupportedLanguage(document.languageId)) {
      return null;
    }

    try {
      const code = document.getText();
      const filePath = document.fileName;
      
      const analysisResult = await this.analyzer.analyzeFile(code, filePath);
      
      if (!analysisResult || !analysisResult.functions) {
        return null;
      }

      // Extract function complexity data
      const functions: FunctionComplexity[] = analysisResult.functions.map((f: any) => ({
        name: f.name,
        complexity: f.cyclomaticComplexity || 1,
        level: this.classifyComplexity(f.cyclomaticComplexity || 1),
        startLine: f.startLine,
        endLine: f.endLine,
        linesOfCode: f.linesOfCode || 0,
        parameters: f.parameters || 0,
        nestingDepth: f.nestingDepth || 0
      }));

      // Calculate max complexity
      const maxComplexity = functions.length > 0
        ? Math.max(...functions.map(f => f.complexity))
        : 1;

      const complexityData: FileComplexityData = {
        filePath,
        maxComplexity,
        complexityLevel: this.classifyComplexity(maxComplexity),
        functions,
        lastAnalyzed: Date.now(),
        analysisResult
      };

      // Cache the result
      this.fileCache.set(filePath, complexityData);
      
      if (emitEvent) {
        this.onAnalysisCompleteEmitter.fire(complexityData);
      }

      return complexityData;
      
    } catch (error) {
      console.warn(`[ComplexityAnalysisManager] Analysis failed for ${document.fileName}:`, error);
      return null;
    }
  }

  // Debounce timer for file changes
  private analysisTimers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Schedule analysis with debouncing
   */
  private scheduleAnalysis(document: vscode.TextDocument): void {
    const filePath = document.fileName;
    
    // Clear existing timer
    const existingTimer = this.analysisTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Schedule new analysis
    const timer = setTimeout(() => {
      this.analyzeFile(document);
      this.analysisTimers.delete(filePath);
    }, 1000); // 1 second debounce
    
    this.analysisTimers.set(filePath, timer);
  }

  /**
   * Check if a language is supported
   */
  private isSupportedLanguage(languageId: string): boolean {
    const supportedLanguages = [
      'typescript', 'javascript', 'typescriptreact', 'javascriptreact',
      'python',
      'java',
      'csharp',
      'go',
      'rust',
      'cpp', 'c',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'scala'
    ];
    return supportedLanguages.includes(languageId);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.fileCache.clear();
    console.log('[ComplexityAnalysisManager] Cache cleared');
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.analysisTimers.forEach(timer => clearTimeout(timer));
    this.analysisTimers.clear();
    this.fileCache.clear();
    this.onAnalysisCompleteEmitter.dispose();
    this.onWorkspaceAnalysisCompleteEmitter.dispose();
  }
}
