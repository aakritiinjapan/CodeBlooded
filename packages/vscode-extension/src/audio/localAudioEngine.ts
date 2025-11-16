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
    console.log('[CodeChroma Audio] Initializing local audio engine...');
    try {
      await this.ensureWebview();
      console.log('[CodeChroma Audio] Local audio engine initialized successfully');
    } catch (error) {
      console.error('[CodeChroma Audio] Initialization failed:', error);
      throw error; // Re-throw to see the error in extension.ts
    }
  }

  /**
   * Set ambient theme based on code complexity
   */
  async setAmbientTheme(theme: AmbientTheme): Promise<void> {
    console.log('[CodeChroma Audio] setAmbientTheme called:', theme, 'current:', this.currentTheme, 'enabled:', this.enabled);
    
    if (this.currentTheme === theme) {
      console.log('[CodeChroma Audio] Theme unchanged, skipping');
      return;
    }

    if (!this.enabled) {
      console.log('[CodeChroma Audio] Audio disabled, skipping ambient');
      return;
    }

    this.currentTheme = theme;
    console.log('[CodeChroma Audio] Changing ambient to:', theme);

    try {
      await this.ensureWebview();
      
      const audioUri = this.getAmbientAudioUri(theme);
      console.log('[CodeChroma Audio] Sending ambient URI to webview:', audioUri.toString());
      this.postMessage({ type: 'setAmbient', audioUri: audioUri.toString() });
    } catch (error) {
      console.error('[CodeChroma Audio] Failed to set ambient:', error);
      throw error;
    }
  }

  /**
   * Play popup horror sound
   */
  async playPopupSound(severity: PopupSeverity): Promise<void> {
    console.log('[CodeChroma Audio] playPopupSound called:', severity, 'enabled:', this.enabled);
    
    if (!this.enabled) {
      console.log('[CodeChroma Audio] Audio disabled, skipping popup sound');
      return;
    }

    try {
      await this.ensureWebview();
      const audioUri = this.getPopupAudioUri(severity);
      console.log('[CodeChroma Audio] Sending popup URI to webview:', audioUri.toString());
      this.postMessage({ type: 'playPopup', audioUri: audioUri.toString() });
    } catch (error) {
      console.error('[CodeChroma Audio] Failed to play popup:', error);
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
    const fileName = severity === 'critical' ? 'critical.mp3' : `${severity}.wav`;
    return this.panel!.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, 'media', 'audio', 'popups', fileName)
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
        console.error('[CodeChroma Audio] Timeout');
        reject(new Error('Audio initialization timeout'));
      }, 8000);

      // Create webview in current window (no split)
      this.panel = vscode.window.createWebviewPanel(
        'codechromaLocalAudio',
        '🔊 CodeChroma Audio',
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
          '🎵 CodeChroma Audio Ready! Click "Enable Audio" button in the panel on the right to activate horror sounds.',
          'Got it'
        );
      }, 500);

      // Keep the message listener active for logging
      this.panel.webview.onDidReceiveMessage((message: any) => {
        if (message.type === 'ready') {
          console.log('[CodeChroma Audio] Webview ready');
          clearTimeout(timeout);
          // Add a small delay to ensure message handler is fully set up
          setTimeout(() => {
            this.applyInitialState();
            this.readyResolver?.();
            this.readyResolver = undefined;
          }, 150);
        } else if (message.type === 'log') {
          console.log(`[CodeChroma Audio] ${message.message}`);
        } else if (message.type === 'audioUnlocked') {
          console.log('[CodeChroma Audio] Audio unlocked successfully - switching back to previous editor');
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
      console.warn('[CodeChroma Audio] Failed to send message', error);
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
      background: linear-gradient(135deg, #1a0000, #000000, #001a00);
      color: #0f0; 
      font-family: 'Courier New', monospace; 
      margin: 0;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .title {
      font-size: 32px;
      margin-bottom: 20px;
      text-shadow: 0 0 20px #0f0;
      animation: glow 2s ease-in-out infinite alternate;
    }
    @keyframes glow {
      from { text-shadow: 0 0 10px #0f0, 0 0 20px #0f0; }
      to { text-shadow: 0 0 20px #0f0, 0 0 30px #0f0, 0 0 40px #0f0; }
    }
    .status { 
      padding: 20px; 
      background: rgba(0, 255, 0, 0.1); 
      border: 2px solid #0f0;
      margin: 20px 0;
      border-radius: 10px;
      font-size: 18px;
      max-width: 600px;
    }
    #enableBtn {
      background: linear-gradient(45deg, #0f0, #0a0);
      color: #000;
      border: 3px solid #0f0;
      padding: 30px 60px;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      margin: 30px 0;
      border-radius: 15px;
      box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
      transition: all 0.3s ease;
      text-transform: uppercase;
    }
    #enableBtn:hover {
      background: linear-gradient(45deg, #0a0, #080);
      transform: scale(1.1);
      box-shadow: 0 0 50px rgba(0, 255, 0, 0.8);
    }
    #enableBtn:disabled {
      background: #333;
      color: #666;
      cursor: not-allowed;
      border-color: #666;
      box-shadow: none;
      transform: none;
    }
  </style>
</head>
<body>
  <div class="title">👻 CodeChroma Horror Audio 👻</div>
  <div class="status">⚠️ Browser security requires one click to enable audio playback ⚠️</div>
  <button id="enableBtn">🔊 CLICK HERE TO ENABLE AUDIO 🔊</button>
  <div class="status" id="statusText">Once enabled, audio will play automatically as you code!</div>
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
      enableBtn.textContent = '✓ AUDIO ENABLED';
      statusText.textContent = '🎵 Audio is now active! Sounds will play automatically as you code. You can minimize or close this panel - audio will continue in background.';
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
        statusText.textContent = '⚠️ Click "ENABLE AUDIO" button to hear sounds!';
        enableBtn.style.animation = 'pulse 1s infinite';
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
