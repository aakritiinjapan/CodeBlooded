/**
 * CodeChroma VS Code Extension
 * 
 * Provides real-time audio-visual feedback for code complexity analysis
 */

import * as vscode from 'vscode';
import { ASTAnalyzer, AudioEngine, SensoryMapper } from '@codechroma/core';
import { DecorationManager } from './decorations';
import { StatusBarManager } from './statusbar';
import { WebviewManager } from './webview';

let analyzer: ASTAnalyzer;
let audioEngine: AudioEngine;
let sensoryMapper: SensoryMapper;
let decorationManager: DecorationManager;
let statusBarManager: StatusBarManager;
let webviewManager: WebviewManager | undefined;

let analysisTimeout: NodeJS.Timeout | undefined;
let audioEnabled: boolean = true;

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('CodeChroma extension is now active');

  // Initialize core components
  analyzer = new ASTAnalyzer();
  audioEngine = new AudioEngine();
  sensoryMapper = new SensoryMapper();
  decorationManager = new DecorationManager();
  statusBarManager = new StatusBarManager();

  // Load persisted configuration
  loadConfiguration(context);

  // Initialize audio engine
  audioEngine.initialize().catch(err => {
    console.error('Failed to initialize audio engine:', err);
    vscode.window.showWarningMessage('CodeChroma: Audio engine initialization failed. Visual feedback only.');
  });

  // Register commands
  const toggleAudioCommand = vscode.commands.registerCommand('codechroma.toggleAudio', () => {
    toggleAudio(context);
  });

  const showGraphCommand = vscode.commands.registerCommand('codechroma.showGraph', () => {
    showGraph(context);
  });

  // Register status bar click handler
  statusBarManager.onAudioToggleClick(() => {
    toggleAudio(context);
  });

  // Show status bar
  statusBarManager.show();

  // Register document change listener
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
    handleDocumentChange(event);
  });

  // Register active editor change listener
  const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      handleEditorChange(editor);
    }
  });

  // Analyze current document if available
  if (vscode.window.activeTextEditor) {
    handleEditorChange(vscode.window.activeTextEditor);
  }

  // Add to subscriptions for cleanup
  context.subscriptions.push(
    toggleAudioCommand,
    showGraphCommand,
    documentChangeListener,
    editorChangeListener,
    statusBarManager,
    decorationManager
  );

  console.log('CodeChroma: Initialization complete');
}

/**
 * Extension deactivation cleanup
 */
export function deactivate() {
  // Clear any pending analysis
  if (analysisTimeout) {
    clearTimeout(analysisTimeout);
  }

  // Stop audio engine
  if (audioEngine) {
    audioEngine.stop();
  }

  // Dispose webview if open
  if (webviewManager) {
    webviewManager.dispose();
  }

  console.log('CodeChroma extension deactivated');
}

/**
 * Toggle audio feedback on/off
 */
function toggleAudio(context: vscode.ExtensionContext) {
  audioEnabled = !audioEnabled;

  if (audioEnabled) {
    audioEngine.enable();
    vscode.window.showInformationMessage('CodeChroma: Audio feedback enabled');
  } else {
    audioEngine.disable();
    audioEngine.stop();
    vscode.window.showInformationMessage('CodeChroma: Audio feedback disabled');
  }

  // Update status bar
  statusBarManager.updateAudioState(audioEnabled);

  // Persist state
  context.globalState.update('codechroma.audioEnabled', audioEnabled);
}

/**
 * Show AST graph visualization in webview
 */
function showGraph(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('CodeChroma: No active editor');
    return;
  }

  // Create or show webview
  if (!webviewManager) {
    webviewManager = new WebviewManager(context);
    context.subscriptions.push(webviewManager);
  }

  webviewManager.show();

  // Analyze current document and update graph
  const document = editor.document;
  analyzeDocument(document).then(result => {
    if (result && webviewManager) {
      webviewManager.updateGraph(result);
    }
  });
}

/**
 * Load configuration from global state and workspace settings
 */
