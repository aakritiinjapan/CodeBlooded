# codeblooded 🎨🔊

> Multi-sensory code analysis framework with horror-themed audio-visual feedback

codeblooded transforms code complexity metrics into an immersive sensory experience. As you write code, it analyzes complexity in real-time and provides audio-visual feedback through horror-themed colors, sounds, and animations. High complexity triggers ominous tones and crimson warnings, while clean code hums with calm, deep frequencies.

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

### Core Analysis Features

- **Real-time AST Analysis**: Parse TypeScript and JavaScript files, extract cyclomatic complexity, LOC metrics, and dependency graphs
- **Audio Feedback**: Frequency-mapped tones that change based on code complexity (220Hz-880Hz+)
- **Visual Feedback**: Horror-themed color coding (Midnight Blue → Toxic Purple → Blood Orange → Crimson Red)
- **Interactive Graphs**: D3.js force-directed visualizations of code structure with cobwebs, skulls, and fog effects
- **Multi-Platform**: VS Code extension, CLI tool, and LSP server for IDE-agnostic integration
- **CI/CD Ready**: Batch analysis with threshold checking and multiple export formats

### 🎃 Optional Horror Features (Opt-In)

**⚠️ Warning: These features contain disturbing content. See safety warnings above.**

- **Random Jumpscare System**: Unpredictable horror popups with 5+ unique variants and synchronized audio
- **Screen Distortion Effects**: Shake, glitch, VHS artifacts, and chromatic aberration during high complexity
- **Progressive Escalation**: Horror intensity gradually increases over coding sessions (20% → 100%)
- **Entity Presence**: Subtle "watching eyes" indicators that move and avoid your cursor
- **Phantom Typing**: Brief character insertions that appear and disappear (safely reversible)
- **Whispering Variables**: Variable names temporarily overlay with creepy alternatives
- **Context-Aware Triggers**: Special effects triggered by typing horror keywords ("kill", "dead", "error")
- **Time Dilation**: UI animations speed up or slow down during high intensity
- **Hidden Easter Eggs**: Secret horror elements to discover through exploration
- **Granular Controls**: Customize intensity (0-100) and enable/disable individual effect categories

## 🏗️ Architecture

codeblooded is organized as a monorepo with shared core functionality:

```
codeblooded/
├── packages/
│   ├── core/              # Shared analysis engine
│   ├── vscode-extension/  # VS Code integration
│   ├── cli-analyzer/      # Command-line tool
│   └── lsp-server/        # Language Server Protocol
```

### Component Overview

- **@codeblooded/core**: AST parsing, complexity calculation, sensory mapping, audio synthesis, and visualization
- **codeblooded-vscode**: Real-time feedback extension for VS Code
- **@codeblooded/cli**: Batch analyzer for CI/CD pipelines
- **@codeblooded/lsp-server**: LSP implementation for editor-agnostic support

## 🚀 Quick Start

### VS Code Extension

1. Install from VS Code Marketplace:
   ```
   ext install codeblooded.codeblooded-vscode
   ```

2. Open a TypeScript or JavaScript file

3. Start coding - audio and visual feedback activates automatically

4. **Optional**: Enable horror features in settings (`codeblooded.horror.enabled`)
   - ⚠️ **Read safety warnings above before enabling**
   - Horror features are **disabled by default** (Safe Mode)
   - Press `Ctrl+Alt+S` for instant panic button

5. Essential commands:
   - `codeblooded: Toggle Audio Feedback` - Enable/disable audio
   - `codeblooded: Show AST Graph` - Open interactive visualization
   - `codeblooded: Panic Button` - **Instantly disable all horror effects**
   - `codeblooded: Toggle Safe Mode` - Quick enable/disable horror features
   - `codeblooded: Show Horror Controls` - View all horror settings and controls

### CLI Analyzer

1. Install globally:
   ```bash
   npm install -g @codeblooded/cli
   ```

2. Analyze a file or directory:
   ```bash
   # Single file
   codeblooded analyze ./src/index.ts

   # Recursive directory analysis
   codeblooded analyze ./src --recursive

   # Generate HTML report
   codeblooded analyze ./src -r --output report.html

   # CI/CD mode with threshold
   codeblooded analyze ./src -r --threshold 10 --format json
   ```

3. Export audio signatures:
   ```bash
   codeblooded analyze ./src -r --export-audio --audio-path ./audio
   ```

## 📦 Installation

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

3. Build all packages:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Individual Packages

Install specific packages as needed:

