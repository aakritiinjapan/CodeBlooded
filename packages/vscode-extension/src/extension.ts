import * as vscode from 'vscode';
import { ASTAnalyzer, SensoryMapper } from '@codechroma/core';
import { DecorationManager } from './decorations';
import { StatusBarManager } from './statusbar';
import { WebviewManager } from './webview';
import { LocalAudioEngine, AmbientTheme } from './audio/localAudioEngine';
import { ThemeManager } from './themeManager';
import { DiagnosticManager, DiagnosticSummary } from './diagnosticManager';
import { EditorEffectsManager, FunctionWithError } from './editorEffects';
import { HorrorPopupManager } from './horrorPopup';
import { SafetyManager } from './safetyManager';


let analyzer: ASTAnalyzer;
let audioEngine: LocalAudioEngine;
let sensoryMapper: SensoryMapper;
let decorationManager: DecorationManager;
let statusBarManager: StatusBarManager;
let webviewManager: WebviewManager | undefined;
let themeManager: ThemeManager;
let diagnosticManager: DiagnosticManager;
let editorEffects: EditorEffectsManager;
let horrorPopup: HorrorPopupManager;
let safetyManager: SafetyManager;

let analysisTimeout: NodeJS.Timeout | undefined;
let audioTimeout: NodeJS.Timeout | undefined;
let popupTimeout: NodeJS.Timeout | undefined; // Delay popup to avoid interrupting typing
let lastTypingTime: number = 0; // Track when user last typed
let audioEnabled: boolean = true;
let currentComplexity: number = 0;
let currentDiagnostics: DiagnosticSummary | undefined;
let currentDocumentUri: string | undefined; // Track current document to detect file switches

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('[CodeChroma Debug] Extension activated');

  // Initialize core components
  analyzer = new ASTAnalyzer();
  audioEngine = new LocalAudioEngine(context);
  sensoryMapper = new SensoryMapper();
  decorationManager = new DecorationManager();
  statusBarManager = new StatusBarManager();
  themeManager = new ThemeManager();
  diagnosticManager = new DiagnosticManager();
  editorEffects = new EditorEffectsManager();
  horrorPopup = new HorrorPopupManager(context);
  safetyManager = new SafetyManager(context);

  // Show first-run warning for horror features
  safetyManager.showFirstRunWarning().then(accepted => {
    if (accepted) {
      console.log('[CodeChroma] Horror features enabled by user');
    } else {
      console.log('[CodeChroma] User chose to stay in safe mode');
    }
  });

  // Load persisted configuration
  loadConfiguration(context);

  // Listen for diagnostic changes
  diagnosticManager.onDidChangeDiagnostics(diagnostics => {
    const previousDiagnostics = currentDiagnostics;
    currentDiagnostics = diagnostics;
    
    const activeEditor = vscode.window.activeTextEditor;
    const activeDocumentUri = activeEditor?.document.uri.toString();
    
    console.log('[CodeChroma Debug] Diagnostics changed:', {
      previous: previousDiagnostics,
      current: diagnostics,
      currentDoc: currentDocumentUri,
      activeDoc: activeDocumentUri
    });
    
    // Only trigger popup if we're on the SAME document and have errors
    // This prevents popups when switching between files
    const isSameDocument = currentDocumentUri === activeDocumentUri;
    const hasErrors = diagnostics.errorCount > 0;
    const errorsIncreased = diagnostics.errorCount > (previousDiagnostics?.errorCount || 0);
    
    console.log('[CodeChroma Debug] Popup conditions:', {
      isSameDocument,
      hasErrors,
      errorsIncreased,
      hasPrevious: !!previousDiagnostics
    });
    
    // Trigger popup if:
    // 1. We're on the same document
    // 2. There are errors present  
    // 3. Either errors just increased, OR errors exist and user stopped typing recently
    const timeSinceLastTyping = Date.now() - lastTypingTime;
    const userStoppedTyping = timeSinceLastTyping > 500; // User hasn't typed for 500ms
    const shouldTriggerPopup = isSameDocument && hasErrors && (errorsIncreased || (userStoppedTyping && previousDiagnostics));
    
    console.log('[CodeChroma Debug] Should trigger popup:', shouldTriggerPopup, {
      errorsIncreased,
      userStoppedTyping,
      timeSinceLastTyping
    });
    
    if (shouldTriggerPopup) {
      // Clear any pending popup timeout (reset the timer on new errors)
      if (popupTimeout) {
        console.log('[CodeChroma Debug] Clearing previous popup timeout');
        clearTimeout(popupTimeout);
        popupTimeout = undefined;
      }
      
      // Calculate popup severity based on incremental error count, not total
      const newErrorCount = diagnostics.errorCount - (previousDiagnostics?.errorCount || 0);
      const totalErrors = diagnostics.errorCount;
      
      // Determine severity based on how many errors total and how severe
      let popupSeverity: 'warning' | 'error' | 'critical' = 'error';
      
      if (totalErrors >= 5) {
        popupSeverity = 'critical'; // 5+ errors = critical
      } else if (totalErrors >= 3) {
        popupSeverity = 'error'; // 3-4 errors = error
      } else if (newErrorCount >= 2 || diagnostics.warningCount >= 5) {
        popupSeverity = 'error'; // Multiple new errors or lots of warnings
      } else if (diagnostics.errorCount === 1 && diagnostics.warningCount < 5) {
        popupSeverity = 'warning'; // Just one error = warning level
      }
      
      const errorMessage = `${diagnostics.errorCount} error(s) detected!`;
      
      console.log('[CodeChroma Debug] Scheduling horror popup after 2s inactivity:', {
        severity: popupSeverity,
        totalErrors,
        newErrorCount
      });
      
      // Wait 2 seconds of inactivity before showing popup
      // This prevents interrupting the user while they're typing
      // The timeout is cleared on every keystroke in handleDocumentChange
      popupTimeout = setTimeout(async () => {
        console.log('[CodeChroma Debug] User inactive for 2s with errors, showing popup');
        
        // PAUSE AMBIENT for warning/error (mild/medium), but KEEP PLAYING for critical
        // This enhances the horror effect: critical errors are so bad, both audios play together
        const shouldPauseAmbient = popupSeverity === 'warning' || popupSeverity === 'error';
        if (shouldPauseAmbient) {
          console.log('[CodeChroma Debug] Pausing ambient for', popupSeverity, 'popup');
          audioEngine.pauseAmbient(); // Pauses ONLY ambient, popup audio unaffected
        } else {
          console.log('[CodeChroma Debug] Keeping ambient playing for critical popup (layered horror)');
        }
        
        // Play horror sound FIRST - must happen BEFORE showing panel (panel creation kills audio context)
        console.log('[CodeChroma Debug] Starting popup audio...');
        audioEngine.playPopupSound(popupSeverity as any).catch(err => {
          console.error('[CodeChroma Debug] Popup audio failed:', err);
        });
        
        // Small delay to let audio start playing before panel opens
        await new Promise(resolve => setTimeout(resolve, 150));
        
        console.log('[CodeChroma Debug] Popup audio playing, now showing visual');
        
        // Set cleanup callback for when popup closes (manual or auto)
        horrorPopup.setOnPopupClosed(() => {
          console.log('[CodeChroma Debug] Popup closed callback - stopping popup audio');
          audioEngine.stopPopup();
          
          // Resume ambient if we paused it
          if (shouldPauseAmbient) {
            console.log('[CodeChroma Debug] Resuming ambient audio after popup');
            audioEngine.resumeAmbient();
          }
        });
        
        // Show visual popup
        horrorPopup.showPopup(popupSeverity, errorMessage).catch(err => {
          console.error('[CodeChroma Debug] Horror popup failed:', err);
        });
        
        popupTimeout = undefined;
      }, 2000); // 2 second delay
    } else {
      console.log('[CodeChroma Debug] Skipping popup:', { isSameDocument, hasErrors, errorsIncreased, hasPrevious: !!previousDiagnostics });
    }
    
    updateCombinedTheme();
  });

  // Initialize audio engine asynchronously to avoid blocking startup
  audioEngine.initialize().then(() => {
    console.log('[CodeChroma Debug] Audio engine ready');
    statusBarManager.setAudioStatus(true);
  }).catch(err => {
    console.warn('[CodeChroma Debug] Audio engine initialization failed, continuing with visual-only mode:', err);
    statusBarManager.setAudioStatus(false);
    vscode.window.showWarningMessage('CodeChroma: Audio engine initialization failed. Visual feedback only.');
  });

  // Register commands
  const toggleAudioCommand = vscode.commands.registerCommand('codechroma.toggleAudio', () => {
    toggleAudio(context);
  });

  const showGraphCommand = vscode.commands.registerCommand('codechroma.showGraph', () => {
    showGraph(context);
  });

  const resetThemeCommand = vscode.commands.registerCommand('codechroma.resetTheme', () => {
    console.log('[CodeChroma Debug] Reset theme command triggered');
    themeManager.setEnabled(false);
    setTimeout(() => {
      const config = vscode.workspace.getConfiguration('codechroma');
      const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
      themeManager.setEnabled(workspaceTintEnabled);
      console.log('[CodeChroma Debug] Theme manager re-enabled:', workspaceTintEnabled);
    }, 100);
    vscode.window.showInformationMessage('CodeChroma: Theme reset');
  });

  const testAudioCommand = vscode.commands.registerCommand('codechroma.testAudio', async () => {
    console.log('[CodeChroma Debug] Test audio command triggered');
    try {
      // Test if audio engine is ready
      if (!audioEngine) {
        vscode.window.showErrorMessage('CodeChroma: Audio engine not initialized');
        return;
      }

      console.log('[CodeChroma Debug] Audio engine enabled:', audioEngine.isEnabled());
      
      // Test popup sounds in sequence
      vscode.window.showInformationMessage('CodeChroma: Testing horror audio... Listen!');
      
      // Test warning sound
      await audioEngine.playPopupSound('warning');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test error sound
      await audioEngine.playPopupSound('error');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Test critical sound
      await audioEngine.playPopupSound('critical');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('[CodeChroma Debug] Audio test completed');
      vscode.window.showInformationMessage('CodeChroma: Audio test completed!');
    } catch (error) {
      console.error('[CodeChroma Debug] Test audio failed:', error);
      vscode.window.showErrorMessage(`CodeChroma: Test audio failed - ${error}`);
    }
  });

  const showDebugInfoCommand = vscode.commands.registerCommand('codechroma.showDebugInfo', () => {
    const config = vscode.workspace.getConfiguration('codechroma');
    const diagnostics = diagnosticManager.getCurrentSummary();
    
    const info = `
🎭 CodeChroma Debug Info:

📊 Current State:
- Complexity: ${currentComplexity}
- Diagnostics: ${diagnostics.errorCount} errors, ${diagnostics.warningCount} warnings
- Horror Score: ${diagnostics.horrorScore}
- Severity: ${diagnostics.severity}

🔊 Audio Settings:
- Enabled: ${audioEnabled}
- Volume: ${config.get('audio.volume')}
- Engine Ready: ${audioEngine.isEnabled()}

🎨 Visual Settings:
- Workspace Tint: ${config.get('visual.workspaceTint')}
- Animations: ${config.get('visual.animations')}
- Theme Manager Enabled: ${themeManager ? 'Yes' : 'No'}

💡 Tip: If you don't see/hear effects:
1. Check "CodeChroma: Toggle Audio Feedback"
2. Enable "codechroma.visual.workspaceTint" in settings
3. Try "CodeChroma: Force Update Theme & Audio"
    `.trim();
    
    vscode.window.showInformationMessage(info, { modal: true });
    console.log('[CodeChroma Debug]', info);
  });

  const forceUpdateCommand = vscode.commands.registerCommand('codechroma.forceUpdate', () => {
    console.log('[CodeChroma Debug] Force update triggered');
    updateCombinedTheme();
    vscode.window.showInformationMessage('CodeChroma: Theme and audio updated!');
  });

  const showAudioBridgeCommand = vscode.commands.registerCommand('codechroma.showAudioBridge', async () => {
    console.log('[CodeChroma Debug] Show audio bridge command triggered');
    try {
      // Force initialize if not ready
      await audioEngine.initialize();
      vscode.window.showInformationMessage('CodeChroma: Audio bridge visible. Check the logs for debugging!');
    } catch (error) {
      vscode.window.showErrorMessage('CodeChroma: Failed to show audio bridge - ' + error);
    }
  });

  // Test horror popup command
  const testHorrorPopupCommand = vscode.commands.registerCommand('codechroma.testHorrorPopup', async () => {
    const severity = await vscode.window.showQuickPick(
      ['warning', 'error', 'critical'],
      { placeHolder: 'Select horror popup severity to test' }
    );
    
    if (severity) {
      await horrorPopup.showPopup(severity as any, `Testing ${severity} popup`);
    }
  });

  // Toggle safe mode command
  const toggleSafeModeCommand = vscode.commands.registerCommand('codechroma.toggleSafeMode', async () => {
    if (safetyManager.isSafeModeActive()) {
      const confirm = await vscode.window.showWarningMessage(
        '⚠️ Enable horror features? This will activate jumpscares, random events, and psychological horror effects.',
        'Enable',
        'Cancel'
      );
      
      if (confirm === 'Enable') {
        await safetyManager.exitSafeMode();
        vscode.window.showInformationMessage('CodeChroma: Horror features enabled. Use Ctrl+Shift+Escape to disable instantly.');
      }
    } else {
      await safetyManager.enterSafeMode();
      vscode.window.showInformationMessage('CodeChroma: Safe mode enabled. All horror effects disabled.');
    }
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
    resetThemeCommand,
    testAudioCommand,
    showDebugInfoCommand,
    forceUpdateCommand,
    showAudioBridgeCommand,
    testHorrorPopupCommand,
    toggleSafeModeCommand,
    documentChangeListener,
    editorChangeListener,
    statusBarManager,
    decorationManager,
    audioEngine,
    themeManager,
    diagnosticManager,
    editorEffects,
    horrorPopup,
    safetyManager
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
    audioEngine.stopAll();
  }

  if (themeManager) {
    themeManager.dispose();
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
    audioEngine.stopAll();
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

  const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
  themeManager.setEnabled(workspaceTintEnabled);
  context.globalState.update('codechroma.workspaceTint', workspaceTintEnabled);

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

  const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
  themeManager.setEnabled(workspaceTintEnabled);
  context.globalState.update('codechroma.workspaceTint', workspaceTintEnabled);

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

  // Update current document URI
  currentDocumentUri = document.uri.toString();

  // Track typing time
  lastTypingTime = Date.now();

  // Clear any pending popup timeout when user is typing
  // This prevents popups while actively writing code
  // BUT: If we have critical errors (9+), don't clear the timeout - force the popup!
  if (popupTimeout) {
    // Get current error count
    const currentErrors = currentDiagnostics ? currentDiagnostics.errorCount : 0;
    const isCritical = currentErrors >= 9;
    
    if (isCritical) {
      console.log('[CodeChroma Debug] User typing but CRITICAL errors detected - NOT clearing popup timeout');
    } else {
      console.log('[CodeChroma Debug] User is typing - clearing popup timeout');
      clearTimeout(popupTimeout);
      popupTimeout = undefined;
    }
  }

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

  // Update current document URI for tracking
  currentDocumentUri = document.uri.toString();
  console.log('[CodeChroma Debug] Editor changed to:', currentDocumentUri);

  // Only analyze supported languages
  if (!isSupportedLanguage(document.languageId)) {
    // Reset for unsupported files
    currentComplexity = 0;
    currentDiagnostics = undefined;
    themeManager.setEnabled(false);
    editorEffects.clearEffects(editor);
    return;
  }

  // Reset state for new file
  currentComplexity = 0;
  currentDiagnostics = diagnosticManager.getCurrentSummary();

  // Perform immediate analysis for editor switch
  performAnalysis(document);
}

/**
 * Perform analysis on a document
 */
async function performAnalysis(document: vscode.TextDocument) {
  try {
    console.log('[CodeChroma Debug] Performing analysis for:', document.fileName);
    const analysisResult = await analyzeDocument(document);
    
    if (!analysisResult) {
      console.log('[CodeChroma Debug] No analysis result returned (likely parse error)');
      
      // When our parser fails, check if VS Code has diagnostics for this file
      // This handles syntax errors that prevent parsing
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
      
      if (errorCount > 0) {
        console.log('[CodeChroma Debug] VS Code detected', errorCount, 'errors in file with parse failure');
        
        // Set a very low health score for unparseable files with errors
        statusBarManager.updateHealthScore(0); // F grade - critical failure
        currentComplexity = 100; // Set high complexity to trigger horror theme
        
        // Update theme to reflect the error state
        updateCombinedTheme();
        
        // Schedule popup if user stops typing
        if (popupTimeout) {
          clearTimeout(popupTimeout);
        }
        
        const errorMessage = `${errorCount} syntax error(s) detected!`;
        const popupSeverity = errorCount >= 5 ? 'critical' : errorCount >= 3 ? 'error' : 'warning';
        
        console.log('[CodeChroma Debug] Scheduling popup for parse errors after 2s inactivity');
        
        popupTimeout = setTimeout(async () => {
          const timeSinceTyping = Date.now() - lastTypingTime;
          console.log('[CodeChroma Debug] Checking if should show popup, time since typing:', timeSinceTyping);
          
          if (timeSinceTyping >= 2000) {
            console.log('[CodeChroma Debug] Showing popup for syntax errors');
            
            // PAUSE AMBIENT for warning/error (mild/medium), but KEEP PLAYING for critical
            // Parse errors are typically 'warning' severity, so pause ambient
            const shouldPauseAmbient = popupSeverity === 'warning' || popupSeverity === 'error';
            if (shouldPauseAmbient) {
              console.log('[CodeChroma Debug] Pausing ambient for', popupSeverity, 'popup');
              audioEngine.pauseAmbient(); // Pauses ONLY ambient, popup audio unaffected
            } else {
              console.log('[CodeChroma Debug] Keeping ambient playing for critical popup (layered horror)');
            }
            
            // Play horror sound FIRST - must happen BEFORE showing panel (panel creation kills audio context)
            console.log('[CodeChroma Debug] Starting popup audio...');
            audioEngine.playPopupSound(popupSeverity as any).catch(err => {
              console.error('[CodeChroma Debug] Popup audio failed:', err);
            });
            
            // Small delay to let audio start playing before panel opens
            await new Promise(resolve => setTimeout(resolve, 150));
            
            console.log('[CodeChroma Debug] Popup audio playing, now showing visual');
            
            // Set cleanup callback for when popup closes (manual or auto)
            horrorPopup.setOnPopupClosed(() => {
              console.log('[CodeChroma Debug] Popup closed callback - stopping popup audio');
              audioEngine.stopPopup();
              
              // Resume ambient if we paused it
              if (shouldPauseAmbient) {
                console.log('[CodeChroma Debug] Resuming ambient audio after popup');
                audioEngine.resumeAmbient();
              }
            });
            
            // Show visual popup
            horrorPopup.showPopup(popupSeverity, errorMessage).catch(err => {
              console.error('[CodeChroma Debug] Horror popup failed:', err);
            });
          }
          popupTimeout = undefined;
        }, 2000);
      }
      
      return;
    }

    console.log('[CodeChroma Debug] Analysis result:', analysisResult);

    // Display syntax errors for Python files
    if (analysisResult.syntaxErrors && analysisResult.syntaxErrors.length > 0) {
      console.warn('[CodeChroma] Syntax errors detected:', analysisResult.syntaxErrors);
      vscode.window.showWarningMessage(
        `CodeChroma detected ${analysisResult.syntaxErrors.length} syntax error(s) in Python file. Check the console for details.`
      );
    }

    // Apply visual decorations
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === document) {
      decorationManager.applyDecorations(editor, analysisResult);
    }

    if (analysisResult.metrics) {
      // Use the maximum function complexity for theme, not the total file complexity
      let maxComplexity = 0;
      if (analysisResult.functions && analysisResult.functions.length > 0) {
        maxComplexity = Math.max(...analysisResult.functions.map((f: any) => f.cyclomaticComplexity || 0));
        console.log('[CodeChroma Debug] Max function complexity:', maxComplexity);
        console.log('[CodeChroma Debug] Functions:', analysisResult.functions.map((f: any) => ({
          name: f.name,
          complexity: f.cyclomaticComplexity
        })));
      } else {
        // Fallback to file complexity if no functions found
        maxComplexity = analysisResult.metrics.cyclomaticComplexity;
      }
      
      currentComplexity = maxComplexity;
      console.log('[CodeChroma Debug] Using complexity for theme:', currentComplexity);

      // Update combined theme (complexity + diagnostics)
      updateCombinedTheme();

      const { calculateHealthScore } = require('@codechroma/core');
      const healthScore = calculateHealthScore(analysisResult);
      statusBarManager.updateHealthScore(healthScore.overall);
      
      console.log('[CodeChroma Debug] Analysis complete', {
        maxComplexity: currentComplexity,
        healthScore: healthScore.overall,
        file: analysisResult.file
      });
    }
  } catch (error) {
    console.error('[CodeChroma Debug] Analysis failed:', error);
  }
}