function loadConfiguration(context: vscode.ExtensionContext) {
  // Load audio enabled state from global state (persisted across sessions)
  const savedAudioState = context.globalState.get<boolean>('codechroma.audioEnabled');
  if (savedAudioState !== undefined) {
    audioEnabled = savedAudioState;
  }

  // Load configuration from workspace settings
  const config = vscode.workspace.getConfiguration('codechroma');
  
  // Load volume preference
  const volume = config.get<number>('audio.volume', 0.5);
  audioEngine.setVolume(volume);

  // Load animations preference
  const animationsEnabled = config.get<boolean>('visual.animations', true);
  // Store for future use
  context.globalState.update('codechroma.animationsEnabled', animationsEnabled);

  // Load analysis threshold
  const threshold = config.get<number>('analysis.threshold', 10);
  context.globalState.update('codechroma.threshold', threshold);

  // Update audio engine state
  if (audioEnabled) {
    audioEngine.enable();
  } else {
    audioEngine.disable();
  }

  // Update status bar
  statusBarManager.updateAudioState(audioEnabled);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('codechroma')) {
        handleConfigurationChange(context);
      }
    })
  );
}

/**
 * Handle configuration changes
 */
function handleConfigurationChange(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codechroma');

  // Update volume if changed
  const volume = config.get<number>('audio.volume', 0.5);
  audioEngine.setVolume(volume);

  // Update animations preference
  const animationsEnabled = config.get<boolean>('visual.animations', true);
  context.globalState.update('codechroma.animationsEnabled', animationsEnabled);

  // Update threshold
  const threshold = config.get<number>('analysis.threshold', 10);
  context.globalState.update('codechroma.threshold', threshold);

  // Re-analyze current document with new settings
  const editor = vscode.window.activeTextEditor;
  if (editor && isSupportedLanguage(editor.document.languageId)) {
    performAnalysis(editor.document);
  }
}

/**
 * Handle document change with debouncing
 */
function handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
  const document = event.document;

  // Only analyze supported languages
  if (!isSupportedLanguage(document.languageId)) {
    return;
  }

  // Clear existing timeout
  if (analysisTimeout) {
    clearTimeout(analysisTimeout);
  }

  // Debounce analysis to 1 second after last keystroke
  analysisTimeout = setTimeout(() => {
    performAnalysis(document);
  }, 1000);
}

/**
 * Handle active editor change
 */
function handleEditorChange(editor: vscode.TextEditor) {
  const document = editor.document;

  // Only analyze supported languages
  if (!isSupportedLanguage(document.languageId)) {
    return;
  }

  // Perform immediate analysis for editor switch
  performAnalysis(document);
}

/**
 * Perform analysis on a document
 */
async function performAnalysis(document: vscode.TextDocument) {
  try {
    const analysisResult = await analyzeDocument(document);
    
    if (!analysisResult) {
      return;
    }

    // Apply visual decorations
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === document) {
      decorationManager.applyDecorations(editor, analysisResult);
    }

    // Play audio feedback if enabled
    if (audioEnabled && analysisResult.metrics) {
      const complexity = analysisResult.metrics.cyclomaticComplexity;
      const audioMapping = sensoryMapper.mapToAudio(complexity);
      audioEngine.play(audioMapping).catch(err => {
        console.error('CodeChroma: Audio playback failed', err);
      });
    }

    // Update status bar with health score
    if (analysisResult.metrics) {
      const { calculateHealthScore } = require('@codechroma/core');
      const healthScore = calculateHealthScore(analysisResult.metrics);
      statusBarManager.updateHealthScore(healthScore);
    }
  } catch (error) {
    console.error('CodeChroma: Analysis failed', error);
  }
}

/**
 * Check if language is supported
 */
function isSupportedLanguage(languageId: string): boolean {
  return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId);
}

/**
 * Analyze a document and return results
 */
async function analyzeDocument(document: vscode.TextDocument): Promise<any> {
  try {
    const code = document.getText();
    const filePath = document.fileName;

    // Use the convenience method that does both parse and analyze
    const analysisResult = await analyzer.analyzeFile(code, filePath);

    return analysisResult;
  } catch (error) {
    console.error('CodeChroma: Analysis failed', error);
    return null;
  }
}
