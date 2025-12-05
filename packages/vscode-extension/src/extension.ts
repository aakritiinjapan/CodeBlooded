import * as vscode from 'vscode';
import { ASTAnalyzer, SensoryMapper } from '@codeblooded/core';
import { DecorationManager } from './decorations';
import { StatusBarManager } from './statusbar';
import { WebviewManager } from './webview';
import { LocalAudioEngine } from './audio/localAudioEngine';
import { ThemeManager } from './themeManager';
import { DiagnosticManager, DiagnosticSummary } from './diagnosticManager';
import { EditorEffectsManager, FunctionWithError } from './editorEffects';
import { HorrorPopupManager } from './horrorPopup';
import { SafetyManager } from './safetyManager';
import { RandomEventEngine } from './randomEventEngine';
import { HorrorEngine } from './horrorEngine';
import { ScreenDistortionManager } from './screenDistortionManager';
import { EntityPresenceManager } from './entityPresenceManager';
import { PhantomTypingManager } from './phantomTypingManager';
import { WhisperingVariablesManager } from './whisperingVariablesManager';
import { ContextTriggerManager } from './contextTriggerManager';
import { TimeDilationManager } from './timeDilationManager';
import { EasterEggManager } from './easterEggManager';
import { ConfigurationManager } from './configurationManager';
import { ThemeCompatibilityManager } from './themeCompatibilityManager';
import { FirstRunTutorialManager } from './firstRunTutorial';
import { BloodDripManager } from './bloodDripManager';
import { HeartbeatPulseManager } from './heartbeatPulseManager';
import { ComplexityAnalysisManager } from './complexityAnalysisManager';


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
let randomEventEngine: RandomEventEngine;
let horrorEngine: HorrorEngine;
let screenDistortionManager: ScreenDistortionManager;
let entityPresenceManager: EntityPresenceManager;
let phantomTypingManager: PhantomTypingManager;
let whisperingVariablesManager: WhisperingVariablesManager;
let contextTriggerManager: ContextTriggerManager;
let timeDilationManager: TimeDilationManager;
let easterEggManager: EasterEggManager;
let configurationManager: ConfigurationManager;
let themeCompatibilityManager: ThemeCompatibilityManager;
let firstRunTutorialManager: FirstRunTutorialManager;
let bloodDripManager: BloodDripManager;
let heartbeatPulseManager: HeartbeatPulseManager;
let complexityAnalysisManager: ComplexityAnalysisManager;

let analysisTimeout: NodeJS.Timeout | undefined;
let popupTimeout: NodeJS.Timeout | undefined; // Delay popup to avoid interrupting typing
let lastTypingTime: number = 0; // Track when user last typed
let audioEnabled: boolean = true;
let currentDiagnostics: DiagnosticSummary | undefined;
let currentDocumentUri: string | undefined; // Track current document to detect file switches
let horrorFeaturesInitialized = false; // Prevent double initialization
let currentMaxComplexity: number = 0; // Track current file's max complexity for theme updates

