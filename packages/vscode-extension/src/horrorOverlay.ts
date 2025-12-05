/**
 * Horror Overlay Manager
 * 
 * Manages visual horror effects like spider webs, blood drips, and fog
 */

import * as vscode from 'vscode';

export class HorrorOverlayManager implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext;
  private currentIntensity: number = 0;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Show or update horror overlay with specified effects
   */
  showOverlay(effects: {
    cobweb?: boolean;
    bloodDrip?: boolean;
    fog?: boolean;
    intensity?: number;
  }): void {
    this.currentIntensity = effects.intensity ?? 0.5;

    if (!this.panel) {
      this.createPanel();
    }

    // Send update to webview
    this.panel?.webview.postMessage({
      command: 'updateEffects',
      effects,
    });
  }

  /**
   * Hide the overlay
   */
  hideOverlay(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }

  /**
   * Create the webview panel
   */
  private createPanel(): void {
    this.panel = vscode.window.createWebviewPanel(
      'codebloodedHorrorOverlay',
      'codeblooded Horror Effects',
      { viewColumn: vscode.ViewColumn.One, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    // Make it semi-transparent and overlay
    this.panel.webview.html = this.getOverlayHtml();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    // Position it as an overlay (this is just a visual panel, not a true overlay)
    this.panel.reveal(vscode.ViewColumn.One, true);
  }

  /**
   * Generate HTML for horror overlay
   */
  private getOverlayHtml(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horror Effects</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      overflow: hidden;
      pointer-events: none;
      position: relative;
      width: 100vw;
      height: 100vh;
    }

    /* Spider Web Effects */
    .cobweb {
      position: absolute;
      opacity: 0;
      transition: opacity 1s ease-in-out;
    }

    .cobweb.active {
      opacity: 0.6;
    }

    .cobweb-top-left {
      top: 0;
      left: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle at 0% 0%, 
        rgba(200, 200, 200, 0.3) 0%, 
        transparent 70%);
    }

    .cobweb-top-right {
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle at 100% 0%, 
        rgba(200, 200, 200, 0.3) 0%, 
        transparent 70%);
    }

    .cobweb-bottom-left {
      bottom: 0;
      left: 0;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle at 0% 100%, 
        rgba(200, 200, 200, 0.25) 0%, 
        transparent 70%);
    }

    .cobweb-bottom-right {
      bottom: 0;
      right: 0;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle at 100% 100%, 
        rgba(200, 200, 200, 0.25) 0%, 
        transparent 70%);
    }

    /* Spider Web SVG for more realistic webs */
    .web-svg {
      position: absolute;
      opacity: 0;
      transition: opacity 1s ease-in-out;
    }

    .web-svg.active {
      opacity: 0.4;
    }

    /* Blood Drip Effect */
    .blood-drip {
      position: absolute;
      width: 2px;
      height: 0;
      background: linear-gradient(to bottom, 
        rgba(139, 0, 0, 0.8) 0%, 
        rgba(220, 20, 60, 0.6) 50%, 
        transparent 100%);
      opacity: 0;
      animation: drip 3s ease-in infinite;
    }

    @keyframes drip {
      0% {
        height: 0;
        opacity: 0;
        top: 0;
      }
      10% {
        opacity: 0.9;
      }
      50% {
        height: 100px;
        opacity: 0.7;
      }
      100% {
        height: 150px;
        opacity: 0;
        top: 150px;
      }
    }

    /* Fog Effect */
    .fog {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 200px;
      background: linear-gradient(to top, 
        rgba(100, 100, 100, 0.3) 0%, 
        transparent 100%);
      opacity: 0;
      transition: opacity 2s ease-in-out;
      animation: fogMove 10s ease-in-out infinite;
    }

    .fog.active {
      opacity: 0.5;
    }

    @keyframes fogMove {
      0%, 100% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(20px);
      }
    }

    /* Vignette Effect for horror */
    .vignette {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-shadow: inset 0 0 200px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      opacity: 0;
      transition: opacity 1s;
    }

    .vignette.active {
      opacity: 1;
    }

    /* Pulse effect for critical states */
    @keyframes pulse {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.7;
      }
    }

    .pulse {
      animation: pulse 2s ease-in-out infinite;
    }
  </style>
