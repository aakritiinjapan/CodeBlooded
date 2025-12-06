# CodeBlooded 🩸👁️

> **Where code complexity meets psychological terror**

CodeBlooded is a VS Code extension that transforms code quality analysis into an immersive horror experience. Write clean code to maintain calm—but let complexity creep in, and face the consequences. Real-time AST analysis triggers escalating horror effects: eerie audio, blood drips, phantom typing, watching eyes, and unpredictable jumpscares. It's code review meets haunted house.

---

## ⚠️ IMPORTANT SAFETY WARNINGS

### 🚨 Photosensitivity Warning

**codeblooded contains flashing lights, rapid visual changes, and screen effects that may trigger seizures in individuals with photosensitive epilepsy.**

If you or anyone in your household has a history of seizures or epilepsy, **consult a physician before using this extension**.

### 🎃 Psychological Horror Content

codeblooded includes **optional psychological horror features** designed to create genuine unease and tension:

- **Jump scares** with disturbing imagery and sudden audio
- **Screen distortion effects** (shake, glitch, chromatic aberration)
- **Phantom typing events** that temporarily modify your editor
- **Entity presence indicators** (watching eyes, shadow figures)
- **Unsettling audio** and visual effects

### ❌ Not Recommended For

This extension is **NOT recommended** for users with:

- ✗ Photosensitive epilepsy or seizure disorders
- ✗ Anxiety disorders, PTSD, or panic disorders
- ✗ Heart conditions sensitive to sudden stress or jump scares
- ✗ Anyone who prefers a calm, distraction-free coding environment
- ✗ Users under 13 years of age

### 🛡️ Safety Features

codeblooded prioritizes your safety with built-in protections:

- **🚨 Panic Button** (`Ctrl+Alt+S`): Instantly disables ALL horror effects with one keypress
- **🛡️ Safe Mode**: Horror features are **disabled by default** - you must explicitly opt-in
- **♿ Accessibility Compliance**: Respects "Reduce Motion" and other accessibility settings
- **📺 Screen Sharing Detection**: Automatically disables effects during presentations
- **⚡ Flash Frequency Limiting**: Maximum 3 flashes per second to reduce seizure risk
- **💾 Code Safety**: All phantom effects are temporary and reversible - your actual code is never harmed
- **🎚️ Granular Controls**: Enable/disable individual effect categories

### 📋 First-Time Setup

When you first enable horror features:

1. You'll see a **warning dialog** with photosensitivity and psychological content notices
2. You must **explicitly opt-in** to enable horror effects
3. The extension will demonstrate the **Panic Button** (`Ctrl+Alt+S`)
4. You can customize intensity and individual effects in settings

**Remember**: Press `Ctrl+Alt+S` at ANY time to instantly disable all horror effects.

---

## 🎯 Features

### 🔍 Code Analysis (Safe Mode - Default)

- **Multi-Language Support**: TypeScript, JavaScript, Python, Java, C#, Go, Rust, C/C++, PHP, Ruby, Swift, Kotlin, Scala
- **Real-time Complexity Analysis**: AST-based cyclomatic complexity calculation with instant visual feedback
- **Color-Coded Decorations**: Function complexity indicators (🟦 Low → 🟪 Medium → 🟧 High → 🔴 Critical)
- **Status Bar Health Score**: Live workspace complexity tracking
- **Window Border Tinting**: Subtle color changes based on code health

### 🎃 Horror Mode (Opt-In)

**⚠️ Warning: Disturbing content. Horror features disabled by default. See safety warnings above.**

