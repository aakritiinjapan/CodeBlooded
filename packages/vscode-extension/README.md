# CodeChroma for VS Code 🎨🔊

> Multi-sensory code analysis with horror-themed audio-visual feedback

Transform your coding experience with real-time complexity feedback. CodeChroma analyzes your code as you type and provides immersive audio-visual cues - from calm deep hums for clean code to harsh distorted tones and crimson warnings for complex functions.

## Features

### 🎵 Real-Time Audio Feedback

Hear your code's complexity through frequency-mapped tones:
- **Low Complexity (1-5)**: Deep ominous hum (220-330Hz, sine wave)
- **Medium Complexity (6-10)**: Eerie dissonant notes (330-523Hz, triangle wave)
- **High Complexity (11-15)**: Sharp piercing tones (523-880Hz, sawtooth wave)
- **Critical Complexity (16+)**: Harsh horror stingers (880Hz+, square wave with distortion)

Audio plays automatically after you stop typing (1 second debounce).

### 🎨 Color-Coded Highlighting

Visual feedback overlays directly in your editor:
- **Midnight Blue (#191970)**: Low complexity - all good
- **Toxic Purple (#9400D3)**: Medium complexity - acceptable
- **Blood Orange (#CC5500)**: High complexity - consider refactoring
- **Crimson Red (#DC143C)**: Critical complexity - refactor immediately ☠️

Functions with critical complexity get a skull emoji indicator.

### 📊 Interactive AST Graph

Visualize your code structure with a D3.js force-directed graph:
- Nodes represent files, functions, and classes
- Edges show dependencies (imports, calls, inheritance)
- Node size reflects lines of code
- Node color indicates complexity level
- Horror-themed effects: cobwebs, skulls, blood drips, and animated fog

### 📈 Health Score

Status bar displays an overall code quality score (0-100):
- **90-100**: Excellent - clean, maintainable code
- **70-89**: Good - minor improvements possible
- **50-69**: Fair - refactoring recommended
- **Below 50**: Poor - significant refactoring needed

### 🎃 Horror Theme

Embrace the spooky aesthetic:
- Cobweb overlays on high complexity nodes
- Blood drip animations for critical code
- Ghostly glow effects for errors
- Skull icons replacing critical complexity indicators
- Animated fog particles in the background
- Tritone intervals (the "devil's interval") for errors
- Gothic organ chords for successful refactoring

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Type: `ext install codechroma.codechroma-vscode`
4. Press Enter

### From VSIX File

1. Download the `.vsix` file from [releases](https://github.com/yourusername/codechroma/releases)
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click `...` menu → `Install from VSIX...`
5. Select the downloaded file

## Quick Start

1. **Open a TypeScript or JavaScript file**
   - Extension activates automatically for `.ts`, `.tsx`, `.js`, `.jsx` files

2. **Start coding**
   - Audio and visual feedback activates as you type
   - Decorations appear after 1 second of inactivity

3. **View the AST graph**
   - Run command: `CodeChroma: Show AST Graph`
   - Or click the graph icon in the status bar

4. **Toggle audio**
   - Run command: `CodeChroma: Toggle Audio Feedback`
   - Or click the audio icon in the status bar

## Commands

Access commands via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

| Command | Description | Keyboard Shortcut |
|---------|-------------|-------------------|
| `CodeChroma: Toggle Audio Feedback` | Enable/disable audio playback | - |
| `CodeChroma: Show AST Graph` | Open interactive graph visualization | - |

## Configuration

Configure CodeChroma via VS Code settings (`Ctrl+,` or `Cmd+,`):

### Audio Settings

```json
{
  "codechroma.audio.enabled": true,
  "codechroma.audio.volume": 0.5
}
```

- **`codechroma.audio.enabled`** (boolean, default: `true`)
  - Enable or disable audio feedback globally

- **`codechroma.audio.volume`** (number, default: `0.5`)
  - Master volume level (0.0 - 1.0)

### Visual Settings

```json
{
  "codechroma.visual.animations": true
}
```

- **`codechroma.visual.animations`** (boolean, default: `true`)
  - Enable or disable horror-themed animations (cobwebs, blood drips, fog)

### Analysis Settings

```json
{
  "codechroma.analysis.threshold": 10
}
```

- **`codechroma.analysis.threshold`** (number, default: `10`)
  - Complexity threshold for warnings
  - Functions above this value trigger warnings

## Status Bar

CodeChroma adds two status bar items:

### Health Score Indicator
- **Location**: Left side of status bar
- **Format**: `🎨 Health: 85`
- **Click**: Shows detailed metrics in output panel

### Audio State Indicator
- **Location**: Right side of status bar
- **Format**: `🔊` (enabled) or `🔇` (disabled)
- **Click**: Toggles audio on/off

## Screenshots

### Color-Coded Highlighting

![Color-coded highlighting showing complexity levels](./images/highlighting.png)

*Functions highlighted by complexity: blue (low), purple (medium), orange (high), red (critical)*

### Interactive AST Graph

![Interactive force-directed graph with horror theme](./images/graph.png)

*D3.js visualization with cobwebs, skulls, and fog effects*

### Status Bar Integration

![Status bar showing health score and audio state](./images/statusbar.png)

*Health score and audio toggle in VS Code status bar*

### Webview Panel

![Webview panel with full graph visualization](./images/webview.png)

*Full-screen graph view with interactive controls*

## How It Works

### Analysis Pipeline

```
Code Change → Debounce (1s) → AST Parse → Complexity Analysis →
Sensory Mapping → Audio Synthesis + Visual Decorations
```

### Complexity Calculation

CodeChroma calculates **cyclomatic complexity** by counting decision points:

```typescript
function example(a, b) {
  if (a > 0) {           // +1
    if (b > 0) {         // +1
      return a + b;
    } else {             // +1
      return a;
    }
  } else if (a < 0) {    // +1
    return -a;
  }
  return 0;
}
// Cyclomatic Complexity = 1 + 4 = 5 (Low)
```

**Decision Points:**
- `if`, `else if`, `else`
- `while`, `for`, `do-while`
- `case` in switch statements
- `&&`, `||` logical operators
- `?` ternary operators
- `catch` blocks

### Audio Synthesis

Uses Web Audio API with Tone.js for advanced synthesis:

1. **Oscillator Creation**: Generate base frequency based on complexity
2. **Waveform Selection**: Sine → Triangle → Sawtooth → Square
3. **Effect Chain**: Apply reverb, tremolo, or distortion
4. **Playback**: Fade in/out to prevent audio clicks

### Visual Rendering

D3.js force-directed graph with custom styling:

1. **Node Generation**: Create nodes for files, functions, classes
2. **Edge Generation**: Connect nodes based on dependencies
3. **Force Simulation**: Apply physics for organic layout
4. **Theme Application**: Add horror effects (cobwebs, skulls, fog)
5. **Interaction**: Enable zoom, pan, hover, and click

## Supported Languages

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)

Additional language support coming soon!

## Performance

- **Parse Time**: < 500ms for files under 1000 lines
- **Analysis Time**: < 200ms for typical files
- **Audio Latency**: < 100ms
- **UI Responsiveness**: No blocking, all analysis runs asynchronously

### Performance Tips

1. **Disable animations** for large files: Set `codechroma.visual.animations` to `false`
2. **Adjust debounce**: Extension waits 1 second after typing before analyzing
3. **Disable audio** in noisy environments: Use toggle command or status bar icon

## Troubleshooting

### Audio Not Playing

**Issue**: No sound when typing code

**Solutions**:
1. Check audio is enabled: Click status bar icon or run toggle command
2. Check system volume: Ensure speakers/headphones are working
3. Check browser audio permissions: Some environments require user gesture
4. Restart VS Code: Reload window with `Developer: Reload Window`

### Decorations Not Appearing

**Issue**: No color highlighting in editor

**Solutions**:
1. Ensure file is TypeScript or JavaScript
2. Check for syntax errors: Extension skips files with parse errors
3. Wait 1 second after typing: Debounce delay before analysis
4. Check extension is activated: Look for status bar items

### Graph Not Rendering

**Issue**: Webview panel is blank or shows errors

**Solutions**:
1. Check browser console: Open `Developer: Toggle Developer Tools`
2. Reload webview: Close and reopen with `Show AST Graph` command
3. Check file has dependencies: Graph requires imports/calls to show edges
4. Update VS Code: Ensure you're on version 1.80.0 or higher

### High CPU Usage

**Issue**: VS Code becomes slow or unresponsive

**Solutions**:
1. Disable animations: Set `codechroma.visual.animations` to `false`
2. Increase threshold: Set `codechroma.analysis.threshold` higher to reduce warnings
3. Close graph webview: Visualization can be resource-intensive
4. Analyze smaller files: Split large files into smaller modules

## Privacy

CodeChroma runs entirely locally. No code or data is sent to external servers.

- **No telemetry**: We don't collect usage data
- **No network requests**: All analysis happens on your machine
- **No code storage**: Code is analyzed in memory only

## Known Issues

- Safari-based environments may require user gesture before audio plays
- Very large files (>5000 lines) may experience slower analysis
- Graph rendering with >200 nodes can be slow

See [GitHub Issues](https://github.com/yourusername/codechroma/issues) for full list.

## Roadmap

- [ ] Python, Java, C++ language support
- [ ] Custom theme editor
- [ ] Collaborative analysis sessions
- [ ] Machine learning-based refactoring suggestions
- [ ] Export analysis reports
- [ ] Integration with GitHub Actions

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Feedback

- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/codechroma/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/codechroma/discussions)
- **Questions**: [Discord Community](https://discord.gg/codechroma)

## License

MIT - see [LICENSE](../../LICENSE) for details

## Related

- [@codechroma/core](../core/README.md) - Core analysis engine
- [@codechroma/cli](../cli-analyzer/README.md) - Command-line tool
- [@codechroma/lsp-server](../lsp-server/README.md) - LSP server

---

**Made with 🎃 by the CodeChroma team**

*Embrace the horror of complex code*