```bash
# Core library (for programmatic use)
npm install @codeblooded/core

# CLI tool
npm install -g @codeblooded/cli

# LSP server
npm install -g @codeblooded/lsp-server
```

## 🎨 Complexity Mapping

codeblooded maps cyclomatic complexity to sensory outputs:

| Complexity | Level | Frequency | Color | Waveform | Theme |
|------------|-------|-----------|-------|----------|-------|
| 1-5 | Low | 220-330Hz | Midnight Blue (#191970) | Sine | Deep hum |
| 6-10 | Medium | 330-523Hz | Toxic Purple (#9400D3) | Triangle | Eerie notes |
| 11-15 | High | 523-880Hz | Blood Orange (#CC5500) | Sawtooth | Sharp tones |
| 16+ | Critical | 880Hz+ | Crimson Red (#DC143C) | Square | Harsh distortion |

### Special Audio Cues

- **Errors**: Tritone interval (augmented 4th) - the "devil's interval"
- **Success**: Gothic organ chord progression
- **Effects**: Reverb, tremolo, and distortion based on complexity

## 📚 Documentation

- [Core Package](./packages/core/README.md) - API reference and usage examples
- [VS Code Extension](./packages/vscode-extension/README.md) - Features and commands
- [CLI Analyzer](./packages/cli-analyzer/README.md) - Command reference and CI/CD integration
- [LSP Server](./packages/lsp-server/README.md) - Editor integration guide

## 🛠️ Development

### Project Structure

```
codeblooded/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── ast-analyzer/      # AST parsing and metrics
│   │   │   ├── sensory-mapper/    # Complexity → audio/visual
│   │   │   ├── audio-engine/      # Web Audio API synthesis
│   │   │   ├── visualization/     # D3.js graph generation
│   │   │   └── types/             # TypeScript interfaces
│   │   └── package.json
│   ├── vscode-extension/
│   │   ├── src/
│   │   │   ├── extension.ts       # Extension entry point
│   │   │   ├── decorations.ts     # Color-coded highlighting
│   │   │   ├── statusbar.ts       # Health score display
│   │   │   └── webview/           # Graph visualization UI
│   │   └── package.json
│   ├── cli-analyzer/
│   │   ├── src/
│   │   │   ├── cli.ts             # Command-line interface
│   │   │   ├── reporter.ts        # HTML/JSON report generation
│   │   │   └── exporter.ts        # Audio signature export
│   │   └── package.json
│   └── lsp-server/
│       ├── src/
│       │   ├── server.ts          # LSP server implementation
│       │   ├── handlers/          # LSP message handlers
│       │   └── diagnostics.ts     # Diagnostic generation
│       └── package.json
├── package.json                    # Root workspace config
└── tsconfig.json                   # Base TypeScript config
```

### Build Scripts

```bash
# Build all packages
npm run build

# Watch mode for development
npm run build -- --watch

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=@codeblooded/core

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

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

## 🎃 Why Horror Theme?

Code complexity can be scary. codeblooded embraces this with a horror aesthetic that makes quality feedback memorable and engaging. High complexity triggers visceral responses - crimson warnings, distorted audio, skull icons - that motivate developers to refactor. It's code review meets haunted house.

### Horror Features Philosophy

The optional psychological horror features are designed as an **opt-in entertainment experience** for developers who enjoy horror games and want to add tension to their coding sessions. These features:

- Create **genuine unease** through unpredictability and randomization
- Build **progressive tension** that escalates over time
- Provide **memorable feedback** that motivates code quality improvement
- Include **robust safety controls** for user protection
- Respect **accessibility needs** and user preferences

**Important**: Horror features are entirely optional and disabled by default. codeblooded works perfectly as a standard code analysis tool without any horror elements.

## 🔗 Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=codeblooded.codeblooded-vscode)
- [npm - Core](https://www.npmjs.com/package/@codeblooded/core)
- [npm - CLI](https://www.npmjs.com/package/@codeblooded/cli)
- [npm - LSP Server](https://www.npmjs.com/package/@codeblooded/lsp-server)
- [Documentation](https://codeblooded.dev)
- [GitHub Issues](https://github.com/aakritiinjapan/codeblooded/issues)

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Audio synthesis powered by [Tone.js](https://tonejs.github.io/)
- Visualizations created with [D3.js](https://d3js.org/)
- AST parsing via [@typescript-eslint/parser](https://typescript-eslint.io/) and [esprima](https://esprima.org/)

---

**Made with 🎃 by the codeblooded team**