import { profiler } from './profiler';

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
  // Start profiling activation
  profiler.startActivation();
  
  console.log('[codeblooded Debug] Extension activated');

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
  themeCompatibilityManager = new ThemeCompatibilityManager(context);
  safetyManager = new SafetyManager(context);
  randomEventEngine = new RandomEventEngine();
  horrorEngine = new HorrorEngine(context, safetyManager, randomEventEngine);
  screenDistortionManager = new ScreenDistortionManager(context);
  entityPresenceManager = new EntityPresenceManager(context);
  phantomTypingManager = new PhantomTypingManager(context);
  whisperingVariablesManager = new WhisperingVariablesManager(context);
  contextTriggerManager = new ContextTriggerManager(context);
  timeDilationManager = new TimeDilationManager(context);
  easterEggManager = new EasterEggManager(context);
  configurationManager = new ConfigurationManager(context);
  firstRunTutorialManager = new FirstRunTutorialManager(context);
  bloodDripManager = new BloodDripManager(context);
  heartbeatPulseManager = new HeartbeatPulseManager(context);
  complexityAnalysisManager = new ComplexityAnalysisManager(context, analyzer, sensoryMapper);
  
  // Clear any leftover color customizations from previous sessions
  // This ensures VS Code starts with default blue theme
  themeManager.clearColorCustomizations();
  
  // Listen to safe mode changes to control ALL horror effects
  safetyManager.onSafeModeChanged(async (isSafeMode) => {
    console.log('[codeblooded Debug] Safe mode changed:', isSafeMode);
    if (isSafeMode) {
      // Stop ALL horror effects when entering safe mode
      console.log('[codeblooded Debug] Disabling all horror effects for safe mode');
      
      // Stop all audio
      audioEngine.stopAll();
      
      // Disable blood drip effect
      bloodDripManager.setEnabled(false);
      
      // Disable heartbeat pulse effect
      heartbeatPulseManager.setEnabled(false);
      
      // Disable easter eggs
      easterEggManager.setEnabled(false);
      
      // Disable entity presence
      entityPresenceManager.setEnabled(false);
      
      // Disable phantom typing
      phantomTypingManager.setEnabled(false);
      
      // Disable screen distortion
      screenDistortionManager.setEnabled(false);
      
      // Disable time dilation
      timeDilationManager.setEnabled(false);
      
      // Disable context triggers
      contextTriggerManager.setEnabled(false);
      
      // *** SAFE MODE: Enable complexity analysis features ***
      console.log('[codeblooded Debug] Enabling complexity analysis for safe mode');
      
      // Enable complexity analysis and workspace scanning
      await complexityAnalysisManager.enable();
      
      // Enable theme manager for complexity-based window coloring
      themeManager.setEnabled(true);
      
      // Show only health score in status bar (no audio toggle in safe mode)
      statusBarManager.showHealthOnly();
      
      // Apply decorations for current file if any
      const editor = vscode.window.activeTextEditor;
      if (editor && isSupportedLanguage(editor.document.languageId)) {
        await applyComplexityDecorations(editor);
      }
      
      console.log('[codeblooded Debug] Safe mode active - complexity features enabled');
    } else {
      // Re-enable horror effects when exiting safe mode (entering horror mode)
      console.log('[codeblooded Debug] Re-enabling horror effects (exiting safe mode)');
      
      // *** HORROR MODE: Disable complexity analysis features ***
      complexityAnalysisManager.disable();
      
      // Clear all complexity decorations
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        decorationManager.clearDecorations(editor);
      }
      
      // Clear window color customizations - restore VS Code defaults
      themeManager.clearColorCustomizations();
      themeManager.setEnabled(false);
      
      // Show all status bar items including audio toggle
      statusBarManager.showAll();
      
      // Re-enable horror effects
      bloodDripManager.setEnabled(true);
      heartbeatPulseManager.setEnabled(true);
      easterEggManager.setEnabled(true);
      entityPresenceManager.setEnabled(true);
      phantomTypingManager.setEnabled(true);
      screenDistortionManager.setEnabled(true);
      timeDilationManager.setEnabled(true);
      contextTriggerManager.setEnabled(true);
      
      console.log('[codeblooded Debug] Horror mode active - complexity features disabled');
    }
  });
  
  // Initialize complexity analysis manager (used in safe mode)
  complexityAnalysisManager.initialize().then(async () => {
    console.log('[codeblooded] Complexity analysis manager initialized');
    
    // Check if we're starting in safe mode - if so, enable complexity features
    const config = vscode.workspace.getConfiguration('codeblooded');
    const safeMode = config.get<boolean>('horror.safeMode', true);
    if (safeMode) {
      console.log('[codeblooded] Starting in safe mode - enabling complexity analysis');
      await complexityAnalysisManager.enable();
      themeManager.setEnabled(true);
      
      // Show only health score in status bar (no audio in safe mode)
      statusBarManager.showHealthOnly();
      
      // Apply decorations for currently active editor if any
      const editor = vscode.window.activeTextEditor;
      if (editor && isSupportedLanguage(editor.document.languageId)) {
        console.log('[codeblooded] Applying initial complexity decorations for:', editor.document.fileName);
        await applyComplexityDecorations(editor);
      }
    }
  }).catch(err => {
    console.error('[codeblooded] Complexity analysis manager initialization failed:', err);
  });
  
  // Listen for workspace analysis completion to update current file
  complexityAnalysisManager.onWorkspaceAnalysisComplete(() => {
    const config = vscode.workspace.getConfiguration('codeblooded');
    const safeMode = config.get<boolean>('horror.safeMode', true);
    if (safeMode) {
      const editor = vscode.window.activeTextEditor;
      if (editor && isSupportedLanguage(editor.document.languageId)) {
        console.log('[codeblooded] Workspace analysis complete, updating current file decorations');
        applyComplexityDecorations(editor);
      }
    }
  });
  
  // Listen for individual file analysis completion to update decorations
  complexityAnalysisManager.onAnalysisComplete((complexityData) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName === complexityData.filePath) {
      // Check if we're in safe mode
      const config = vscode.workspace.getConfiguration('codeblooded');
      const safeMode = config.get<boolean>('horror.safeMode', true);
      if (safeMode && complexityAnalysisManager.isEnabled()) {
        console.log('[codeblooded] File analysis complete, updating decorations for:', complexityData.filePath);
        applyComplexityDecorations(editor);
      }
    }
  });
  
  // Set theme compatibility manager references
  editorEffects.setThemeCompatibilityManager(themeCompatibilityManager);

  // Show first-run tutorial if this is the first time
  if (firstRunTutorialManager.shouldShowTutorial()) {
    // Show tutorial after a short delay to let extension fully activate
    setTimeout(() => {
      firstRunTutorialManager.showTutorial().catch(err => {
        console.error('[codeblooded] First-run tutorial failed:', err);
      });
    }, 2000);
  }

  // Register configuration manager commands
  configurationManager.registerCommands();

  // Validate configuration on startup
  configurationManager.validateConfiguration();

  // Set audio engine reference for variant audio playback
  horrorPopup.setAudioEngine(audioEngine);
  
  // Set safety manager reference for flash frequency limiting
  horrorPopup.setSafetyManager(safetyManager);
  
  // Set theme compatibility manager reference for theme adjustments
  horrorPopup.setThemeCompatibilityManager(themeCompatibilityManager);

  // Initialize horror features
  const initializeHorrorFeatures = async () => {
    if (horrorFeaturesInitialized) {
      console.log('[codeblooded] Horror features already initialized, skipping');
      return;
    }
    
    console.log('[codeblooded] Initializing horror features...');
    horrorFeaturesInitialized = true;
    
    // Initialize horror engine
    await horrorEngine.initialize();
      
      // Register jumpscare manager (HorrorPopupManager) with horror engine
      horrorEngine.registerEffectManager('jumpscare', horrorPopup);
      
      // Register screen distortion manager with horror engine
      horrorEngine.registerEffectManager('screenDistortion', screenDistortionManager);
      await screenDistortionManager.initialize();
      
      // Register entity presence manager with horror engine
      horrorEngine.registerEffectManager('entityPresence', entityPresenceManager);
      await entityPresenceManager.initialize();
      
      // Register phantom typing manager with horror engine
      horrorEngine.registerEffectManager('phantomTyping', phantomTypingManager);
      await phantomTypingManager.initialize();
      
      // Register whispering variables manager with horror engine
      horrorEngine.registerEffectManager('whisperingVariables', whisperingVariablesManager);
      whisperingVariablesManager.setThemeCompatibilityManager(themeCompatibilityManager);
      await whisperingVariablesManager.initialize();
      
      // Register context trigger manager with horror engine
      horrorEngine.registerEffectManager('contextTrigger', contextTriggerManager);
      await contextTriggerManager.initialize();
      
      // Set effect manager references for context trigger manager
      contextTriggerManager.setEffectManagers(
        screenDistortionManager,
        horrorPopup,
        editorEffects
      );
      
      // Register time dilation manager with horror engine
      horrorEngine.registerEffectManager('timeDilation', timeDilationManager);
      await timeDilationManager.initialize();
      
      // Initialize theme compatibility manager
      await themeCompatibilityManager.initialize();
      
      // Listen for theme changes and update all effect managers
      themeCompatibilityManager.onThemeChanged(themeInfo => {
        console.log('[codeblooded] Theme changed, updating horror effects:', themeInfo);
        
        // Notify all effect managers about theme change
        // They can access themeCompatibilityManager to get adjusted colors
      });
      
      // Register easter egg manager with horror engine
      horrorEngine.registerEffectManager('easterEgg', easterEggManager);
      
      // Pass references to easter egg manager for effects using setters
      if (typeof (easterEggManager as any).setHorrorEngine === 'function') {
        (easterEggManager as any).setHorrorEngine(horrorEngine);
        (easterEggManager as any).setHorrorPopup(horrorPopup);
        (easterEggManager as any).setScreenDistortionManager(screenDistortionManager);
        (easterEggManager as any).setEntityPresenceManager(entityPresenceManager);
        (easterEggManager as any).setAudioEngine(audioEngine);
        (easterEggManager as any).setPhantomTypingManager(phantomTypingManager);
      }
      
      await easterEggManager.initialize();
      easterEggManager.setEnabled(true); // Enable easter eggs when horror is active
      
      // Register blood drip manager
      horrorEngine.registerEffectManager('bloodDrip', bloodDripManager);
      await bloodDripManager.initialize();
      bloodDripManager.setEnabled(true); // Enable by default when horror is active
      
      // Register heartbeat pulse manager
      horrorEngine.registerEffectManager('heartbeatPulse', heartbeatPulseManager);
      await heartbeatPulseManager.initialize();
      heartbeatPulseManager.setEnabled(true); // Enable by default when horror is active
      
      // Listen for intensity changes to update entity spawning
      horrorEngine.onIntensityChanged(intensity => {
        entityPresenceManager.updateIntensity(intensity);
      });
      
    console.log('[codeblooded] Horror features fully initialized');
  };

  // Show first-run warning for horror features
  safetyManager.showFirstRunWarning().then(async accepted => {
    if (accepted) {
      console.log('[codeblooded] Horror features enabled by user');
      
      // Enable horror features and disable safe mode
      const config = vscode.workspace.getConfiguration('codeblooded');
      await config.update('horror.enabled', true, vscode.ConfigurationTarget.Global);
      await config.update('horror.safeMode', false, vscode.ConfigurationTarget.Global);
      console.log('[codeblooded] Set horror.enabled=true, safeMode=false');
      
      // Initialize all horror features
      await initializeHorrorFeatures();
      
      // Show confirmation that horror features are active
      vscode.window.showInformationMessage(
        '👁️ codeblooded: Horror features activated! Intensity will escalate over time. Use Ctrl+Alt+S for panic button.',
        { modal: false }
      );
    } else {
      console.log('[codeblooded] User chose to stay in safe mode');
    }
  });
  
  // Also check if horror is already enabled and initialize if so
  (async () => {
    const config = vscode.workspace.getConfiguration('codeblooded');
    const horrorEnabled = config.get<boolean>('horror.enabled', false);
    const safeMode = config.get<boolean>('horror.safeMode', true);
    
    if (horrorEnabled && !safeMode) {
      console.log('[codeblooded] Horror already enabled from previous session, initializing...');
      await initializeHorrorFeatures();
    }
  })();

  // Load persisted configuration
  loadConfiguration(context);

  // Listen for diagnostic changes
  diagnosticManager.onDidChangeDiagnostics(diagnostics => {
    const previousDiagnostics = currentDiagnostics;
    currentDiagnostics = diagnostics;
    
    // Check if horror mode is active before doing anything horror-related
    const config = vscode.workspace.getConfiguration('codeblooded');
    const horrorEnabled = config.get<boolean>('horror.enabled', false);
    const safeMode = config.get<boolean>('horror.safeMode', true);
    const horrorModeActive = horrorEnabled && !safeMode;
    
    // Skip all horror effects (including audio) if safe mode is on
    if (!horrorModeActive) {
      // Still update the combined theme for visual feedback (colored edges)
      updateCombinedTheme();
      return;
    }
    
    const activeEditor = vscode.window.activeTextEditor;
    const activeDocumentUri = activeEditor?.document.uri.toString();
    
    console.log('[codeblooded Debug] Diagnostics changed:', {
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
    
    console.log('[codeblooded Debug] Popup conditions:', {
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
    
    console.log('[codeblooded Debug] Should trigger popup:', shouldTriggerPopup, {
      errorsIncreased,
      userStoppedTyping,
      timeSinceLastTyping
    });
    
    if (shouldTriggerPopup) {
      // Clear any pending popup timeout (reset the timer on new errors)
      if (popupTimeout) {
        console.log('[codeblooded Debug] Clearing previous popup timeout');
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
      
      console.log('[codeblooded Debug] Scheduling horror popup after 2s inactivity:', {
        severity: popupSeverity,
        totalErrors,
        newErrorCount
      });
      
      // Wait 2 seconds of inactivity before showing popup
      // This prevents interrupting the user while they're typing
      // The timeout is cleared on every keystroke in handleDocumentChange
      popupTimeout = setTimeout(async () => {
        console.log('[codeblooded Debug] User inactive for 2s with errors, showing popup');
        
        // PAUSE AMBIENT for warning/error (mild/medium), but KEEP PLAYING for critical
        // This enhances the horror effect: critical errors are so bad, both audios play together
        const shouldPauseAmbient = popupSeverity === 'warning' || popupSeverity === 'error';
        if (shouldPauseAmbient) {
          console.log('[codeblooded Debug] Pausing ambient for', popupSeverity, 'popup');
          audioEngine.pauseAmbient(); // Pauses ONLY ambient, popup audio unaffected
        } else {
          console.log('[codeblooded Debug] Keeping ambient playing for critical popup (layered horror)');
        }
        
        // Play horror sound FIRST - must happen BEFORE showing panel (panel creation kills audio context)
        console.log('[codeblooded Debug] Starting popup audio...');
        audioEngine.playPopupSound(popupSeverity as any).catch(err => {
          console.error('[codeblooded Debug] Popup audio failed:', err);
        });
        
        // Small delay to let audio start playing before panel opens
        await new Promise(resolve => setTimeout(resolve, 150));
        
        console.log('[codeblooded Debug] Popup audio playing, now showing visual');
        
        // Set cleanup callback for when popup closes (manual or auto)
        horrorPopup.setOnPopupClosed(() => {
          console.log('[codeblooded Debug] Popup closed callback - stopping popup audio');
          audioEngine.stopPopup();
          
          // Resume ambient if we paused it
          if (shouldPauseAmbient) {
            console.log('[codeblooded Debug] Resuming ambient audio after popup');
            audioEngine.resumeAmbient();
          }
        });
        
        // Show visual popup
        horrorPopup.showPopup(popupSeverity, errorMessage).catch(err => {
          console.error('[codeblooded Debug] Horror popup failed:', err);
        });
        
        popupTimeout = undefined;
      }, 2000); // 2 second delay
    } else {
      console.log('[codeblooded Debug] Skipping popup:', { isSameDocument, hasErrors, errorsIncreased, hasPrevious: !!previousDiagnostics });
    }
    
    updateCombinedTheme();
  });

  // Initialize audio engine asynchronously to avoid blocking startup
  audioEngine.initialize().then(() => {
    console.log('[codeblooded Debug] Audio engine ready');
    statusBarManager.setAudioStatus(true);
  }).catch(err => {
    console.warn('[codeblooded Debug] Audio engine initialization failed, continuing with visual-only mode:', err);
    statusBarManager.setAudioStatus(false);
    vscode.window.showWarningMessage('codeblooded: Audio engine initialization failed. Visual feedback only.');
  });

  // Register commands
  const toggleAudioCommand = vscode.commands.registerCommand('codeblooded.toggleAudio', () => {
    toggleAudio(context);
  });

  const showGraphCommand = vscode.commands.registerCommand('codeblooded.showGraph', () => {
    showGraph(context);
  });

  const resetThemeCommand = vscode.commands.registerCommand('codeblooded.resetTheme', () => {
    console.log('[codeblooded Debug] Reset theme command triggered');
    themeManager.setEnabled(false);
    setTimeout(() => {
      const config = vscode.workspace.getConfiguration('codeblooded');
      const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
      themeManager.setEnabled(workspaceTintEnabled);
      console.log('[codeblooded Debug] Theme manager re-enabled:', workspaceTintEnabled);
    }, 100);
    vscode.window.showInformationMessage('codeblooded: Theme reset');
  });

  const testHorrorEffectsCommand = vscode.commands.registerCommand('codeblooded.testHorrorEffects', async () => {
    console.log('[codeblooded Debug] testHorrorEffects command triggered');
    const effect = await vscode.window.showQuickPick(
      [
        '🎲 Random Coordinated Event (Recommended)',
        'Jumpscare (Random Variant)',
        'Screen Shake',
        'VHS Distortion',
        'Chromatic Aberration',
        'Glitch Effect',
        'Entity Presence (Eye)',
        'Phantom Typing',
        'Whispering Variables',
        'Time Dilation',
        'Blood Drip (Type to see)',
        'Heartbeat Pulse (Type to see)'
      ],
      { placeHolder: 'Select horror effect to preview' }
    );
    
    if (effect) {
      try {
        switch (effect) {
          case '🎲 Random Coordinated Event (Recommended)':
            if (horrorEngine) {
              const types = ['jumpscare', 'ambient', 'intense', 'subtle'] as const;
              const randomType = types[Math.floor(Math.random() * types.length)];
              await horrorEngine.triggerCoordinatedEvent(randomType);
              vscode.window.showInformationMessage(`codeblooded: Triggered ${randomType} horror event!`);
            } else {
              vscode.window.showErrorMessage('Horror engine not initialized');
            }
            break;
          case 'Jumpscare (Random Variant)':
            if (horrorPopup) {
              await horrorPopup.showRandomJumpscare();
              vscode.window.showInformationMessage('codeblooded: Testing random jumpscare');
            }
            break;
          case 'Screen Shake':
            if (screenDistortionManager) {
              screenDistortionManager.setEnabled(true);
              await screenDistortionManager.triggerShake(0.7);
              vscode.window.showInformationMessage('codeblooded: Testing screen shake');
            } else {
              vscode.window.showErrorMessage('Screen distortion manager not initialized');
            }
            break;
          case 'VHS Distortion':
            if (screenDistortionManager) {
              screenDistortionManager.setEnabled(true);
              await screenDistortionManager.applyVHS(3000);
              vscode.window.showInformationMessage('codeblooded: Testing VHS distortion');
            }
            break;
          case 'Chromatic Aberration':
            if (screenDistortionManager) {
              screenDistortionManager.setEnabled(true);
              await screenDistortionManager.triggerChromaticAberration(false);
              vscode.window.showInformationMessage('codeblooded: Testing chromatic aberration');
            }
            break;
          case 'Glitch Effect':
            if (screenDistortionManager) {
              screenDistortionManager.setEnabled(true);
              await screenDistortionManager.triggerRandomGlitch();
              vscode.window.showInformationMessage('codeblooded: Testing glitch effect');
            }
            break;
          case 'Entity Presence (Eye)':
            if (entityPresenceManager) {
              entityPresenceManager.setEnabled(true);
              await entityPresenceManager.spawnEye(70);
              vscode.window.showInformationMessage('codeblooded: Spawned eye at 70% intensity');
            }
            break;
          case 'Phantom Typing':
            if (phantomTypingManager) {
              phantomTypingManager.setEnabled(true);
              await phantomTypingManager.triggerPhantomTyping();
              vscode.window.showInformationMessage('codeblooded: Phantom typing triggered');
            }
            break;
          case 'Whispering Variables':
            if (whisperingVariablesManager) {
              whisperingVariablesManager.setEnabled(true);
              await whisperingVariablesManager.applyWhisper();
              vscode.window.showInformationMessage('codeblooded: Whispering variable triggered');
            }
            break;
          case 'Blood Drip (Type to see)':
            if (bloodDripManager) {
              bloodDripManager.setEnabled(true);
              vscode.window.showInformationMessage('codeblooded: Blood drip enabled - start typing to see effect!');
            }
            break;
          case 'Heartbeat Pulse (Type to see)':
            if (heartbeatPulseManager) {
              heartbeatPulseManager.setEnabled(true);
              vscode.window.showInformationMessage('codeblooded: Heartbeat pulse enabled - start typing to see the line pulse!');
            }
            break;
          case 'Time Dilation':
            if (timeDilationManager) {
              timeDilationManager.setEnabled(true);
              await timeDilationManager.triggerTimeDilation(0.8);
              vscode.window.showInformationMessage('codeblooded: Time dilation triggered');
            }
            break;
        }
      } catch (error) {
        vscode.window.showErrorMessage(`codeblooded: Test failed - ${error}`);
        console.error('[codeblooded] Test effect error:', error);
      }
    }
  });

  // Test ALL effects in sequence command
  const testAllEffectsCommand = vscode.commands.registerCommand('codeblooded.testAllEffects', async () => {
    console.log('[codeblooded Debug] Testing ALL effects in sequence');
    
    const effects = [
      { name: 'Screen Shake', test: async () => {
        if (screenDistortionManager) {
          screenDistortionManager.setEnabled(true);
          await screenDistortionManager.triggerShake(1.0); // Max intensity
          return true;
        }
        return false;
      }},
      { name: 'VHS Distortion', test: async () => {
        if (screenDistortionManager) {
          screenDistortionManager.setEnabled(true);
          await screenDistortionManager.applyVHS(4000); // 4 seconds
          return true;
        }
        return false;
      }},
      { name: 'Chromatic Aberration', test: async () => {
        if (screenDistortionManager) {
          screenDistortionManager.setEnabled(true);
          await screenDistortionManager.applyChromaticAberration(3000, 1.0); // Max intensity
          return true;
        }
        return false;
      }},
      { name: 'Glitch Effect', test: async () => {
        if (screenDistortionManager) {
          screenDistortionManager.setEnabled(true);
          await screenDistortionManager.applyGlitch(3000);
          return true;
        }
        return false;
      }},
      { name: 'Entity Presence (Eye)', test: async () => {
        if (entityPresenceManager) {
          entityPresenceManager.setEnabled(true);
          await entityPresenceManager.spawnEye(100); // Max intensity
          return true;
        }
        return false;
      }},
      { name: 'Time Dilation', test: async () => {
        if (timeDilationManager) {
          timeDilationManager.setEnabled(true);
          await timeDilationManager.triggerTimeDilation(1.0);
          return true;
        }
        return false;
      }},
      { name: 'Jumpscare', test: async () => {
        if (horrorPopup) {
          await horrorPopup.showRandomJumpscare();
          return true;
        }
        return false;
      }}
    ];

    vscode.window.showInformationMessage('🎃 codeblooded: Testing ALL effects - Watch closely!');
    
    const results: string[] = [];
    
    for (const effect of effects) {
      try {
        console.log(`[codeblooded] Testing: ${effect.name}`);
        vscode.window.setStatusBarMessage(`🎃 Testing: ${effect.name}...`, 2000);
        
        const success = await effect.test();
        results.push(`${success ? '✅' : '❌'} ${effect.name}`);
        
        // Wait between effects so they don't overlap
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (error) {
        console.error(`[codeblooded] Error testing ${effect.name}:`, error);
        results.push(`❌ ${effect.name} (Error)`);
      }
    }

    // Show results
    vscode.window.showInformationMessage(
      `🎃 Effect Test Results:\n${results.join('\n')}`,
      { modal: true }
    );
  });

  const testAudioCommand = vscode.commands.registerCommand('codeblooded.testAudio', async () => {
    console.log('[codeblooded Debug] Test audio command triggered');
    try {
      // Test if audio engine is ready
      if (!audioEngine) {
        vscode.window.showErrorMessage('codeblooded: Audio engine not initialized');
        return;
      }

      console.log('[codeblooded Debug] Audio engine enabled:', audioEngine.isEnabled());
      
      // Test popup sounds in sequence
      vscode.window.showInformationMessage('codeblooded: Testing horror audio... Listen!');
      
      // Test warning sound
      await audioEngine.playPopupSound('warning');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test error sound
      await audioEngine.playPopupSound('error');
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Test critical sound
      await audioEngine.playPopupSound('critical');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('[codeblooded Debug] Audio test completed');
      vscode.window.showInformationMessage('codeblooded: Audio test completed!');
    } catch (error) {
      console.error('[codeblooded Debug] Test audio failed:', error);
      vscode.window.showErrorMessage(`codeblooded: Test audio failed - ${error}`);
    }
  });

  const showDebugInfoCommand = vscode.commands.registerCommand('codeblooded.showDebugInfo', () => {
    const config = vscode.workspace.getConfiguration('codeblooded');
    const diagnostics = diagnosticManager.getCurrentSummary();
    const horrorState = horrorEngine ? horrorEngine.getState() : null;
    const effectManagerStatus = horrorEngine ? horrorEngine.getEffectManagerStatus() : {};
    
    // Build effect manager status string
    const effectStatusLines = Object.entries(effectManagerStatus).map(([name, status]) => {
      const icon = status.hasErrors ? '❌' : status.enabled ? '✅' : '⏸️';
      return `  ${icon} ${name}: ${status.enabled ? 'Enabled' : 'Disabled'}${status.hasErrors ? ' (Errors)' : ''}`;
    }).join('\n');
    
    const info = `
🎭 codeblooded Debug Info:

📊 Current State:
- Diagnostics Active: ${currentDiagnostics ? 'Yes' : 'No'}
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

👻 Horror Engine:
- Active: ${horrorState ? horrorState.isActive : 'N/A'}
- Intensity: ${horrorState ? horrorState.intensity : 'N/A'}%
- Safe Mode: ${horrorState ? horrorState.isSafeMode : 'N/A'}
- Session Duration: ${horrorState ? Math.floor((Date.now() - horrorState.sessionStartTime) / 60000) : 'N/A'} min

🎮 Effect Managers:
${effectStatusLines || '  None registered'}

💡 Tip: If you don't see/hear effects:
1. Check "codeblooded: Toggle Audio Feedback"
2. Enable "codeblooded.visual.workspaceTint" in settings
3. Try "codeblooded: Force Update Theme & Audio"
    `.trim();
    
    vscode.window.showInformationMessage(info, { modal: true });
    console.log('[codeblooded Debug]', info);
  });
  
  // Show detailed horror engine state command
  const showHorrorEngineStateCommand = vscode.commands.registerCommand('codeblooded.showHorrorEngineState', () => {
    if (!horrorEngine) {
      vscode.window.showErrorMessage('codeblooded: Horror engine not initialized');
      return;
    }
    
    const state = horrorEngine.getState();
    const effectManagerStatus = horrorEngine.getEffectManagerStatus();
    const errorReport = horrorEngine.getErrorReport();
    
    const sessionDuration = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    
    const timeSinceLastEvent = Math.floor((Date.now() - state.lastEventTime) / 1000);
    const timeSinceActivity = Math.floor((Date.now() - state.lastActivityTime) / 1000);
    
    const effectStatusLines = Object.entries(effectManagerStatus).map(([name, status]) => {
      const icon = status.hasErrors ? '❌' : status.enabled ? '✅' : '⏸️';
      return `  ${icon} ${name}: ${status.enabled ? 'Enabled' : 'Disabled'}${status.hasErrors ? ' (Errors)' : ''}`;
    }).join('\n');
    
    const info = `
👻 Horror Engine State:

⚙️ Core State:
- Active: ${state.isActive}
- Safe Mode: ${state.isSafeMode}
- Intensity: ${state.intensity}%
- Session Duration: ${minutes}m ${seconds}s
- Time Since Last Event: ${timeSinceLastEvent}s
- Time Since Activity: ${timeSinceActivity}s

🎮 Effect Managers (${Object.keys(effectManagerStatus).length}):
${effectStatusLines}

⚙️ Configuration:
- Horror Enabled: ${state.userConfig.enabled}
- Jumpscares: ${state.userConfig.enableJumpscares}
- Screen Effects: ${state.userConfig.enableScreenEffects}
- Phantom Events: ${state.userConfig.enablePhantomEvents}
- Entity Presence: ${state.userConfig.enableEntityPresence}
- Easter Eggs: ${state.userConfig.enableEasterEggs}
- Escalation Rate: ${state.userConfig.escalationRate}%/min
- Jumpscare Cooldown: ${state.userConfig.jumpscareCooldownMin}-${state.userConfig.jumpscareCooldownMax}s

🛡️ Safety:
- Respect Reduce Motion: ${state.userConfig.respectReduceMotion}
- Max Flash Frequency: ${state.userConfig.maxFlashFrequency}/s

${errorReport ? '\n📊 Error Report:\n' + errorReport : ''}
    `.trim();
    
    vscode.window.showInformationMessage(info, { modal: true });
    console.log('[codeblooded Horror Engine State]', info);
  });
  
  // Show resource statistics command
  const showResourceStatisticsCommand = vscode.commands.registerCommand('codeblooded.showResourceStatistics', () => {
    if (!horrorEngine) {
      vscode.window.showErrorMessage('codeblooded: Horror engine not initialized');
      return;
    }
    
    const resourceReport = horrorEngine.getResourceStatistics();
    vscode.window.showInformationMessage(resourceReport, { modal: true });
    console.log('[codeblooded Resource Statistics]', resourceReport);
  });
  
  // Show performance profile command
  const showPerformanceProfileCommand = vscode.commands.registerCommand('codeblooded.showPerformanceProfile', () => {
    const report = profiler.generateReport();
    vscode.window.showInformationMessage(report, { modal: true });
    console.log('[codeblooded Performance Profile]', report);
  });
  
  // Show event probability command
  const showEventProbabilityCommand = vscode.commands.registerCommand('codeblooded.showEventProbability', () => {
    if (!horrorEngine || !randomEventEngine) {
      vscode.window.showErrorMessage('codeblooded: Horror engine not initialized');
      return;
    }
    
    const state = horrorEngine.getState();
    const intensity = state.intensity;
    
    // Calculate probabilities for different event types
    const timeSinceLastEvent = (Date.now() - state.lastEventTime) / 1000;
    
    const info = `
🎲 Event Probability Calculator:

Current Intensity: ${intensity}%
Time Since Last Event: ${timeSinceLastEvent.toFixed(1)}s

📊 Event Probabilities:
(These are approximate values based on current state)

Jumpscare Events:
- Base Chance: ${intensity > 0 ? '5-15%' : '0%'}
- Cooldown: ${state.userConfig.jumpscareCooldownMin}-${state.userConfig.jumpscareCooldownMax}s
- Frequency: ${intensity < 40 ? 'Rare' : intensity < 70 ? 'Moderate' : 'Frequent'}

Screen Distortion:
- Trigger Threshold: ${intensity > 30 ? 'Active' : 'Inactive'}
- Intensity Multiplier: ${(intensity / 100).toFixed(2)}x

Phantom Events:
- Phantom Typing: ${intensity > 50 ? 'Active' : 'Inactive'} (>50% intensity)
- Whispering Variables: ${intensity > 60 ? 'Active' : 'Inactive'} (>60% intensity)

Entity Presence:
- Eye Spawning: ${intensity > 40 ? 'Active' : 'Inactive'} (>40% intensity)
- Spawn Rate: ${intensity > 80 ? 'High' : intensity > 40 ? 'Normal' : 'None'}

Time Dilation:
- Trigger Threshold: ${intensity > 70 ? 'Active' : 'Inactive'} (>70% intensity)
- Probability: ${intensity > 70 ? '20%' : '0%'} when eligible

💡 Intensity increases by ${state.userConfig.escalationRate}% every 2 minutes
    `.trim();
    
    vscode.window.showInformationMessage(info, { modal: true });
    console.log('[codeblooded Event Probability]', info);
  });
  
  // Toggle verbose logging command
  let verboseLogging = false;
  const toggleVerboseLoggingCommand = vscode.commands.registerCommand('codeblooded.toggleVerboseLogging', () => {
    verboseLogging = !verboseLogging;
    
    if (verboseLogging) {
      vscode.window.showInformationMessage('codeblooded: Verbose logging enabled. Check the console for detailed logs.');
      console.log('[codeblooded] Verbose logging enabled');
      
      // Log current state immediately
      if (horrorEngine) {
        console.log('[codeblooded Verbose] Horror Engine State:', horrorEngine.getState());
        console.log('[codeblooded Verbose] Effect Manager Status:', horrorEngine.getEffectManagerStatus());
        console.log('[codeblooded Verbose] Error Report:', horrorEngine.getErrorReport());
      }
    } else {
      vscode.window.showInformationMessage('codeblooded: Verbose logging disabled.');
      console.log('[codeblooded] Verbose logging disabled');
    }
    
    context.globalState.update('codeblooded.verboseLogging', verboseLogging);
  });
  
  // Load verbose logging state
  verboseLogging = context.globalState.get<boolean>('codeblooded.verboseLogging', false);

  const forceUpdateCommand = vscode.commands.registerCommand('codeblooded.forceUpdate', () => {
    console.log('[codeblooded Debug] Force update triggered');
    updateCombinedTheme();
    vscode.window.showInformationMessage('codeblooded: Theme and audio updated!');
  });

  const showAudioBridgeCommand = vscode.commands.registerCommand('codeblooded.showAudioBridge', async () => {
    console.log('[codeblooded Debug] Show audio bridge command triggered');
    try {
      // Force initialize if not ready
      await audioEngine.initialize();
      vscode.window.showInformationMessage('codeblooded: Audio bridge visible. Check the logs for debugging!');
    } catch (error) {
      vscode.window.showErrorMessage('codeblooded: Failed to show audio bridge - ' + error);
    }
  });

  // Test horror popup command
  const testHorrorPopupCommand = vscode.commands.registerCommand('codeblooded.testHorrorPopup', async () => {
    const severity = await vscode.window.showQuickPick(
      ['warning', 'error', 'critical'],
      { placeHolder: 'Select horror popup severity to test' }
    );
    
    if (severity) {
      await horrorPopup.showPopup(severity as any, `Testing ${severity} popup`);
    }
  });

  // Toggle safe mode command
  const toggleSafeModeCommand = vscode.commands.registerCommand('codeblooded.toggleSafeMode', async () => {
    if (safetyManager.isSafeModeActive()) {
      const confirm = await vscode.window.showWarningMessage(
        '⚠️ Enable horror features? This will activate jumpscares, random events, and psychological horror effects.',
        'Enable',
        'Cancel'
      );
      
      if (confirm === 'Enable') {
        await safetyManager.exitSafeMode();
        vscode.window.showInformationMessage('codeblooded: Horror features enabled. Use Ctrl+Alt+S to disable instantly.');
      }
    } else {
      await safetyManager.enterSafeMode();
      vscode.window.showInformationMessage('codeblooded: Safe mode enabled. All horror effects disabled.');
    }
  });
  
  // Toggle screen sharing mode command
  const toggleScreenSharingCommand = vscode.commands.registerCommand('codeblooded.toggleScreenSharing', async () => {
    await safetyManager.toggleScreenSharingMode();
  });
  
  // Toggle focus mode command
  const toggleFocusModeCommand = vscode.commands.registerCommand('codeblooded.toggleFocusMode', async () => {
    await safetyManager.toggleFocusMode();
  });

  // Test screen distortion command
  const testScreenDistortionCommand = vscode.commands.registerCommand('codeblooded.testScreenDistortion', async () => {
    if (!screenDistortionManager) {
      vscode.window.showErrorMessage('codeblooded: Screen distortion manager not initialized. Enable horror mode first.');
      return;
    }
    
    // Temporarily enable for testing
    const wasEnabled = screenDistortionManager.isEnabled();
    if (!wasEnabled) {
      screenDistortionManager.setEnabled(true);
    }
    
    const effect = await vscode.window.showQuickPick(
      ['Screen Shake', 'VHS Distortion', 'Chromatic Aberration', 'Glitch Effect'],
      { placeHolder: 'Select screen distortion effect to test' }
    );
    
    if (effect) {
      try {
        switch (effect) {
          case 'Screen Shake':
            await screenDistortionManager.triggerShake(0.7);
            break;
          case 'VHS Distortion':
            await screenDistortionManager.applyVHS(3000);
            break;
          case 'Chromatic Aberration':
            await screenDistortionManager.triggerChromaticAberration(false);
            break;
          case 'Glitch Effect':
            await screenDistortionManager.triggerRandomGlitch();
            break;
        }
        vscode.window.showInformationMessage(`codeblooded: Testing ${effect}`);
      } catch (error) {
        vscode.window.showErrorMessage(`codeblooded: Failed to test ${effect}: ${error}`);
      }
    }
    
    // Restore previous state
    if (!wasEnabled) {
      screenDistortionManager.setEnabled(false);
    }
  });

  // Test entity presence command
  const testEntityPresenceCommand = vscode.commands.registerCommand('codeblooded.testEntityPresence', async () => {
    if (!entityPresenceManager) {
      vscode.window.showErrorMessage('codeblooded: Entity presence manager not initialized');
      return;
    }

    const action = await vscode.window.showQuickPick(
      ['Spawn Eye (40% intensity)', 'Spawn Eye (80% intensity)', 'Clear All Eyes'],
      { placeHolder: 'Select entity presence action to test' }
    );
    
    if (action) {
      switch (action) {
        case 'Spawn Eye (40% intensity)':
          entityPresenceManager.setEnabled(true);
          entityPresenceManager.spawnEye(50);
          vscode.window.showInformationMessage('codeblooded: Spawned eye at 50% intensity');
          break;
        case 'Spawn Eye (80% intensity)':
          entityPresenceManager.setEnabled(true);
          entityPresenceManager.spawnEye(85);
          vscode.window.showInformationMessage('codeblooded: Spawned eye at 85% intensity');
          break;
        case 'Clear All Eyes':
          entityPresenceManager.clearAllEyes();
          vscode.window.showInformationMessage('codeblooded: Cleared all eyes');
          break;
      }
    }
  });

  // Test phantom typing command
  const testPhantomTypingCommand = vscode.commands.registerCommand('codeblooded.testPhantomTyping', async () => {
    if (!phantomTypingManager) {
      vscode.window.showErrorMessage('codeblooded: Phantom typing manager not initialized');
      return;
    }

    const action = await vscode.window.showQuickPick(
      ['Trigger Phantom Typing', 'Emergency Restore All', 'Show State'],
      { placeHolder: 'Select phantom typing action to test' }
    );
    
    if (action) {
      switch (action) {
        case 'Trigger Phantom Typing':
          phantomTypingManager.setEnabled(true);
          const success = await phantomTypingManager.triggerPhantomTyping();
          if (success) {
            vscode.window.showInformationMessage('codeblooded: Phantom typing triggered');
          } else {
            vscode.window.showWarningMessage('codeblooded: Failed to trigger phantom typing');
          }
          break;
        case 'Emergency Restore All':
          await phantomTypingManager.restoreAll();
          vscode.window.showInformationMessage('codeblooded: All phantoms restored');
          break;
        case 'Show State':
          const state = phantomTypingManager.getState();
          vscode.window.showInformationMessage(
            `Phantom Typing State:\n` +
            `Enabled: ${state.enabled}\n` +
            `Session Disabled: ${state.sessionDisabled}\n` +
            `Active Phantoms: ${state.activePhantoms}\n` +
            `Failure Count: ${state.failureCount}`,
            { modal: true }
          );
          break;
      }
    }
  });

  // Emergency restore command (for panic situations)
  const emergencyRestoreCommand = vscode.commands.registerCommand('codeblooded.emergencyRestore', async () => {
    if (phantomTypingManager) {
      await phantomTypingManager.restoreAll();
    }
    if (whisperingVariablesManager) {
      whisperingVariablesManager.clearAllWhispers();
    }
    vscode.window.showInformationMessage('codeblooded: Emergency restore complete. All phantom effects cleared.');
  });

  // Test whispering variables command
  const testWhisperingVariablesCommand = vscode.commands.registerCommand('codeblooded.testWhisperingVariables', async () => {
    if (!whisperingVariablesManager) {
      vscode.window.showErrorMessage('codeblooded: Whispering variables manager not initialized');
      return;
    }

    const action = await vscode.window.showQuickPick(
      ['Trigger Whisper', 'Clear All Whispers', 'Show State'],
      { placeHolder: 'Select whispering variables action to test' }
    );
    
    if (action) {
      switch (action) {
        case 'Trigger Whisper':
          whisperingVariablesManager.setEnabled(true);
          const success = await whisperingVariablesManager.applyWhisper();
          if (success) {
            vscode.window.showInformationMessage('codeblooded: Whisper applied');
          } else {
            vscode.window.showWarningMessage('codeblooded: Failed to apply whisper (no matching variables found)');
          }
          break;
        case 'Clear All Whispers':
          whisperingVariablesManager.clearAllWhispers();
          vscode.window.showInformationMessage('codeblooded: All whispers cleared');
          break;
        case 'Show State':
          const state = whisperingVariablesManager.getState();
          vscode.window.showInformationMessage(
            `Whispering Variables State:\n` +
            `Enabled: ${state.enabled}\n` +
            `Active Whispers: ${state.activeWhispers}\n` +
            `Last Trigger: ${state.lastTriggerTime > 0 ? new Date(state.lastTriggerTime).toLocaleTimeString() : 'Never'}`,
            { modal: true }
          );
          break;
      }
    }
  });

  // Test context trigger command
  const testContextTriggerCommand = vscode.commands.registerCommand('codeblooded.testContextTrigger', async () => {
    if (!contextTriggerManager) {
      vscode.window.showErrorMessage('codeblooded: Context trigger manager not initialized');
      return;
    }

    const action = await vscode.window.showQuickPick(
      ['Show State', 'Reset Cooldowns', 'Test Keyword: kill', 'Test Keyword: dead', 'Test Keyword: error'],
      { placeHolder: 'Select context trigger action to test' }
    );
    
    if (action) {
      switch (action) {
        case 'Show State':
          const state = contextTriggerManager.getState();
          const keywordInfo = state.keywords.map(k => 
            `${k.word}: ${k.cooldownRemaining > 0 ? `${Math.ceil(k.cooldownRemaining / 1000)}s cooldown` : 'ready'}`
          ).join('\n');
          vscode.window.showInformationMessage(
            `Context Trigger State:\n` +
            `Enabled: ${state.enabled}\n` +
            `Recent Text: "${state.recentText}"\n\n` +
            `Keywords:\n${keywordInfo}`,
            { modal: true }
          );
          break;
        case 'Reset Cooldowns':
          contextTriggerManager.resetCooldowns();
          vscode.window.showInformationMessage('codeblooded: All cooldowns reset');
          break;
        case 'Test Keyword: kill':
        case 'Test Keyword: dead':
        case 'Test Keyword: error':
          const keyword = action.split(': ')[1];
          vscode.window.showInformationMessage(
            `codeblooded: Type "${keyword}" in your code to trigger the effect!\n` +
            `(30% chance, 20s cooldown between triggers)`,
            { modal: true }
          );
          break;
      }
    }
  });

  // Test time dilation command
  const testTimeDilationCommand = vscode.commands.registerCommand('codeblooded.testTimeDilation', async () => {
    if (!timeDilationManager) {
      vscode.window.showErrorMessage('codeblooded: Time dilation manager not initialized');
      return;
    }

    const action = await vscode.window.showQuickPick(
      ['Trigger Time Dilation', 'Show State'],
      { placeHolder: 'Select time dilation action to test' }
    );
    
    if (action) {
      switch (action) {
        case 'Trigger Time Dilation':
          timeDilationManager.setEnabled(true);
          await timeDilationManager.triggerTimeDilation(0.8);
          vscode.window.showInformationMessage('codeblooded: Time dilation triggered (5-10 seconds)');
          break;
        case 'Show State':
          const state = timeDilationManager.getState();
          vscode.window.showInformationMessage(
            `Time Dilation State:\n` +
            `Enabled: ${state.enabled}\n` +
            `Active: ${state.isActive}\n` +
            `Cooldown Remaining: ${Math.ceil(state.cooldownRemaining / 1000)}s\n` +
            `Last Trigger: ${state.lastTriggerTime > 0 ? new Date(state.lastTriggerTime).toLocaleTimeString() : 'Never'}`,
            { modal: true }
          );
          break;
      }
    }
  });

  // Test easter eggs command
  const testEasterEggsCommand = vscode.commands.registerCommand('codeblooded.testEasterEggs', async () => {
    if (!easterEggManager) {
      vscode.window.showErrorMessage('codeblooded: Easter egg manager not initialized');
      return;
    }

    const action = await vscode.window.showQuickPick(
      [
        'Show All Easter Eggs',
        'Show Unlocked Easter Eggs',
        'Test Nightmare Constant',
        'Test Witching Hour',
        'Test Exhaustion Effect',
        'Test Konami Code',
        'Test Cryptic Tooltip',
        'Show Coding Time'
      ],
      { placeHolder: 'Select easter egg action to test' }
    );
    
    if (action) {
      switch (action) {
        case 'Show All Easter Eggs':
          const allEggs = easterEggManager.getEasterEggs();
          const eggList = allEggs.map(egg => 
            `${egg.unlocked ? '✅' : '🔒'} ${egg.name}: ${egg.description}`
          ).join('\n');
          vscode.window.showInformationMessage(
            `Easter Eggs (${allEggs.length}):\n\n${eggList}`,
            { modal: true }
          );
          break;
        case 'Show Unlocked Easter Eggs':
          const unlockedEggs = easterEggManager.getUnlockedEasterEggs();
          if (unlockedEggs.length === 0) {
            vscode.window.showInformationMessage('No easter eggs unlocked yet!');
          } else {
            const unlockedList = unlockedEggs.map(egg => 
              `✅ ${egg.name} - Unlocked at ${new Date(egg.unlockedAt!).toLocaleString()}`
            ).join('\n');
            vscode.window.showInformationMessage(
              `Unlocked Easter Eggs (${unlockedEggs.length}):\n\n${unlockedList}`,
              { modal: true }
            );
          }
          break;
        case 'Test Nightmare Constant':
          // Directly trigger the nightmare mode easter egg for testing
          await easterEggManager.triggerEasterEgg('nightmare-constant');
          break;
        case 'Test Witching Hour':
          await easterEggManager.triggerEasterEgg('witching-hour');
          break;
        case 'Test Exhaustion Effect':
          await easterEggManager.triggerEasterEgg('cumulative-time-secret');
          break;
        case 'Test Konami Code':
          await easterEggManager.triggerEasterEgg('konami-code');
          break;
        case 'Test Cryptic Tooltip':
          const tooltip = easterEggManager.getCrypticTooltip();
          if (tooltip) {
            vscode.window.showInformationMessage(`Cryptic Tooltip: ${tooltip}`);
          } else {
            vscode.window.showInformationMessage('No cryptic tooltip this time (1% chance)');
          }
          break;
        case 'Show Coding Time':
          const hours = easterEggManager.getTotalCodingTimeHours();
          vscode.window.showInformationMessage(
            `Total Coding Time: ${hours.toFixed(2)} hours`,
            { modal: true }
          );
          break;
      }
    }
  });

  // First-run tutorial commands
  const showFirstRunTutorialCommand = vscode.commands.registerCommand('codeblooded.showFirstRunTutorial', async () => {
    await firstRunTutorialManager.showTutorial();
  });

  const showHorrorControlsCommand = vscode.commands.registerCommand('codeblooded.showHorrorControls', async () => {
    const config = vscode.workspace.getConfiguration('codeblooded');
    const horrorState = horrorEngine ? horrorEngine.getState() : null;
    
    const info = `
🎮 codeblooded Horror Controls

⚙️ Current Settings:
- Horror Enabled: ${config.get('horror.enabled', false)}
- Safe Mode: ${config.get('horror.safeMode', true)}
- Intensity: ${config.get('horror.intensity', 50)}%

🎯 Individual Effects:
- Jumpscares: ${config.get('horror.enableJumpscares', true) ? '✅' : '❌'}
- Screen Effects: ${config.get('horror.enableScreenEffects', true) ? '✅' : '❌'}
- Phantom Events: ${config.get('horror.enablePhantomEvents', true) ? '✅' : '❌'}
- Entity Presence: ${config.get('horror.enableEntityPresence', true) ? '✅' : '❌'}
- Easter Eggs: ${config.get('horror.enableEasterEggs', true) ? '✅' : '❌'}

🛡️ Safety:
- Reduce Motion: ${config.get('safety.respectReduceMotion', true) ? '✅' : '❌'}
- Max Flash Frequency: ${config.get('safety.maxFlashFrequency', 3)}/s
- Panic Button: ${config.get('safety.panicButtonKey', 'ctrl+alt+s')}

${horrorState ? `\n👻 Horror Engine:\n- Active: ${horrorState.isActive}\n- Current Intensity: ${horrorState.intensity}%\n- Session Duration: ${Math.floor((Date.now() - horrorState.sessionStartTime) / 60000)} min` : ''}

💡 Quick Actions:
- Open Settings: Ctrl+, > Search "codeblooded"
- Panic Button: Ctrl+Alt+S
- Toggle Safe Mode: Run "codeblooded: Toggle Safe Mode"
    `.trim();
    
    const choice = await vscode.window.showInformationMessage(
      info,
      { modal: true },
      'Open Settings',
      'View User Guide',
      'Test Effects'
    );
    
    if (choice === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'codeblooded.horror');
    } else if (choice === 'View User Guide') {
      const guideUri = vscode.Uri.file(context.asAbsolutePath('../../HORROR_FEATURES_GUIDE.md'));
      vscode.commands.executeCommand('markdown.showPreview', guideUri);
    } else if (choice === 'Test Effects') {
      vscode.commands.executeCommand('codeblooded.testHorrorEffects');
    }
  });

  const viewEasterEggsCommand = vscode.commands.registerCommand('codeblooded.viewEasterEggs', async () => {
    if (!easterEggManager) {
      vscode.window.showErrorMessage('codeblooded: Easter egg manager not initialized');
      return;
    }

    const allEggs = easterEggManager.getEasterEggs();
    const unlockedCount = allEggs.filter(e => e.unlocked).length;
    
    const eggList = allEggs.map(egg => 
      `${egg.unlocked ? '✅' : '🔒'} ${egg.name}\n   ${egg.description}${egg.unlocked ? `\n   Unlocked: ${new Date(egg.unlockedAt!).toLocaleString()}` : ''}`
    ).join('\n\n');
    
    const info = `
🥚 Easter Eggs (${unlockedCount}/${allEggs.length} Unlocked)

⚠️ SPOILER WARNING: This reveals all hidden easter eggs!

${eggList}

💡 Tip: Discover easter eggs naturally by coding and exploring!
    `.trim();
    
    await vscode.window.showInformationMessage(
      info,
      { modal: true },
      'Close'
    );
  });

  const resetHorrorWarningCommand = vscode.commands.registerCommand('codeblooded.resetHorrorWarning', async () => {
    // Clear the global state flag
    await context.globalState.update('codeblooded.hasSeenHorrorWarning', undefined);
    
    // Show the warning again
    const accepted = await safetyManager.showFirstRunWarning();
    
    if (accepted) {
      // Enable horror features
      const config = vscode.workspace.getConfiguration('codeblooded');
      await config.update('horror.enabled', true, vscode.ConfigurationTarget.Global);
      await config.update('horror.safeMode', false, vscode.ConfigurationTarget.Global);
      
      // Initialize horror features
      await initializeHorrorFeatures();
      
      vscode.window.showInformationMessage('✅ Horror features enabled! Reload the window for full effect.', 'Reload').then(choice => {
        if (choice === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
    } else {
      vscode.window.showInformationMessage('Horror features remain disabled. You can enable them anytime from settings.');
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
  // Event listener for when the active text editor changes (like the reference code)
  const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(editor => {
    console.log('[codeblooded] onDidChangeActiveTextEditor fired, editor:', editor?.document?.fileName || 'undefined');
    if (editor) {
      const config = vscode.workspace.getConfiguration('codeblooded');
      const safeMode = config.get<boolean>('horror.safeMode', true);
      
      // In safe mode, directly apply complexity decorations (like reference code)
      if (safeMode && isSupportedLanguage(editor.document.languageId)) {
        console.log('[codeblooded] Safe mode - applying complexity decorations on file switch');
        applyComplexityDecorations(editor);
      } else {
        // Horror mode - use original handler
        handleEditorChange(editor);
      }
    }
  });

  // Also listen for visible text editors changes (when switching between open tabs)
  const visibleEditorsListener = vscode.window.onDidChangeVisibleTextEditors(editors => {
    console.log('[codeblooded] onDidChangeVisibleTextEditors fired, count:', editors.length);
    // When visible editors change, also check the active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const config = vscode.workspace.getConfiguration('codeblooded');
      const safeMode = config.get<boolean>('horror.safeMode', true);
      if (safeMode && isSupportedLanguage(activeEditor.document.languageId)) {
        // Force refresh complexity decorations when tabs change
        applyComplexityDecorations(activeEditor);
      }
    }
  });

  // Track the last processed file to detect actual file switches
  let lastProcessedFile: string | undefined;
  
  // Listen for text editor selection changes - this fires when cursor moves to different file
  const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection(event => {
    const currentFile = event.textEditor.document.fileName;
    
    // Only process if we actually switched files
    if (currentFile !== lastProcessedFile) {
      console.log('[codeblooded] File switch detected via selection change:', currentFile);
      lastProcessedFile = currentFile;
      
      const config = vscode.workspace.getConfiguration('codeblooded');
      const safeMode = config.get<boolean>('horror.safeMode', true);
      
      if (safeMode && isSupportedLanguage(event.textEditor.document.languageId)) {
        // Apply complexity decorations for the new file
        applyComplexityDecorations(event.textEditor);
      }
    }
  });

  // FALLBACK: Poll for active editor changes every 500ms as a backup
  // This ensures we catch file switches even if events don't fire
  let lastPolledFile: string | undefined;
  let pollCount = 0;
  console.log('[codeblooded] *** POLLING INITIALIZED *** - will check for file switches every 500ms');
  
  const pollInterval = setInterval(() => {
    pollCount++;
    const activeEditor = vscode.window.activeTextEditor;
    
    // Log every 10th poll to confirm it's running
    if (pollCount % 10 === 0) {
      console.log('[codeblooded] Polling heartbeat #' + pollCount + ', current file:', activeEditor?.document?.fileName || 'none');
    }
    
    if (activeEditor) {
      const currentFile = activeEditor.document.fileName;
      if (currentFile !== lastPolledFile) {
        console.log('[codeblooded] *** FILE SWITCH DETECTED via polling ***:', currentFile);
        console.log('[codeblooded] Previous file was:', lastPolledFile || 'none');
        lastPolledFile = currentFile;
        lastProcessedFile = currentFile; // Sync with selection listener
        
        const config = vscode.workspace.getConfiguration('codeblooded');
        const safeMode = config.get<boolean>('horror.safeMode', true);
        
        console.log('[codeblooded] Safe mode:', safeMode, 'Supported language:', isSupportedLanguage(activeEditor.document.languageId));
        
        if (safeMode && isSupportedLanguage(activeEditor.document.languageId)) {
          console.log('[codeblooded] Calling applyComplexityDecorations from polling...');
          applyComplexityDecorations(activeEditor);
        }
      }
    }
  }, 500);
  
  // Clean up interval on deactivate
  context.subscriptions.push({
    dispose: () => clearInterval(pollInterval)
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
    showHorrorEngineStateCommand,
    showResourceStatisticsCommand,
    showPerformanceProfileCommand,
    showEventProbabilityCommand,
    toggleVerboseLoggingCommand,
    forceUpdateCommand,
    showAudioBridgeCommand,
    testHorrorPopupCommand,
    toggleSafeModeCommand,
    toggleScreenSharingCommand,
    toggleFocusModeCommand,
    testScreenDistortionCommand,
    testEntityPresenceCommand,
    testPhantomTypingCommand,
    emergencyRestoreCommand,
    testWhisperingVariablesCommand,
    testContextTriggerCommand,
    testTimeDilationCommand,
    testEasterEggsCommand,
    testAllEffectsCommand,
    showFirstRunTutorialCommand,
    showHorrorControlsCommand,
    testHorrorEffectsCommand,
    viewEasterEggsCommand,
    resetHorrorWarningCommand,
    documentChangeListener,
    editorChangeListener,
    visibleEditorsListener,
    selectionChangeListener,
    statusBarManager,
    decorationManager,
    audioEngine,
    themeManager,
    diagnosticManager,
    editorEffects,
    horrorPopup,
    safetyManager,
    horrorEngine,
    screenDistortionManager,
    entityPresenceManager,
    phantomTypingManager,
    whisperingVariablesManager,
    contextTriggerManager,
    timeDilationManager,
    easterEggManager,
    configurationManager
  );

  console.log('codeblooded: Initialization complete');
  
  // End profiling activation
  profiler.endActivation();
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

  // Dispose blood drip manager
  if (bloodDripManager) {
    bloodDripManager.dispose();
  }

  console.log('codeblooded extension deactivated');
}

/**
 * Toggle audio feedback on/off
 */
function toggleAudio(context: vscode.ExtensionContext) {
  audioEnabled = !audioEnabled;

  if (audioEnabled) {
    audioEngine.enable();
    vscode.window.showInformationMessage('codeblooded: Audio feedback enabled');
  } else {
    audioEngine.disable();
    audioEngine.stopAll();
    vscode.window.showInformationMessage('codeblooded: Audio feedback disabled');
  }

  // Update status bar
  statusBarManager.updateAudioState(audioEnabled);

  // Persist state
  context.globalState.update('codeblooded.audioEnabled', audioEnabled);
}

/**
 * Show AST graph visualization in webview
 */
function showGraph(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('codeblooded: No active editor');
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
  const savedAudioState = context.globalState.get<boolean>('codeblooded.audioEnabled');
  if (savedAudioState !== undefined) {
    audioEnabled = savedAudioState;
  }

  // Load configuration from workspace settings
  const config = vscode.workspace.getConfiguration('codeblooded');
  
  // Load volume preference
  const volume = config.get<number>('audio.volume', 0.5);
  audioEngine.setVolume(volume);

  // Load animations preference
  const animationsEnabled = config.get<boolean>('visual.animations', true);
  // Store for future use
  context.globalState.update('codeblooded.animationsEnabled', animationsEnabled);

  const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
  themeManager.setEnabled(workspaceTintEnabled);
  context.globalState.update('codeblooded.workspaceTint', workspaceTintEnabled);

  // Load analysis threshold
  const threshold = config.get<number>('analysis.threshold', 10);
  context.globalState.update('codeblooded.threshold', threshold);

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
      if (event.affectsConfiguration('codeblooded')) {
        handleConfigurationChange(context);
      }
    })
  );
}

/**
 * Handle configuration changes
 */
function handleConfigurationChange(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codeblooded');

  // Update volume if changed
  const volume = config.get<number>('audio.volume', 0.5);
  audioEngine.setVolume(volume);

  // Update animations preference
  const animationsEnabled = config.get<boolean>('visual.animations', true);
  context.globalState.update('codeblooded.animationsEnabled', animationsEnabled);

  const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
  themeManager.setEnabled(workspaceTintEnabled);
  context.globalState.update('codeblooded.workspaceTint', workspaceTintEnabled);

  // Update threshold
  const threshold = config.get<number>('analysis.threshold', 10);
  context.globalState.update('codeblooded.threshold', threshold);

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
  
  // Record activity in horror engine for session tracking
  if (horrorEngine) {
    horrorEngine.recordActivity();
  }

  // Clear any pending popup timeout when user is typing
  // This prevents popups while actively writing code
  // BUT: If we have critical errors (9+), don't clear the timeout - force the popup!
  if (popupTimeout) {
    // Get current error count
    const currentErrors = currentDiagnostics ? currentDiagnostics.errorCount : 0;
    const isCritical = currentErrors >= 9;
    
    if (isCritical) {
      console.log('[codeblooded Debug] User typing but CRITICAL errors detected - NOT clearing popup timeout');
    } else {
      console.log('[codeblooded Debug] User is typing - clearing popup timeout');
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
  console.log('[codeblooded Debug] ========== EDITOR CHANGED ==========');
  console.log('[codeblooded Debug] Editor changed to:', document.fileName);
  console.log('[codeblooded Debug] Language:', document.languageId);

  // Reset complexity for new file
  currentMaxComplexity = 0;

  // Check workspace tint setting
  const config = vscode.workspace.getConfiguration('codeblooded');
  const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
  const horrorEnabled = config.get<boolean>('horror.enabled', false);
  const safeMode = config.get<boolean>('horror.safeMode', true);
  
  console.log('[codeblooded Debug] Settings:', { workspaceTintEnabled, horrorEnabled, safeMode });
  
  // Ensure theme manager is enabled if workspace tint is enabled
  themeManager.setEnabled(workspaceTintEnabled);

  // Only analyze supported languages
  if (!isSupportedLanguage(document.languageId)) {
    console.log('[codeblooded Debug] Unsupported language, skipping analysis');
    // Reset for unsupported files
    currentDiagnostics = undefined;
    currentMaxComplexity = 0;
    
    // Reset theme to default (blue/calm) for unsupported files
    if (workspaceTintEnabled) {
      const cleanTheme = sensoryMapper.mapToVisual(0);
      console.log('[codeblooded Debug] Applying clean theme for unsupported file');
      themeManager.updateTheme(cleanTheme);
    }
    
    editorEffects.clearEffects(editor);
    return;
  }

  console.log('[codeblooded Debug] Supported language, starting analysis...');

  // Reset state for new file
  currentDiagnostics = diagnosticManager.getCurrentSummary();

  // Check if we're in Safe Mode - if so, apply complexity decorations instead
  if (safeMode) {
    console.log('[codeblooded Debug] Safe mode active - applying complexity decorations');
    applyComplexityDecorations(editor);
    return;
  }

  // Horror mode: Perform immediate analysis for editor switch
  performAnalysis(document);
}

/**
 * Perform analysis on a document
 */
async function performAnalysis(document: vscode.TextDocument) {
  try {
    console.log('[codeblooded Debug] Performing analysis for:', document.fileName);
    const analysisResult = await analyzeDocument(document);
    
    if (!analysisResult) {
      console.log('[codeblooded Debug] No analysis result returned (likely parse error)');
      
      // When our parser fails, check if VS Code has diagnostics for this file
      // This handles syntax errors that prevent parsing
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      const errorCount = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
      
      if (errorCount > 0) {
        console.log('[codeblooded Debug] VS Code detected', errorCount, 'errors in file with parse failure');
        
        // Set a very low health score for unparseable files with errors
        statusBarManager.updateHealthScore(0); // F grade - critical failure
        
        // Update theme to reflect the error state
        updateCombinedTheme();
        
        // Schedule popup if user stops typing
        if (popupTimeout) {
          clearTimeout(popupTimeout);
        }
        
        const errorMessage = `${errorCount} syntax error(s) detected!`;
        const popupSeverity = errorCount >= 5 ? 'critical' : errorCount >= 3 ? 'error' : 'warning';
        
        console.log('[codeblooded Debug] Scheduling popup for parse errors after 2s inactivity');
        
        popupTimeout = setTimeout(async () => {
          const timeSinceTyping = Date.now() - lastTypingTime;
          console.log('[codeblooded Debug] Checking if should show popup, time since typing:', timeSinceTyping);
          
          if (timeSinceTyping >= 2000) {
            console.log('[codeblooded Debug] Showing popup for syntax errors');
            
            // PAUSE AMBIENT for warning/error (mild/medium), but KEEP PLAYING for critical
            // Parse errors are typically 'warning' severity, so pause ambient
            const shouldPauseAmbient = popupSeverity === 'warning' || popupSeverity === 'error';
            if (shouldPauseAmbient) {
              console.log('[codeblooded Debug] Pausing ambient for', popupSeverity, 'popup');
              audioEngine.pauseAmbient(); // Pauses ONLY ambient, popup audio unaffected
            } else {
              console.log('[codeblooded Debug] Keeping ambient playing for critical popup (layered horror)');
            }
            
            // Play horror sound FIRST - must happen BEFORE showing panel (panel creation kills audio context)
            console.log('[codeblooded Debug] Starting popup audio...');
            audioEngine.playPopupSound(popupSeverity as any).catch(err => {
              console.error('[codeblooded Debug] Popup audio failed:', err);
            });
            
            // Small delay to let audio start playing before panel opens
            await new Promise(resolve => setTimeout(resolve, 150));
            
            console.log('[codeblooded Debug] Popup audio playing, now showing visual');
            
            // Set cleanup callback for when popup closes (manual or auto)
            horrorPopup.setOnPopupClosed(() => {
              console.log('[codeblooded Debug] Popup closed callback - stopping popup audio');
              audioEngine.stopPopup();
              
              // Resume ambient if we paused it
              if (shouldPauseAmbient) {
                console.log('[codeblooded Debug] Resuming ambient audio after popup');
                audioEngine.resumeAmbient();
              }
            });
            
            // Show visual popup
            horrorPopup.showPopup(popupSeverity, errorMessage).catch(err => {
              console.error('[codeblooded Debug] Horror popup failed:', err);
            });
          }
          popupTimeout = undefined;
        }, 2000);
      }
      
      return;
    }

    console.log('[codeblooded Debug] Analysis result:', analysisResult);

    // Display syntax errors for Python files
    if (analysisResult.syntaxErrors && analysisResult.syntaxErrors.length > 0) {
      console.warn('[codeblooded] Syntax errors detected:', analysisResult.syntaxErrors);
      vscode.window.showWarningMessage(
        `codeblooded detected ${analysisResult.syntaxErrors.length} syntax error(s) in Python file. Check the console for details.`
      );
    }

    // COMMENTED OUT: Complexity-based decorations/highlighting
    // This feature highlights code blocks based on their complexity level
    /*
    // Apply visual decorations
    const editor = vscode.window.activeTextEditor;
    console.log('[codeblooded Debug] Checking editor for decorations:', {
      hasEditor: !!editor,
      editorDoc: editor?.document.fileName,
      analysisDoc: document.fileName,
      sameDoc: editor?.document === document
    });
    
    if (editor && editor.document === document) {
      console.log('[codeblooded Debug] Applying decorations, functions:', 
        analysisResult.functions ? analysisResult.functions.length : 0,
        analysisResult.functions ? analysisResult.functions.map((f: any) => ({
          name: f.name,
          complexity: f.cyclomaticComplexity,
          startLine: f.startLine,
          endLine: f.endLine
        })) : 'NO FUNCTIONS'
      );
      decorationManager.applyDecorations(editor, analysisResult);
      console.log('[codeblooded Debug] Decorations applied successfully');
    } else {
      console.log('[codeblooded Debug] SKIPPING decorations - editor changed during analysis');
    }

    if (analysisResult.metrics) {
      // Calculate and store max complexity for this file
      if (analysisResult.functions && analysisResult.functions.length > 0) {
        currentMaxComplexity = Math.max(
          ...analysisResult.functions.map((f: any) => f.cyclomaticComplexity || 0)
        );
        console.log('[codeblooded Debug] Max complexity:', currentMaxComplexity);
      } else {
        currentMaxComplexity = 0;
      }

      // Update theme based on complexity AND diagnostics
      updateCombinedTheme();

      const { calculateHealthScore } = require('@codeblooded/core');
      const healthScore = calculateHealthScore(analysisResult);
      statusBarManager.updateHealthScore(healthScore.overall);
      
      console.log('[codeblooded Debug] Analysis complete', {
        healthScore: healthScore.overall,
        file: analysisResult.file,
        maxComplexity: currentMaxComplexity
      });
    }
    */
  } catch (error) {
    console.error('[codeblooded Debug] Analysis failed:', error);
  }
}

/**
 * Update combined theme based on both complexity and diagnostics
 */
function updateCombinedTheme(): void {
  const config = vscode.workspace.getConfiguration('codeblooded');
  const horrorEnabled = config.get<boolean>('horror.enabled', false);
  const safeMode = config.get<boolean>('horror.safeMode', true);
  // const workspaceTintEnabled = config.get<boolean>('visual.workspaceTint', true);
  
  console.log('[codeblooded Debug] updateCombinedTheme:', {
    // workspaceTintEnabled,
    // currentMaxComplexity,
    horrorEnabled,
    safeMode
  });
  
  const diagnostics = currentDiagnostics || diagnosticManager.getCurrentSummary();

  // Check if we're in safe mode
  const horrorModeActive = horrorEnabled && !safeMode;
  
  if (safeMode) {
    // SAFE MODE: Complexity-based coloring is handled by applyComplexityDecorations
    // Don't clear or modify theme here - let the complexity manager handle it
    console.log('[codeblooded Debug] Safe mode active - complexity coloring handled separately');
    return;
  }
  
  // HORROR MODE: Disable complexity theme, let horror effects take over
  themeManager.setEnabled(false);

  if (!horrorModeActive) {
    console.log('[codeblooded Debug] Horror mode not active - skipping horror effects');
    // Clear horror-specific effects
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editorEffects.clearEffects(editor);
    }
    return;
  }

  // Reset audio to calm if no issues
  if (diagnostics.totalCount === 0 && currentMaxComplexity <= 5) {
    if (audioEnabled) {
      audioEngine.setAmbientTheme('calm').catch((err: any) => {
        console.error('[codeblooded Debug] Failed to set ambient to calm:', err);
      });
    }
    return;
  }

  // Apply horror effects based on combined theme
  const combinedTheme = sensoryMapper.mapToCombinedTheme(
    currentMaxComplexity,
    diagnostics.horrorScore,
    diagnostics.severity
  );

  // Set ambient audio based on combined score
  if (audioEnabled) {
    const score = combinedTheme.combinedScore || 0;
    let ambientTheme: 'calm' | 'warning' | 'danger' | 'critical';
    if (score >= 60 || diagnostics.errorCount >= 5 || currentMaxComplexity >= 20) {
      ambientTheme = 'critical';
    } else if (score >= 35 || diagnostics.errorCount >= 3 || currentMaxComplexity >= 15) {
      ambientTheme = 'danger';
    } else if (score >= 15 || diagnostics.errorCount >= 1 || currentMaxComplexity >= 10) {
      ambientTheme = 'warning';
    } else {
      ambientTheme = 'calm';
    }
    
    audioEngine.setAmbientTheme(ambientTheme).catch((err: any) => {
      console.error('[codeblooded Debug] Failed to set ambient:', err);
    });
  }

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
}

/**
 * Check if language is supported
 */
function isSupportedLanguage(languageId: string): boolean {
  return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'python'].includes(languageId);
}

/**
 * Apply complexity-based decorations in Safe Mode
 * Shows color-coded highlighting and updates window edge colors
 */
async function applyComplexityDecorations(editor: vscode.TextEditor): Promise<void> {
  const document = editor.document;
  const filePath = document.fileName;
  
  console.log('[codeblooded] Applying complexity decorations for:', filePath);
  
  // Get or analyze complexity data
  let complexityData = complexityAnalysisManager.getFileComplexity(filePath);
  
  if (!complexityData) {
    // Analyze the file if not in cache
    complexityData = await complexityAnalysisManager.analyzeFile(document) || undefined;
  }
  
  if (!complexityData || !complexityData.analysisResult) {
    console.log('[codeblooded] No complexity data available for:', filePath);
    decorationManager.clearDecorations(editor);
    // Reset to calm blue for files with no complexity data
    const calmTheme = sensoryMapper.mapToVisual(0);
    themeManager.updateTheme(calmTheme);
    return;
  }
  
  // Apply decorations (color-coded highlighting with hover tooltips)
  decorationManager.applyDecorations(editor, complexityData.analysisResult);
  
  // Update window edge color based on max complexity
  const color = complexityAnalysisManager.getComplexityColor(complexityData.complexityLevel);
  console.log('[codeblooded] Updating window color to:', color, 'for complexity level:', complexityData.complexityLevel, 'max complexity:', complexityData.maxComplexity);
  
  // Ensure theme manager is enabled for safe mode
  themeManager.setEnabled(true);
  
  // Create a visual mapping for the theme manager
  const visualMapping = sensoryMapper.mapToVisual(complexityData.maxComplexity);
  console.log('[codeblooded] Visual mapping:', visualMapping);
  themeManager.updateTheme(visualMapping);
  
  // Update status bar with health score
  if (complexityData.analysisResult) {
    const { calculateHealthScore } = require('@codeblooded/core');
    const healthScore = calculateHealthScore(complexityData.analysisResult);
    statusBarManager.updateHealthScore(healthScore.overall);
  }
  
  console.log('[codeblooded] Complexity decorations applied. Max complexity:', complexityData.maxComplexity);
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
    console.error('codeblooded: Analysis failed', error);
    return null;
  }
}