</head>
<body>
  <!-- Spider Webs -->
  <div class="cobweb cobweb-top-left" id="web1"></div>
  <div class="cobweb cobweb-top-right" id="web2"></div>
  <div class="cobweb cobweb-bottom-left" id="web3"></div>
  <div class="cobweb cobweb-bottom-right" id="web4"></div>

  <!-- SVG Spider Webs -->
  <svg class="web-svg" id="webSvg1" width="300" height="300" style="top: 0; left: 0;">
    <line x1="0" y1="0" x2="150" y2="150" stroke="rgba(200,200,200,0.4)" stroke-width="1"/>
    <line x1="0" y1="0" x2="100" y2="150" stroke="rgba(200,200,200,0.4)" stroke-width="1"/>
    <line x1="0" y1="0" x2="150" y2="100" stroke="rgba(200,200,200,0.4)" stroke-width="1"/>
    <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(200,200,200,0.3)" stroke-width="1"/>
    <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(200,200,200,0.3)" stroke-width="1"/>
  </svg>

  <svg class="web-svg" id="webSvg2" width="300" height="300" style="top: 0; right: 0;">
    <line x1="300" y1="0" x2="150" y2="150" stroke="rgba(200,200,200,0.4)" stroke-width="1"/>
    <line x1="300" y1="0" x2="200" y2="150" stroke="rgba(200,200,200,0.4)" stroke-width="1"/>
    <line x1="300" y1="0" x2="150" y2="100" stroke="rgba(200,200,200,0.4)" stroke-width="1"/>
    <circle cx="300" cy="0" r="50" fill="none" stroke="rgba(200,200,200,0.3)" stroke-width="1"/>
    <circle cx="300" cy="0" r="100" fill="none" stroke="rgba(200,200,200,0.3)" stroke-width="1"/>
  </svg>

  <!-- Blood Drips (will be generated dynamically) -->
  <div id="bloodContainer"></div>

  <!-- Fog -->
  <div class="fog" id="fog"></div>

  <!-- Vignette -->
  <div class="vignette" id="vignette"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let activeEffects = {
      cobweb: false,
      bloodDrip: false,
      fog: false,
      intensity: 0.5
    };

    window.addEventListener('message', event => {
      const message = event.data;
      
      if (message.command === 'updateEffects') {
        activeEffects = { ...activeEffects, ...message.effects };
        updateVisuals();
      }
    });

    function updateVisuals() {
      // Update cobwebs
      const webs = document.querySelectorAll('.cobweb, .web-svg');
      webs.forEach(web => {
        if (activeEffects.cobweb) {
          web.classList.add('active');
        } else {
          web.classList.remove('active');
        }
      });

      // Update blood drips
      const bloodContainer = document.getElementById('bloodContainer');
      if (activeEffects.bloodDrip) {
        // Create multiple blood drips
        bloodContainer.innerHTML = '';
        const numDrips = Math.floor(activeEffects.intensity * 10) + 3;
        for (let i = 0; i < numDrips; i++) {
          const drip = document.createElement('div');
          drip.className = 'blood-drip';
          drip.style.left = Math.random() * 100 + '%';
          drip.style.animationDelay = Math.random() * 3 + 's';
          drip.style.animationDuration = (2 + Math.random() * 2) + 's';
          bloodContainer.appendChild(drip);
        }
      } else {
        bloodContainer.innerHTML = '';
      }

      // Update fog
      const fog = document.getElementById('fog');
      if (activeEffects.fog) {
        fog.classList.add('active');
        fog.style.opacity = activeEffects.intensity * 0.5;
      } else {
        fog.classList.remove('active');
      }

      // Update vignette
      const vignette = document.getElementById('vignette');
      if (activeEffects.cobweb || activeEffects.bloodDrip || activeEffects.fog) {
        vignette.classList.add('active');
        if (activeEffects.bloodDrip) {
          vignette.classList.add('pulse');
        }
      } else {
        vignette.classList.remove('active');
        vignette.classList.remove('pulse');
      }
    }
  </script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  dispose(): void {
    this.hideOverlay();
  }
}
