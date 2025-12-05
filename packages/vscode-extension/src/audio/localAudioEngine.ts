import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Local Audio Engine
 * Plays audio files from the extension's media folder
 */

export type AmbientTheme = 'calm' | 'warning' | 'danger' | 'critical';
export type PopupSeverity = 'warning' | 'error' | 'critical';

export class LocalAudioEngine implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private readyPromise: Promise<void> | undefined;
  private readyResolver: (() => void) | undefined;
  private enabled = true;
  private volume = 1.0; // MAX VOLUME - make it audible!
  private currentTheme: AmbientTheme = 'calm';

  constructor(private readonly context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    console.log('[codeblooded Audio] Initializing local audio engine...');
    try {
      await this.ensureWebview();
      console.log('[codeblooded Audio] Local audio engine initialized successfully');
    } catch (error) {
      console.error('[codeblooded Audio] Initialization failed:', error);
      throw error; // Re-throw to see the error in extension.ts
    }
  }

  /**
   * Set ambient theme based on code complexity
   */
  async setAmbientTheme(theme: AmbientTheme): Promise<void> {
    console.log('[codeblooded Audio] setAmbientTheme called:', theme, 'current:', this.currentTheme, 'enabled:', this.enabled);
    
    if (this.currentTheme === theme) {
      console.log('[codeblooded Audio] Theme unchanged, skipping');
      return;
    }

    if (!this.enabled) {
      console.log('[codeblooded Audio] Audio disabled, skipping ambient');
      return;
    }

    this.currentTheme = theme;
    console.log('[codeblooded Audio] Changing ambient to:', theme);

    try {
      await this.ensureWebview();
      
      const audioUri = this.getAmbientAudioUri(theme);
      console.log('[codeblooded Audio] Sending ambient URI to webview:', audioUri.toString());
      this.postMessage({ type: 'setAmbient', audioUri: audioUri.toString() });
    } catch (error) {
      console.error('[codeblooded Audio] Failed to set ambient:', error);
      throw error;
    }
  }

  /**
   * Play popup horror sound
   */
  async playPopupSound(severity: PopupSeverity): Promise<void> {
    console.log('[codeblooded Audio] playPopupSound called:', severity, 'enabled:', this.enabled);
    
    if (!this.enabled) {
      console.log('[codeblooded Audio] Audio disabled, skipping popup sound');
      return;
    }

    try {
      await this.ensureWebview();
      const audioUri = this.getPopupAudioUri(severity);
      console.log('[codeblooded Audio] Sending popup URI to webview:', audioUri.toString());
      this.postMessage({ type: 'playPopup', audioUri: audioUri.toString() });
    } catch (error) {
      console.error('[codeblooded Audio] Failed to play popup:', error);
      throw error;
    }
  }

  /**
   * Play variant-specific audio file
   */
  async playVariantAudio(audioFileName: string): Promise<void> {
    console.log('[codeblooded Audio] playVariantAudio called:', audioFileName, 'enabled:', this.enabled);
    
    if (!this.enabled) {
      console.log('[codeblooded Audio] Audio disabled, skipping variant audio');
      return;
    }

    try {
      await this.ensureWebview();
      const audioUri = this.getVariantAudioUri(audioFileName);
      console.log('[codeblooded Audio] Sending variant audio URI to webview:', audioUri.toString());
      this.postMessage({ type: 'playPopup', audioUri: audioUri.toString() });
    } catch (error) {
      console.error('[codeblooded Audio] Failed to play variant audio:', error);
      throw error;
    }
  }

  stopAll(): void {
    this.postMessage({ type: 'stopAll' });
  }

  pauseAmbient(): void {
    // Pause ONLY ambient audio, don't touch popup
    this.postMessage({ type: 'pauseAmbient' });
  }

  stopPopup(): void {
    this.postMessage({ type: 'stopPopup' });
  }

  fadeOutPopup(duration: number): void {
    this.postMessage({ type: 'fadeOutPopup', duration });
  }

  resumeAmbient(): void {
    // Force resume ambient audio even if theme unchanged
    this.postMessage({ type: 'resumeAmbient' });
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.postMessage({ type: 'setVolume', volume: this.volume });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable(): void {
    if (this.enabled) {
      return;
    }

    this.enabled = true;
    this.postMessage({ type: 'setEnabled', enabled: true });
    this.setAmbientTheme(this.currentTheme);
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;
    this.stopAll();
    this.postMessage({ type: 'setEnabled', enabled: false });
  }

  dispose(): void {
    this.stopAll();
    this.panel?.dispose();
    this.panel = undefined;
    this.readyPromise = undefined;
    this.readyResolver = undefined;
  }

  private getAmbientAudioUri(theme: AmbientTheme): vscode.Uri {
    const fileName = theme === 'warning' ? 'warning.mp3' : `${theme}.wav`;
    return this.panel!.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'media', 'audio', 'ambient', fileName)
      )
    );
  }

  private getPopupAudioUri(severity: PopupSeverity): vscode.Uri {
    // Use warning.wav for both warning and error (ghost popup)
    // Use critical.mp3 for critical (scary lady popup)
    const fileName = severity === 'critical' ? 'critical.mp3' : 'warning.wav';
    return this.panel!.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'media', 'audio', 'popups', fileName)
      )
    );
  }

  private getVariantAudioUri(audioFileName: string): vscode.Uri {
    return this.panel!.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'media', 'audio', 'popups', audioFileName)
      )
    );
  }

  private async ensureWebview(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolver = resolve;

      const timeout = setTimeout(() => {
        console.error('[codeblooded Audio] Timeout');
        reject(new Error('Audio initialization timeout'));
      }, 8000);

      // Create webview in current window (no split)
      this.panel = vscode.window.createWebviewPanel(
        'codebloodedLocalAudio',
        '🔊 codeblooded Audio',
        vscode.ViewColumn.Active, // Use active column, no split
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      this.panel.iconPath = undefined;
      this.panel.webview.html = this.getHtml();
      
      // Show notification with enable button
      setTimeout(() => {
        vscode.window.showInformationMessage(
          '🎵 codeblooded Audio Ready! Click "Enable Audio" button in the panel on the right to activate horror sounds.',
          'Got it'
        );
      }, 500);

      // Keep the message listener active for logging
      this.panel.webview.onDidReceiveMessage((message: any) => {
        if (message.type === 'ready') {
          console.log('[codeblooded Audio] Webview ready');
          clearTimeout(timeout);
          // Add a small delay to ensure message handler is fully set up
          setTimeout(() => {
            this.applyInitialState();
            this.readyResolver?.();
            this.readyResolver = undefined;
          }, 150);
        } else if (message.type === 'log') {
          console.log(`[codeblooded Audio] ${message.message}`);
        } else if (message.type === 'audioUnlocked') {
          console.log('[codeblooded Audio] Audio unlocked successfully - switching back to previous editor');
          // Switch back to the previous editor tab (don't close audio panel!)
          setTimeout(() => {
            vscode.commands.executeCommand('workbench.action.previousEditor');
          }, 500);
        }
      });

      this.panel.onDidDispose(() => {
        clearTimeout(timeout);
        this.panel = undefined;
        this.readyPromise = undefined;
        this.readyResolver = undefined;
      });
    });

    return this.readyPromise;
  }

  private applyInitialState(): void {
    this.postMessage({ type: 'initialize', volume: this.volume, enabled: this.enabled });
    if (this.enabled) {
      const audioUri = this.getAmbientAudioUri(this.currentTheme);
      this.postMessage({ type: 'setAmbient', audioUri: audioUri.toString() });
    }
  }

  private postMessage(message: any): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.postMessage(message).then(undefined, (error) => {
      console.warn('[codeblooded Audio] Failed to send message', error);
    });
  }

  private getHtml(): string {
    const nonce = this.createNonce();
    const csp = `default-src 'none'; media-src ${this.panel?.webview.cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Horror Audio</title>
  <style nonce="${nonce}">
    body { 
      background: linear-gradient(135deg, #1a0000, #0d0000, #000000);
      color: #c41e3a; 
      font-family: 'Courier New', monospace; 
      margin: 0;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      text-align: center;
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%);
      pointer-events: none;
    }
    .title {
      font-size: 36px;
      margin-bottom: 10px;
      color: #8b0000;
      text-shadow: 0 0 20px #8b0000, 0 0 40px #660000, 0 0 60px #440000;
      animation: bloodPulse 2s ease-in-out infinite;
      z-index: 1;
    }
    .subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 30px;
      font-style: italic;
      z-index: 1;
    }
    @keyframes bloodPulse {
      0%, 100% { text-shadow: 0 0 20px #8b0000, 0 0 40px #660000; transform: scale(1); }
      50% { text-shadow: 0 0 30px #c41e3a, 0 0 60px #8b0000, 0 0 80px #660000; transform: scale(1.02); }
    }
    @keyframes drip {
      0% { transform: translateY(-10px); opacity: 0; }
      10% { opacity: 1; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
    .blood-drip {
      position: absolute;
      top: 0;
      width: 3px;
      height: 20px;
      background: linear-gradient(to bottom, #8b0000, transparent);
      border-radius: 0 0 50% 50%;
      animation: drip 4s linear infinite;
    }
    .info-box {
      background: rgba(139, 0, 0, 0.15);
      border: 1px solid #8b0000;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
      max-width: 500px;
      z-index: 1;
    }
    .info-box h3 {
      color: #c41e3a;
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .info-box p {
      color: #999;
      margin: 5px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .warning {
      color: #ff6b6b;
      font-size: 14px;
      margin: 10px 0;
      z-index: 1;
    }
    .dark-mode-note {
      background: rgba(100, 100, 100, 0.2);
      border: 1px dashed #666;
      border-radius: 5px;
      padding: 10px 15px;
      margin: 15px 0;
      color: #888;
      font-size: 13px;
      z-index: 1;
    }
    #enableBtn {
      background: linear-gradient(180deg, #8b0000, #5c0000);
      color: #fff;
      border: 2px solid #c41e3a;
      padding: 25px 50px;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      margin: 25px 0;
      border-radius: 10px;
      box-shadow: 0 0 30px rgba(139, 0, 0, 0.6), inset 0 0 20px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 2px;
      z-index: 1;
    }
    #enableBtn:hover {
      background: linear-gradient(180deg, #a00000, #700000);
      transform: scale(1.05);
      box-shadow: 0 0 50px rgba(196, 30, 58, 0.8), inset 0 0 20px rgba(0,0,0,0.3);
    }
    #enableBtn:disabled {
      background: #222;
      color: #555;
      cursor: not-allowed;
      border-color: #444;
      box-shadow: none;
      transform: none;
    }
    .status-text {
      color: #888;
      font-size: 14px;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="blood-drip" style="left: 10%; animation-delay: 0s;"></div>
  <div class="blood-drip" style="left: 25%; animation-delay: 1s;"></div>
  <div class="blood-drip" style="left: 75%; animation-delay: 2s;"></div>
  <div class="blood-drip" style="left: 90%; animation-delay: 0.5s;"></div>
  
  <div class="title">☠️ THE CODE BLEEDS ☠️</div>
  <div class="subtitle">Your IDE will never feel safe again...</div>
  
  <div class="info-box">
    <h3>🩸 What Awaits You</h3>
    <p>Phantom typing that writes itself... Screen distortions that twist reality...</p>
    <p>Jumpscares when you least expect them... Whispers from your variables...</p>
    <p>The deeper your code complexity, the more intense the horror.</p>
  </div>
  
  <div class="warning">⚠️ Browser security requires one click to unleash the audio</div>
  
  <button id="enableBtn">🔊 AWAKEN THE HORROR 🔊</button>
  
  <div class="dark-mode-note">💡 For the best experience, use VS Code in Dark Mode</div>
  
  <div class="status-text" id="statusText">Once enabled, the nightmare begins automatically as you code...</div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    
    // Log immediately to confirm script is running
    vscode.postMessage({ type: 'log', message: 'Audio webview script loaded!' });
    
    let enabled = true;
    let globalVolume = 1.0; // MAX VOLUME
    let ambientAudio = null;
    let popupAudio = null;
    let userInteracted = false;

    const enableBtn = document.getElementById('enableBtn');
    const statusText = document.getElementById('statusText');

    // Handle user click to enable audio
    enableBtn.addEventListener('click', () => {
      userInteracted = true;
      enableBtn.disabled = true;
      enableBtn.textContent = '☠️ THE HORROR AWAKENS ☠️';
      statusText.textContent = '🩸 The nightmare is active... Audio will haunt you as you code. You can minimize this panel - the horror continues in the shadows.';
      vscode.postMessage({ type: 'log', message: 'User enabled audio playback' });
      
      // CRITICAL: Create popup Audio object NOW during user gesture to inherit permission
      if (!popupAudio) {
        popupAudio = new Audio();
        popupAudio.volume = globalVolume;
        popupAudio.loop = false;
        vscode.postMessage({ type: 'log', message: 'Popup Audio object created with user permission' });
      }
      
      vscode.postMessage({ type: 'audioUnlocked' }); // Tell extension user clicked
      
      // Try to play any pending audio
      if (ambientAudio) {
        ambientAudio.play().then(() => {
          statusText.textContent = '🎵 Playing: ' + (ambientAudio.src.split('/').pop() || 'ambient audio');
        }).catch(err => {
          vscode.postMessage({ type: 'log', message: 'Retry ambient error: ' + err });
          statusText.textContent = '❌ Error playing audio: ' + err.message;
        });
      }
    });

    // Send ready message
    setTimeout(() => {
      vscode.postMessage({ type: 'ready' });
      vscode.postMessage({ type: 'log', message: 'Ready message sent' });
    }, 100);

    function playAmbient(audioUri) {
      vscode.postMessage({ type: 'log', message: 'playAmbient called with: ' + audioUri + ' (userInteracted=' + userInteracted + ')' });
      
      if (!enabled) {
        vscode.postMessage({ type: 'log', message: 'Audio disabled, skipping ambient' });
        return;
      }

      if (!userInteracted) {
        vscode.postMessage({ type: 'log', message: 'Waiting for user interaction...' });
        statusText.textContent = '⚠️ Click the button above to unleash the audio horror!';
        enableBtn.style.animation = 'bloodPulse 1s infinite';
        // Create audio object but don't play yet - wait for user click
        if (!ambientAudio) {
          ambientAudio = new Audio();
          ambientAudio.loop = true;
          ambientAudio.volume = 1.0;
        }
        ambientAudio.src = audioUri;
        return;
      }

      // CRITICAL FIX: Reuse the same Audio object, just change the src
      // Creating a new Audio() loses the user gesture permission!
      if (!ambientAudio) {
        vscode.postMessage({ type: 'log', message: 'Creating new Audio object' });
        ambientAudio = new Audio();
        ambientAudio.loop = true;
        ambientAudio.volume = 1.0;
      } else {
        vscode.postMessage({ type: 'log', message: 'Reusing existing Audio object' });
        ambientAudio.pause(); // Pause current audio
      }

      // Just change the source instead of creating new object
      ambientAudio.src = audioUri;
      
      // Set volume based on audio type
      // High complexity (danger.wav) should be quieter at 30%
      if (audioUri.includes('danger.wav')) {
        ambientAudio.volume = 0.3; // 30% volume for high complexity
      } else {
        ambientAudio.volume = 1.0; // 100% for others
      }
      vscode.postMessage({ type: 'log', message: 'Ambient volume set to: ' + ambientAudio.volume + ' for: ' + audioUri.split('/').pop() });
      
      // Add detailed event listeners
      ambientAudio.addEventListener('loadstart', () => {
        vscode.postMessage({ type: 'log', message: 'Ambient: loadstart' });
      });
      ambientAudio.addEventListener('loadeddata', () => {
        vscode.postMessage({ type: 'log', message: 'Ambient: loadeddata' });
      });
      ambientAudio.addEventListener('canplay', () => {
        vscode.postMessage({ type: 'log', message: 'Ambient: canplay' });
      });
      ambientAudio.addEventListener('error', (e) => {
        vscode.postMessage({ type: 'log', message: 'Ambient: error event - ' + e.message });
      });
      
      if (userInteracted) {
        vscode.postMessage({ type: 'log', message: 'Attempting to play (userInteracted=true)' });
        ambientAudio.play().then(() => {
          vscode.postMessage({ type: 'log', message: 'Ambient audio playing successfully' });
          statusText.textContent = '🎵 Playing ambient audio: ' + audioUri.split('/').pop();
        }).catch(err => {
          vscode.postMessage({ type: 'log', message: 'Ambient play error: ' + err.toString() + ' | ' + err.message });
          statusText.textContent = '❌ Error: ' + err.message;
        });
      } else {
        vscode.postMessage({ type: 'log', message: 'Skipping play (userInteracted=false)' });
      }
    }

    function playPopup(audioUri) {
      vscode.postMessage({ type: 'log', message: 'playPopup called with: ' + audioUri });
      vscode.postMessage({ type: 'log', message: 'Popup state: enabled=' + enabled + ' userInteracted=' + userInteracted + ' popupExists=' + (popupAudio !== null) });
      
      if (!enabled) {
        vscode.postMessage({ type: 'log', message: 'Audio disabled, skipping popup' });
        return;
      }

      if (!userInteracted) {
        vscode.postMessage({ type: 'log', message: 'Cannot play popup - no user interaction' });
        return;
      }

      // CRITICAL FIX: Reuse same Audio object for popups too
      if (!popupAudio) {
        vscode.postMessage({ type: 'log', message: 'Creating new popup Audio object (first time)' });
        popupAudio = new Audio();
      } else {
        vscode.postMessage({ type: 'log', message: 'Reusing popup Audio object (paused=' + popupAudio.paused + ' currentTime=' + popupAudio.currentTime + ')' });
        popupAudio.pause();
        popupAudio.currentTime = 0; // Reset to beginning
      }

      popupAudio.src = audioUri;
      popupAudio.volume = globalVolume;
      popupAudio.loop = false; // Popups don't loop
      
      vscode.postMessage({ type: 'log', message: 'Starting popup audio play attempt...' });
      popupAudio.play().then(() => {
        vscode.postMessage({ type: 'log', message: '✅ Popup audio playing successfully' });
      }).catch(err => {
        vscode.postMessage({ type: 'log', message: '❌ Popup play error: ' + err.name + ' - ' + err.message });
      });
    }

    function stopAll() {
      vscode.postMessage({ type: 'log', message: 'stopAll called' });
      if (ambientAudio) {
        ambientAudio.pause();
        vscode.postMessage({ type: 'log', message: 'Ambient audio paused (keeping object alive)' });
        // DON'T set to null - we need to keep the Audio object to preserve user gesture permission!
      }
      if (popupAudio) {
        popupAudio.pause();
        vscode.postMessage({ type: 'log', message: 'Popup audio paused (keeping object alive)' });
        // DON'T set to null - we need to keep the Audio object to preserve user gesture permission!
      }
    }

    window.addEventListener('message', (event) => {
      const message = event.data;
      vscode.postMessage({ type: 'log', message: 'Message received: ' + message.type });
      
      switch (message.type) {
        case 'initialize':
          enabled = message.enabled;
          globalVolume = message.volume;
          vscode.postMessage({ type: 'log', message: 'Initialized with volume: ' + globalVolume });
          break;
          
        case 'setAmbient':
          playAmbient(message.audioUri);
          break;
          
        case 'playPopup':
          playPopup(message.audioUri);
          break;
          
        case 'stopAll':
          stopAll();
          break;
          
        case 'pauseAmbient':
          vscode.postMessage({ type: 'log', message: 'pauseAmbient called' });
          if (ambientAudio) {
            ambientAudio.pause();
            vscode.postMessage({ type: 'log', message: '✅ Ambient audio paused (popup unaffected)' });
          }
          break;
          
        case 'stopPopup':
          vscode.postMessage({ type: 'log', message: 'stopPopup called' });
          if (popupAudio) {
            vscode.postMessage({ type: 'log', message: 'Popup state before stop: paused=' + popupAudio.paused + ' currentTime=' + popupAudio.currentTime + ' src=' + popupAudio.src });
            popupAudio.pause();
            popupAudio.currentTime = 0; // Reset to beginning for next popup
            vscode.postMessage({ type: 'log', message: '✅ Popup audio stopped and reset to 0' });
          } else {
            vscode.postMessage({ type: 'log', message: '⚠️ No popup audio object to stop' });
          }
          break;
          
        case 'fadeOutPopup':
          vscode.postMessage({ type: 'log', message: 'fadeOutPopup called with duration: ' + message.duration });
          if (popupAudio && !popupAudio.paused) {
            const fadeDuration = message.duration || 1000;
            const startVolume = popupAudio.volume;
            const startTime = Date.now();
            
            const fadeInterval = setInterval(() => {
              const elapsed = Date.now() - startTime;
              const progress = elapsed / fadeDuration;
              
              if (progress >= 1) {
                popupAudio.volume = 0;
                popupAudio.pause();
                popupAudio.currentTime = 0;
                popupAudio.volume = globalVolume; // Restore volume for next popup
                clearInterval(fadeInterval);
                vscode.postMessage({ type: 'log', message: '✅ Popup audio faded out and stopped' });
              } else {
                popupAudio.volume = startVolume * (1 - progress);
              }
            }, 50); // Update every 50ms for smooth fade
          } else {
            vscode.postMessage({ type: 'log', message: '⚠️ No popup audio playing to fade out' });
          }
          break;
          
        case 'resumeAmbient':
          vscode.postMessage({ type: 'log', message: 'resumeAmbient called' });
          if (ambientAudio && ambientAudio.paused && userInteracted) {
            vscode.postMessage({ type: 'log', message: 'Resuming paused ambient audio' });
            ambientAudio.play().then(() => {
              vscode.postMessage({ type: 'log', message: 'Ambient resumed successfully' });
            }).catch(err => {
              vscode.postMessage({ type: 'log', message: 'Ambient resume error: ' + err });
            });
          }
          break;
          
        case 'setVolume':
          globalVolume = message.volume;
          if (ambientAudio) {
            ambientAudio.volume = globalVolume; // Full volume
          }
          break;
          
        case 'setEnabled':
          enabled = message.enabled;
          if (!enabled) {
            stopAll();
          }
          break;
          
        case 'autoEnable':
          // Auto-click the enable button if not already enabled
          if (!userInteracted && enableBtn && !enableBtn.disabled) {
            enableBtn.click();
            vscode.postMessage({ type: 'log', message: 'Auto-enabled audio on file change' });
          }
          break;
          
        case 'userEnable':
          // User clicked the notification button
          vscode.postMessage({ type: 'log', message: 'User clicked notification to enable audio' });
          if (!userInteracted && enableBtn && !enableBtn.disabled) {
            enableBtn.click();
          }
          break;
      }
    });
  </script>
</body>
</html>`;
  }

  private createNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 })
      .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
      .join('');
  }
}