- **🎵 Adaptive Horror Audio**: Ambient soundscapes (calm → warning → danger → critical) with variant popup sounds
- **💀 Random Jumpscare System**: 5+ unique popup variants with disturbing imagery and synchronized audio
- **📺 Screen Distortion Effects**: Shake, glitch, VHS artifacts, chromatic aberration, and screen splits
- **📈 Progressive Intensity Escalation**: Horror gradually intensifies over coding sessions (20% → 100%)
- **👁️ Entity Presence System**: Watching eyes that spawn, move, and avoid your cursor
- **⌨️ Phantom Typing**: Brief character insertions that safely appear and disappear
- **🔤 Whispering Variables**: Variable names temporarily morph into creepy alternatives
- **🔮 Context-Aware Triggers**: Special effects when typing horror keywords ("kill", "dead", "error", "die")
- **⏱️ Time Dilation**: Editor animations speed up or slow down at high intensity
- **💧 Blood Drip Effects**: Visual blood drips cascade down your editor on every keystroke
- **💓 Heartbeat Pulse**: Status bar pulses like a heartbeat during high-stress coding
- **🎯 Hidden Easter Eggs**: Secret horror events discoverable through exploration (midnight coding, specific keywords)
- **🎚️ Granular Controls**: Adjust intensity (0-100), enable/disable individual effect categories

## 🏗️ Architecture

CodeBlooded is a monorepo with a shared core library and VS Code extension:

```
codeblooded/
├── packages/
│   ├── core/              # Shared analysis engine
│   └── vscode-extension/  # VS Code integration
```

### Components

- **@codeblooded/core**: AST parsing, complexity calculation, multi-language support, sensory mapping
- **codeblooded-vscode**: VS Code extension with horror effects, audio engine, visual feedback

## 🚀 Quick Start

### Installation

1. Install from VS Code Marketplace:
   ```
   ext install AakritiHGupta.codeblooded-vscode
   ```
   Or search for "codeblooded" in VS Code Extensions

2. **First Run**: You'll see a warning dialog about photosensitivity and horror content
   - Choose **"Stay in Safe Mode"** for complexity analysis only
   - Choose **"Enable Horror Features"** to opt into the full experience
   - You can always toggle later with `Ctrl+Shift+P` → "codeblooded: Toggle Safe Mode"

