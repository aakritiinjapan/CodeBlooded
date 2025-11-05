# CodeChroma 🎨🔊

> Multi-sensory code analysis framework with horror-themed audio-visual feedback

CodeChroma transforms code complexity metrics into an immersive sensory experience. As you write code, it analyzes complexity in real-time and provides audio-visual feedback through horror-themed colors, sounds, and animations. High complexity triggers ominous tones and crimson warnings, while clean code hums with calm, deep frequencies.

## 🎯 Features

- **Real-time AST Analysis**: Parse TypeScript and JavaScript files, extract cyclomatic complexity, LOC metrics, and dependency graphs
- **Audio Feedback**: Frequency-mapped tones that change based on code complexity (220Hz-880Hz+)
- **Visual Feedback**: Horror-themed color coding (Midnight Blue → Toxic Purple → Blood Orange → Crimson Red)
- **Interactive Graphs**: D3.js force-directed visualizations of code structure with cobwebs, skulls, and fog effects
- **Multi-Platform**: VS Code extension, CLI tool, and LSP server for IDE-agnostic integration
- **CI/CD Ready**: Batch analysis with threshold checking and multiple export formats

## 🏗️ Architecture

CodeChroma is organized as a monorepo with shared core functionality:

```
codechroma/
├── packages/
│   ├── core/              # Shared analysis engine
│   ├── vscode-extension/  # VS Code integration
│   ├── cli-analyzer/      # Command-line tool
│   └── lsp-server/        # Language Server Protocol
```

### Component Overview

- **@codechroma/core**: AST parsing, complexity calculation, sensory mapping, audio synthesis, and visualization
- **codechroma-vscode**: Real-time feedback extension for VS Code
- **@codechroma/cli**: Batch analyzer for CI/CD pipelines
- **@codechroma/lsp-server**: LSP implementation for editor-agnostic support

## 🚀 Quick Start

### VS Code Extension

1. Install from VS Code Marketplace:
   ```
   ext install codechroma.codechroma-vscode
   ```

2. Open a TypeScript or JavaScript file

3. Start coding - audio and visual feedback activates automatically

4. Use commands:
   - `CodeChroma: Toggle Audio Feedback` - Enable/disable audio
   - `CodeChroma: Show AST Graph` - Open interactive visualization

### CLI Analyzer

1. Install globally:
   ```bash
   npm install -g @codechroma/cli
   ```

2. Analyze a file or directory:
   ```bash
   # Single file
   codechroma analyze ./src/index.ts

   # Recursive directory analysis
   codechroma analyze ./src --recursive

   # Generate HTML report
   codechroma analyze ./src -r --output report.html

   # CI/CD mode with threshold
   codechroma analyze ./src -r --threshold 10 --format json
   ```

3. Export audio signatures:
   ```bash
   codechroma analyze ./src -r --export-audio --audio-path ./audio
   ```

## 📦 Installation

### For Development

1. Clone the repository:
   ```bash
   git clone https://github.com/aakritiinjapan/codechroma.git
   cd codechroma
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
npm install @codechroma/core

# CLI tool
npm install -g @codechroma/cli

# LSP server
npm install -g @codechroma/lsp-server
```

## 🎨 Complexity Mapping

CodeChroma maps cyclomatic complexity to sensory outputs:

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
codechroma/
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
npm test --workspace=@codechroma/core

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

Code complexity can be scary. CodeChroma embraces this with a horror aesthetic that makes quality feedback memorable and engaging. High complexity triggers visceral responses - crimson warnings, distorted audio, skull icons - that motivate developers to refactor. It's code review meets haunted house.

## 🔗 Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=codechroma.codechroma-vscode)
- [npm - Core](https://www.npmjs.com/package/@codechroma/core)
- [npm - CLI](https://www.npmjs.com/package/@codechroma/cli)
- [npm - LSP Server](https://www.npmjs.com/package/@codechroma/lsp-server)
- [Documentation](https://codechroma.dev)
- [GitHub Issues](https://github.com/aakritiinjapan/codechroma/issues)

## 🙏 Acknowledgments

- Built with [TypeScript](https://www.typescriptlang.org/)
- Audio synthesis powered by [Tone.js](https://tonejs.github.io/)
- Visualizations created with [D3.js](https://d3js.org/)
- AST parsing via [@typescript-eslint/parser](https://typescript-eslint.io/) and [esprima](https://esprima.org/)

---

**Made with 🎃 by the CodeChroma team**
