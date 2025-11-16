import * as vscode from 'vscode';
import { AudioMapping } from '@codechroma/core';

interface ReadyMessage {
  type: 'ready';
}

interface LogMessage {
  type: 'log';
  level: 'info' | 'warn' | 'error';
  message: string;
  detail?: unknown;
}

type WebviewToExtensionMessage = ReadyMessage | LogMessage;

type ExtensionToWebviewMessage =
  | { type: 'initialize'; volume: number; enabled: boolean }
  | { type: 'play'; mapping: AudioMapping }
  | { type: 'stop' }
  | { type: 'setVolume'; volume: number }
  | { type: 'setEnabled'; enabled: boolean };

/**
 * Audio engine that delegates playback to a hidden Webview where Web Audio is available.
 */
export class WebviewAudioEngine implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private readyPromise: Promise<void> | undefined;
  private readyResolver: (() => void) | undefined;
  private enabled = true;
  private volume = 0.5;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    console.log('[CodeChroma Debug] Initializing audio engine...');
    try {
      await this.ensureWebview();
      console.log('[CodeChroma Debug] Audio engine initialized successfully');
    } catch (error) {
      console.error('[CodeChroma Debug] Audio engine initialization failed:', error);
      // Don't re-throw - allow extension to continue with visual-only mode
    }
  }

  async play(mapping: AudioMapping): Promise<void> {
    console.log('[CodeChroma Debug] Audio play requested', { enabled: this.enabled, mapping });
    
    if (!this.enabled) {
      console.log('[CodeChroma Debug] Audio disabled, skipping playback');
      return;
    }

    try {
      await this.ensureWebview();
      console.log('[CodeChroma Debug] Playing audio for complexity:', mapping.frequency);
      this.postMessage({ type: 'play', mapping });
    } catch (error) {
      console.error('[CodeChroma Debug] Audio playback failed:', error);
      // Try to reinitialize for next time
      this.dispose();
    }
  }

  async playChord(_frequencies: number[]): Promise<void> {
    // Chords are handled at the mapping level by the sensory mapper.
    // If we need richer chord semantics later we can extend the webview script.
    return Promise.resolve();
  }

  async playTritone(): Promise<void> {
    return Promise.resolve();
  }

  async playGothicChord(): Promise<void> {
    return Promise.resolve();
  }

  stop(): void {
    this.postMessage({ type: 'stop' });
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
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;
    this.postMessage({ type: 'setEnabled', enabled: false });
  }

  dispose(): void {
    this.stop();
    this.panel?.dispose();
    this.panel = undefined;
    this.readyPromise = undefined;
    this.readyResolver = undefined;
  }

  private async ensureWebview(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolver = resolve;

      // Add timeout to prevent hanging extension host
      const timeout = setTimeout(() => {
        console.error('[CodeChroma Debug] Audio bridge initialization timeout (8s)');
        reject(new Error('Audio bridge initialization timeout'));
      }, 8000);

      console.log('[CodeChroma Debug] Creating webview for audio engine...');
      
      const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.Two;
      this.panel = vscode.window.createWebviewPanel(
        'codechromaAudioBridge',
        'CodeChroma Audio Bridge',
        { viewColumn: column, preserveFocus: true },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      console.log('[CodeChroma Debug] Webview created for audio engine');
      
      this.panel.iconPath = undefined;
      this.panel.webview.html = this.getHtml(this.panel.webview);

      const disposable = this.panel.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
        if (message.type === 'ready') {
          console.log('[CodeChroma Debug] Audio webview reported ready');
          clearTimeout(timeout);
          this.applyInitialState();
          this.readyResolver?.();
          this.readyResolver = undefined;
          disposable.dispose();
        } else {
          this.handleWebviewMessage(message);
        }
      });

      this.panel.onDidDispose(() => {
        console.log('[CodeChroma Debug] Audio webview disposed');
        clearTimeout(timeout);
        this.panel = undefined;
        this.readyPromise = undefined;
        this.readyResolver = undefined;
      });

      // Don't reveal the panel - keep it hidden in background
      // this.panel.reveal(undefined, true);
    });

    return this.readyPromise;
  }

  private applyInitialState(): void {
    this.postMessage({ type: 'initialize', volume: this.volume, enabled: this.enabled });
  }

  private postMessage(message: ExtensionToWebviewMessage): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.postMessage(message).then(undefined, (error) => {
      console.warn('CodeChroma: Failed to send audio message', error);
    });
  }

  private handleWebviewMessage(message: WebviewToExtensionMessage): void {
    switch (message.type) {
      case 'log':
        if (message.level === 'error') {
          console.error(`CodeChroma Audio: ${message.message}`, message.detail);
        } else if (message.level === 'warn') {
          console.warn(`CodeChroma Audio: ${message.message}`, message.detail);
        } else {
          console.log(`CodeChroma Audio: ${message.message}`);
        }
        break;
      default:
        break;
    }
  }

  private getHtml(_webview: vscode.Webview): string {
    const nonce = WebviewAudioEngine.createNonce();
    const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src https:; img-src 'none';`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CodeChroma Audio Bridge</title>
  <style nonce="${nonce}">
    body {
      background: #1a1a1a;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      margin: 20px;
      padding: 0;
    }

    .status {
      font-size: 14px;
      margin-bottom: 10px;
      padding: 10px;
      background: #2a2a2a;
      border: 1px solid #00ff00;
      border-radius: 4px;
    }

    .log {
      font-size: 12px;
      margin: 5px 0;
      padding: 5px;
      background: #1a1a1a;
      border-left: 3px solid #00ff00;
    }

    .log.error {
      border-left-color: #ff0000;
      color: #ff6666;
    }

    .log.warn {
      border-left-color: #ffaa00;
      color: #ffaa00;
    }
  </style>
</head>
<body>
  <div class="status">🎵 CodeChroma Audio Bridge</div>
  <div id="logs"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    let ready = false;
    let enabled = true;
    let globalVolume = 0.5;
    let masterVolume;
    const activeVoices = new Set();

    function addLog(level, message) {
      const logsDiv = document.getElementById('logs');
      const logEntry = document.createElement('div');
      logEntry.className = 'log ' + level;
      logEntry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
      logsDiv.appendChild(logEntry);
      // Keep only last 20 logs
      while (logsDiv.children.length > 20) {
        logsDiv.removeChild(logsDiv.firstChild);
      }
    }

    addLog('info', 'Audio bridge starting...');

    // Load Tone.js asynchronously to avoid blocking extension startup
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tone@14.9.17/build/Tone.js';
    script.onload = () => {
      addLog('info', 'Tone.js loaded successfully!');
      log('info', 'Tone.js loaded successfully from CDN');
      if (!ready) {
        ready = true;
        vscode.postMessage({ type: 'ready' });
        addLog('info', 'Audio bridge ready');
      }
    };
    script.onerror = (error) => {
      addLog('error', 'Failed to load Tone.js: ' + error);
      log('error', 'Failed to load Tone.js from CDN - audio will be disabled');
      if (!ready) {
        ready = true;
        vscode.postMessage({ type: 'ready' });
      }
    };
    
    addLog('info', 'Loading Tone.js from CDN...');
    document.head.appendChild(script);

    function log(level, message, detail) {
      vscode.postMessage({ type: 'log', level, message, detail });
    }

    function ensureTone() {
      if (!masterVolume) {
        masterVolume = new Tone.Volume(-12).toDestination();
        applyVolume();
      }
    }

    function applyVolume() {
      if (!masterVolume) {
        return;
      }
      const minDb = -48;
      const maxDb = 0;
      const gain = Math.max(0.001, Math.min(1, globalVolume));
      masterVolume.volume.value = Tone.gainToDb(gain);
      if (masterVolume.volume.value < minDb) {
        masterVolume.volume.value = minDb;
      }
      if (masterVolume.volume.value > maxDb) {
        masterVolume.volume.value = maxDb;
      }
    }

    function disposeVoice(voice) {
      voice.synth.dispose();
      voice.nodes.forEach(node => node.dispose());
      activeVoices.delete(voice);
    }

    async function play(mapping) {
      addLog('info', 'Play request received');
      
      if (!enabled || typeof Tone === 'undefined') {
        addLog('warn', 'Skipped - enabled: ' + enabled + ', Tone: ' + (typeof Tone !== 'undefined'));
        log('warn', 'Audio play skipped - disabled or Tone.js not available');
        return;
      }

      try {
        addLog('info', 'Starting Tone.js context...');
        await Tone.start();
        addLog('info', 'Tone.js context started');
        log('info', 'Tone.js audio context started');
        ensureTone();

        const nodes = [];
        
        // Create horror-themed synth based on effects
        let synthType = mapping.waveform ?? 'sine';
        let envelopeSettings = {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.4,
          release: 0.5,
        };

        // Adjust for horror effects
        const hasDistortion = (mapping.effects ?? []).some(e => e.type === 'distortion');
        const hasTremolo = (mapping.effects ?? []).some(e => e.type === 'tremolo');
        
        if (hasDistortion) {
          // Make it more aggressive for errors
          envelopeSettings = {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.3,
          };
        }

        for (const effect of mapping.effects ?? []) {
          switch (effect.type) {
            case 'reverb': {
              const reverb = new Tone.Reverb({ 
                decay: 3 + effect.intensity * 4, 
                wet: Math.min(0.8, effect.intensity + 0.2) 
              });
              nodes.push(reverb);
              break;
            }
            case 'distortion': {
              const distortion = new Tone.Distortion(Math.min(0.9, effect.intensity * 1.2));
              nodes.push(distortion);
              break;
            }
            case 'tremolo': {
              const tremolo = new Tone.Tremolo(6 + effect.intensity * 4, Math.min(0.9, effect.intensity * 0.8)).start();
              nodes.push(tremolo);
              break;
            }
            case 'delay': {
              const delay = new Tone.FeedbackDelay({ 
                delayTime: 0.25, 
                feedback: Math.min(0.7, effect.intensity) 
              });
              nodes.push(delay);
              break;
            }
            default:
              break;
          }
        }

        // Use different synth types for horror
        let synth;
        if (hasDistortion && hasTremolo) {
          // Critical error sound - very harsh
          synth = new Tone.AMSynth({
            harmonicity: 2.5,
            oscillator: { type: 'square' },
            envelope: envelopeSettings,
            modulation: { type: 'square' },
            modulationEnvelope: {
              attack: 0.01,
              decay: 0.5,
              sustain: 0.2,
              release: 0.3
            }
          });
        } else if (hasDistortion) {
          // Error sound - harsh and distorted
          synth = new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: { type: 'sawtooth' },
            envelope: envelopeSettings,
            modulation: { type: 'square' }
          });
        } else if (hasTremolo) {
          // Warning sound - eerie wobble
          synth = new Tone.FatOscillator({
            type: 'triangle',
            spread: 40,
            count: 3
          }).toDestination();
          synth.envelope = envelopeSettings;
        } else {
          // Normal complexity sound
          synth = new Tone.Synth({
            oscillator: {
              type: synthType,
            },
            envelope: envelopeSettings,
          });
        }

        if (nodes.length > 0) {
          synth.chain(...nodes, masterVolume);
        } else {
          synth.connect(masterVolume);
        }

        const voice = { synth, nodes };
        activeVoices.add(voice);

        const durationSeconds = Math.max(0.3, mapping.duration / 1000); // Longer duration for horror effect
        const velocity = Math.max(0.1, Math.min(0.8, (mapping.volume ?? 0.5) * globalVolume));

        addLog('info', 'Playing: ' + mapping.frequency + 'Hz (Horror mode)');
        log('info', \`Playing tone: \${mapping.frequency}Hz for \${durationSeconds}s at volume \${velocity}\`);
        
        // Play lower frequency for creepier sound
        const horrorFrequency = Math.max(80, mapping.frequency * 0.7);
        
        if (synth.triggerAttackRelease) {
          synth.triggerAttackRelease(horrorFrequency, durationSeconds, undefined, velocity);
        } else {
          // For oscillators
          synth.volume.value = Tone.gainToDb(velocity);
          synth.frequency.value = horrorFrequency;
          synth.start();
          setTimeout(() => synth.stop(), durationSeconds * 1000);
        }

        setTimeout(() => {
          disposeVoice(voice);
          addLog('info', 'Sound completed');
        }, durationSeconds * 1000 + 300);
      } catch (error) {
        addLog('error', 'Playback error: ' + error);
        log('error', 'Audio playback error', error);
      }
    }

    function stopAll() {
      activeVoices.forEach(disposeVoice);
    }

    window.addEventListener('message', async (event) => {
      const message = event.data;
      switch (message.type) {
        case 'initialize':
          enabled = message.enabled;
          globalVolume = message.volume;
          applyVolume();
          break;
        case 'play':
          try {
            await play(message.mapping);
          } catch (error) {
            log('error', 'Playback failure', error);
          }
          break;
        case 'stop':
          stopAll();
          break;
        case 'setVolume':
          globalVolume = message.volume;
          applyVolume();
          break;
        case 'setEnabled':
          enabled = message.enabled;
          if (!enabled) {
            stopAll();
          }
          break;
        default:
          break;
      }
    });

    // Fallback timeout in case Tone.js doesn't load
    setTimeout(() => {
      if (!ready) {
        ready = true;
        vscode.postMessage({ type: 'ready' });
      }
    }, 5000);
  </script>
</body>
</html>`;
  }

  private static createNonce(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 })
      .map(() => possible.charAt(Math.floor(Math.random() * possible.length)))
      .join('');
  }
}