3. Open any supported file (TypeScript, JavaScript, Python, Java, C#, Go, Rust, C/C++, PHP, Ruby, Swift, Kotlin, Scala)

4. Start coding - complexity decorations appear automatically in Safe Mode

### Essential Commands

Press `Ctrl+Shift+P` (Command Palette) and type "codeblooded":

**Safety Controls:**
- `codeblooded: Panic Button` (or `Ctrl+Alt+S`) - **Instantly disable all horror effects**
- `codeblooded: Toggle Safe Mode` - Switch between Safe Mode and Horror Mode
- `codeblooded: Show Horror Controls` - View all settings and controls

**Audio:**
- `codeblooded: Toggle Audio Feedback` - Enable/disable audio (Horror Mode only)

**Testing (Horror Mode):**
- `codeblooded: Test Horror Popup` - Preview a random jumpscare
- `codeblooded: Test Screen Distortion` - Try different distortion effects
- `codeblooded: Test Entity Presence` - Spawn watching eyes
- `codeblooded: Test Phantom Typing` - See phantom typing effect
- `codeblooded: Test All Effects` - Comprehensive effects showcase

**Configuration:**
- `codeblooded: Reset Horror Settings` - Reset all settings and clear saved state
- `codeblooded: Reset Horror Warning` - Re-show first-run warning

## 📦 Development Setup

### For Development

1. Clone the repository:
   ```bash
   git clone https://github.com/aakritiinjapan/codeblooded.git
   cd codeblooded
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the core package:
   ```bash
   cd packages/core
   npm run build
   ```

4. Build the VS Code extension:
   ```bash
   cd packages/vscode-extension
   npm run compile
   # Or for production build
   npm run build
   ```

5. Run the extension in development:
   - Open `packages/vscode-extension` in VS Code
   - Press `F5` to launch Extension Development Host
   - Or use `Run > Start Debugging`

## 🎨 Complexity Mapping

CodeBlooded maps cyclomatic complexity to visual and audio feedback:

### Visual Indicators (Safe Mode & Horror Mode)

| Complexity | Level | Color | Decoration | Window Tint |
|------------|-------|-------|------------|-------------|
| 1-5 | 🟦 Low | Midnight Blue (#191970) | Calm marker | Blue tint |
| 6-10 | 🟪 Medium | Toxic Purple (#9400D3) | Warning marker | Purple tint |
| 11-15 | 🟧 High | Blood Orange (#CC5500) | Danger marker | Orange tint |
| 16+ | 🔴 Critical | Crimson Red (#DC143C) | Critical marker | Red tint |

### Audio Themes (Horror Mode Only)

| Theme | Trigger | Description |
|-------|---------|-------------|
| **Calm** | Low complexity, no errors | Ambient deep tones |
| **Warning** | Medium complexity or warnings | Unsettling undertones |
| **Danger** | High complexity or errors | Ominous crescendo |
| **Critical** | Critical complexity or many errors | Harsh, distorted soundscape |

### Horror Effect Intensity

- **Base**: 20% (minimum horror probability)
- **Escalation**: +5% every 5 minutes
- **Maximum**: 100% (guaranteed high-intensity effects)
- **Reset**: Returns to base on workspace change or manual reset

## 📚 Documentation

- [VS Code Extension README](./packages/vscode-extension/README.md) - Full feature list and commands
- [VS Code Marketplace Page](https://marketplace.visualstudio.com/items?itemName=AakritiHGupta.codeblooded-vscode) - Install and reviews
- [Core Package](./packages/core/README.md) - AST analysis engine API
- [Easter Eggs Guide](./EASTER_EGGS.md) - Hidden horror discoveries

## 🛠️ Development

### Project Structure

```
codeblooded/
├── packages/
│   ├── core/                          # Analysis Engine
│   │   ├── src/
│   │   │   ├── ast-analyzer/          # AST parsing (TS/JS/Python + C-style)
│   │   │   │   ├── ASTAnalyzer.ts     # Main coordinator
│   │   │   │   ├── TypeScriptParser.ts
│   │   │   │   ├── JavaScriptParser.ts
│   │   │   │   ├── PythonParser.ts
│   │   │   │   ├── CStyleParser.ts    # Java, C#, Go, Rust, C/C++, etc.
│   │   │   │   ├── ComplexityCalculator.ts
│   │   │   │   └── MetricsExtractor.ts
│   │   │   ├── audio-engine/          # Horror audio synthesis
│   │   │   ├── sensory-mapper/        # Complexity → visual/audio mapping
│   │   │   └── types/                 # Shared TypeScript types
│   │   └── package.json
│   │
│   └── vscode-extension/              # VS Code Integration
│       ├── src/
│       │   ├── extension.ts           # Extension entry point
│       │   ├── complexityAnalysisManager.ts  # Safe Mode analysis
│       │   ├── decorations.ts         # Function complexity markers
│       │   ├── themeManager.ts        # Window border tinting
│       │   ├── statusbar.ts           # Health score display
│       │   ├── diagnosticManager.ts   # Error/warning tracking
│       │   │
│       │   # Horror System
│       │   ├── horrorEngine.ts        # Central horror coordinator
│       │   ├── safetyManager.ts       # Panic button, safe mode
│       │   ├── audio/
│       │   │   ├── localAudioEngine.ts    # Browser audio via webview
│       │   │   └── webviewAudioEngine.ts
│       │   ├── horrorPopup.ts         # Jumpscare system
│       │   ├── screenDistortionManager.ts # Glitch effects
│       │   ├── entityPresenceManager.ts   # Watching eyes
│       │   ├── phantomTypingManager.ts    # Phantom text
│       │   ├── whisperingVariablesManager.ts
│       │   ├── bloodDripManager.ts
│       │   ├── heartbeatPulseManager.ts
│       │   ├── contextTriggerManager.ts   # Keyword triggers
│       │   ├── timeDilationManager.ts
│       │   ├── easterEggManager.ts
│       │   └── randomEventEngine.ts
│       │
│       ├── media/                     # Assets
│       │   ├── audio/                 # Horror sound effects
│       │   └── videos/                # Jumpscare videos
│       └── package.json
│
├── samples/                           # Test files
├── scripts/                           # Validation scripts
├── package.json                       # Monorepo config
└── tsconfig.json                      # Base TypeScript config
```

### Build & Development

```bash
# Build core library
cd packages/core
npm run build

# Build VS Code extension (development)
cd packages/vscode-extension
npm run compile

# Build VS Code extension (production)
cd packages/vscode-extension
npm run build              # Uses webpack

# Package extension for marketplace
cd packages/vscode-extension
npx vsce package           # Creates .vsix file

# Publish to marketplace
npx vsce publish
```

### Testing

The extension includes sample files in the `samples/` directory for testing:
- `low-complexity.ts` - Simple, clean code
- `medium-complexity.ts` - Moderate complexity
- `high-complexity.ts` - Complex nested logic
- `critical-complexity.ts` - Extreme complexity
- `python-example.py` - Python testing
- `javascript-examples.js` - JavaScript testing

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🎃 Why Horror?

Code complexity can be genuinely scary—spaghetti logic, mounting technical debt, cascading errors. CodeBlooded embraces this with a horror aesthetic that makes quality feedback visceral and memorable. Clean code keeps things calm. But let complexity creep in, and face the consequences: blood drips, watching eyes, phantom typing, and jumpscares that make you *feel* the weight of your decisions.

### Design Philosophy

The horror features are **opt-in entertainment** for developers who:
- Enjoy horror games and want tension in their coding sessions
- Respond better to memorable, emotional feedback than dry metrics
- Want to gamify code quality improvement
- Appreciate dark humor and unconventional dev tools

Key principles:
- **Unpredictability**: Randomized events create genuine surprise and tension
- **Progressive Escalation**: Intensity builds over time, mimicking real horror game pacing
- **Safety First**: Robust controls (`Ctrl+Alt+S` panic button, safe mode, accessibility compliance)
- **Reversible**: All phantom effects are temporary; your code is never harmed
- **Optional**: Disabled by default—works great as a standard complexity analyzer

**Bottom line**: Horror is optional. Safe Mode provides excellent code analysis without any scares.

## 🔗 Links

- **[VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=AakritiHGupta.codeblooded-vscode)** - Install the extension
- **[GitHub Repository](https://github.com/aakritiinjapan/codeblooded)** - Source code and issues
- **[Easter Eggs Guide](./EASTER_EGGS.md)** - Hidden horror discoveries

## ⚙️ Configuration

Key settings (accessible via VS Code settings):

```json
{
  // Safety & Core
  "codeblooded.horror.safeMode": true,              // Disable horror, keep analysis
  "codeblooded.horror.enabled": false,              // Enable horror features
  "codeblooded.horror.intensity": 50,               // Horror intensity (0-100)
  
  // Horror Feature Toggles
  "codeblooded.horror.enableJumpscares": true,
  "codeblooded.horror.enableScreenEffects": true,
  "codeblooded.horror.enablePhantomEvents": true,
  "codeblooded.horror.enableEntityPresence": true,
  "codeblooded.horror.enableEasterEggs": true,
  
  // Safety Controls
  "codeblooded.safety.panicButtonKey": "ctrl+alt+s",
  "codeblooded.safety.respectReduceMotion": true,
  "codeblooded.safety.maxFlashFrequency": 3,
  "codeblooded.safety.screenSharingMode": false,
  
  // Advanced
  "codeblooded.advanced.jumpscareCooldownMin": 30,  // Seconds
  "codeblooded.advanced.jumpscareCooldownMax": 120,
  "codeblooded.advanced.escalationRate": 5          // % per 5 minutes
}
```

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- AST parsing via [@typescript-eslint/parser](https://typescript-eslint.io/), [esprima](https://esprima.org/), and [Pyright](https://github.com/microsoft/pyright)
- Audio via Web Audio API
- Horror audio assets from [Freesound.org](https://freesound.org/) (see [CREDITS.md](./packages/vscode-extension/media/CREDITS.md))

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

**Made with 🩸 and 👁️ for Kiroween Hackathon 2024**

*"Where code complexity meets psychological terror"*