/**
 * Update combined theme based on both complexity and diagnostics
 */
function updateCombinedTheme(): void {
  const diagnostics = currentDiagnostics || diagnosticManager.getCurrentSummary();
  
  console.log('[CodeChroma Debug] Updating combined theme:', {
    complexity: currentComplexity,
    diagnostics: diagnostics
  });

  // If no complexity AND no diagnostics, reset to clean state
  if (currentComplexity === 0 && diagnostics.totalCount === 0) {
    console.log('[CodeChroma Debug] Clean code - resetting theme');
    
    // Reset to default theme
    const config = vscode.workspace.getConfiguration('codechroma');
    const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
    
    if (workspaceTintEnabled) {
      // Set to peaceful blue/green theme for perfect code
      const cleanTheme = sensoryMapper.mapToVisual(0);
      themeManager.updateTheme(cleanTheme);
    }
    
    // Clear all effects
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editorEffects.clearEffects(editor);
    }
    
    return;
  }

  // Use combined scoring if we have both metrics
  if (currentComplexity > 0 || diagnostics.totalCount > 0) {
    const combinedTheme = sensoryMapper.mapToCombinedTheme(
      currentComplexity,
      diagnostics.horrorScore,
      diagnostics.severity
    );

    console.log('[CodeChroma Debug] Combined theme generated:', combinedTheme);

    // Set ambient audio based on combined theme
    if (audioEnabled) {
      // Map complexity to ambient theme
      // Low: 2-7, Medium: 20-28, High: 42, Critical: 70+
      const score = combinedTheme.combinedScore || 0;
      let ambientTheme: 'calm' | 'warning' | 'danger' | 'critical';
      if (score >= 60 || diagnostics.errorCount >= 5) {
        ambientTheme = 'critical'; // Critical complexity
      } else if (score >= 35 || diagnostics.errorCount >= 3) {
        ambientTheme = 'danger'; // High complexity
      } else if (score >= 15 || diagnostics.errorCount >= 1) {
        ambientTheme = 'warning'; // Medium complexity
      } else {
        ambientTheme = 'calm'; // Low complexity
      }
      
      audioEngine.setAmbientTheme(ambientTheme).catch((err: any) => {
        console.error('[CodeChroma Debug] Failed to set ambient:', err);
      });
    }

    // Apply visual theme
    themeManager.updateTheme(combinedTheme.visual);

    // Apply horror effects directly to the editor
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const hasWebs = combinedTheme.animations.some(a => a.type === 'cobweb');
      const hasDrips = combinedTheme.animations.some(a => a.type === 'drip');
      const hasFog = combinedTheme.animations.some(a => a.type === 'fog');

      // Only show blood drips if there are actual errors
      const showBloodDrips = hasDrips && diagnostics.errorCount > 0;

      // Get functions with errors for blood drip positioning
      const functionsWithErrors: FunctionWithError[] = [];
      if (showBloodDrips) {
        const documentDiagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        const errorLines = new Set<number>();
        
        // Collect all lines with errors
        documentDiagnostics.forEach(diag => {
          if (diag.severity === vscode.DiagnosticSeverity.Error) {
            for (let line = diag.range.start.line; line <= diag.range.end.line; line++) {
              errorLines.add(line);
            }
          }
        });

        // Find function ranges that contain errors
        // Simple approach: group consecutive error lines
        if (errorLines.size > 0) {
          const sortedLines = Array.from(errorLines).sort((a, b) => a - b);
          let startLine = sortedLines[0];
          let endLine = sortedLines[0];

          for (let i = 1; i < sortedLines.length; i++) {
            if (sortedLines[i] === endLine + 1 || sortedLines[i] === endLine) {
              endLine = sortedLines[i];
            } else {
              functionsWithErrors.push({ startLine, endLine, hasError: true });
              startLine = sortedLines[i];
              endLine = sortedLines[i];
            }
          }
          functionsWithErrors.push({ startLine, endLine, hasError: true });
        }
      }

      if (hasWebs || showBloodDrips || hasFog) {
        const intensity = combinedTheme.combinedScore ? combinedTheme.combinedScore / 100 : 0.5;
        editorEffects.showEffects(editor, {
          cobweb: hasWebs,
          bloodDrip: showBloodDrips,
          fog: hasFog,
          intensity,
          functionsWithErrors
        });
      } else {
        editorEffects.clearEffects(editor);
      }
    }
  } else {
    // No complexity or diagnostics - clear effects
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editorEffects.clearEffects(editor);
    }
  }
}

/**
 * Check if language is supported
 */
function isSupportedLanguage(languageId: string): boolean {
  return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'python'].includes(languageId);
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
