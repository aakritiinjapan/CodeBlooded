# 🩸 CodeBlooded for VS Code

> **Are you brave enough?** Your IDE will never feel safe again.

Transform your coding environment into a psychological horror experience where your code complexity literally haunts you. The deeper your code's complexity, the more intense the nightmare becomes.

*Phantom keystrokes type themselves. Your variables whisper secrets. The screen warps and distorts. And when you least expect it... something appears.*

💡 **Best experienced in VS Code Dark Mode for maximum immersion!**

---

## 🎮 Two Modes of Experience

### 🌙 Safe Mode (Default)
Perfect for those who want feedback without the frights:
- **Color-coded complexity** highlighting (Blue → Purple → Orange → Red)
- **Audio tones** that reflect your code quality
- **Visual graphs** showing code structure
- **Health Score** in status bar
- **No horror effects** - just clean, useful feedback

### ☠️ Horror Mode (Opt-In)
For the brave souls who dare to enable `codeblooded.horror.enabled`:
- **Everything in Safe Mode, PLUS...**
- **Jumpscares** with synchronized audio (6 unique variants!)
- **Screen distortions** (VHS, glitch, chromatic aberration, screen shake)
- **Phantom typing** that writes itself ("help me", "run", "it sees you")
- **Whispering variables** with creepy overlays
- **Entity presence** - eyes watching from the gutter
- **Progressive escalation** - it gets worse the longer you code
- **Easter eggs** - discover hidden horrors

---

## ⚠️ IMPORTANT SAFETY WARNING ⚠️

**CodeBlooded contains optional psychological horror features including:**
- Flashing lights and rapid visual changes
- Jump scares with disturbing imagery  
- Unsettling audio effects
- Unpredictable horror events

**NOT RECOMMENDED for users with:**
- Photosensitive epilepsy or seizure disorders
- Anxiety disorders or PTSD
- Heart conditions sensitive to sudden stress
- Preference for calm coding environments

**SAFETY FEATURES:**
- **Panic Button**: Press `Ctrl+Alt+S` (or `Cmd+Alt+S` on Mac) to instantly disable all horror effects
- **Safe Mode**: Horror features are DISABLED by default - you must explicitly opt-in
- **Accessibility**: Automatically respects "Reduce Motion" and other accessibility settings
- **First-Run Warning**: You'll see a detailed warning before any horror features activate

See [SAFETY_FEATURES.md](./SAFETY_FEATURES.md) for complete safety documentation.

---

## Features

### 🎵 Real-Time Audio Feedback

Hear your code's complexity through horror-themed audio:
- **Low Complexity (1-5)**: Deep calm hum - all good
- **Medium Complexity (6-10)**: Eerie dissonant notes - acceptable
- **High Complexity (11-15)**: Sharp tension tones - consider refactoring
- **Critical Complexity (16+)**: Harsh distorted chaos - refactor now!

Audio plays automatically after you stop typing (1 second debounce).

### 🎨 Color-Coded Highlighting

Visual feedback overlays directly in your editor:
- **Midnight Blue (#191970)**: Low complexity - all good
- **Toxic Purple (#9400D3)**: Medium complexity - acceptable
- **Blood Orange (#CC5500)**: High complexity - consider refactoring
- **Crimson Red (#DC143C)**: Critical complexity - refactor immediately

### 📈 Health Score

Status bar displays an overall code quality score (0-100):
- **90-100**: Excellent - clean, maintainable code
- **70-89**: Good - minor improvements possible
- **50-69**: Fair - refactoring recommended
- **Below 50**: Poor - significant refactoring needed

### 🎃 Horror Effects (When Enabled)

When you enable Horror Mode, experience:
- **Screen distortions**: VHS artifacts, glitch effects, chromatic aberration
- **Phantom typing**: Brief messages appear and vanish
- **Whispering variables**: Names overlay with creepy alternatives
- **Entity presence**: Eyes appear in the editor gutter
- **Jumpscares**: Full-screen horror with audio (you've been warned)

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Type: `ext install AakritiHGupta.codeblooded-vscode`
4. Press Enter

### From VSIX File

1. Download the `.vsix` file from [releases](https://github.com/aakritiinjapan/CodeBlooded/releases)
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click `...` menu → `Install from VSIX...`
5. Select the downloaded file

## Quick Start

1. **Open a supported file**
   - Extension activates automatically for `.ts`, `.tsx`, `.js`, `.jsx`, `.py` files

2. **Start coding**
   - Audio and visual feedback activates as you type
   - Decorations appear after 1 second of inactivity

3. **View the AST graph**
   - Run command: `CodeBlooded: Show AST Graph`
   - Or click the graph icon in the status bar

4. **Toggle audio**
   - Run command: `CodeBlooded: Toggle Audio Feedback`
   - Or click the audio icon in the status bar

## Commands

Access commands via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

| Command | Description | Keyboard Shortcut |
|---------|-------------|-------------------|
| `CodeBlooded: Panic Button` | **EMERGENCY**: Instantly disable all horror effects | `Ctrl+Alt+S` |
| `CodeBlooded: Toggle Safe Mode` | Enable/disable horror features | - |
| `CodeBlooded: Toggle Audio Feedback` | Enable/disable audio playback | - |
| `CodeBlooded: Show AST Graph` | Open interactive graph visualization | - |

## Configuration

Configure CodeBlooded via VS Code settings (`Ctrl+,` or `Cmd+,`):

### Safety Settings

```json
{
  "codeblooded.horror.enabled": false,
  "codeblooded.horror.intensity": 50,
  "codeblooded.safety.screenSharingMode": false,
  "codeblooded.safety.respectReduceMotion": true
}
```

- **`codeblooded.horror.enabled`** (boolean, default: `false`)
  - ⚠️ Enable psychological horror features (jumpscares, random events)
  - **DISABLED by default for safety**

- **`codeblooded.horror.intensity`** (number, default: `50`)
  - Horror intensity level (0-100)
  - Higher values = more frequent and intense effects

- **`codeblooded.safety.screenSharingMode`** (boolean, default: `false`)
  - Enable when screen sharing to auto-disable horror effects

- **`codeblooded.safety.respectReduceMotion`** (boolean, default: `true`)
  - Respect system "Reduce Motion" accessibility setting

### Audio Settings

```json
{
  "codeblooded.audio.enabled": true,
  "codeblooded.audio.volume": 0.5
}
```

- **`codeblooded.audio.enabled`** (boolean, default: `true`)
  - Enable or disable audio feedback globally

- **`codeblooded.audio.volume`** (number, default: `0.5`)
  - Master volume level (0.0 - 1.0)

### Visual Settings

```json
{
  "codeblooded.visual.animations": true,
  "codeblooded.visual.workspaceTint": true
}
```

- **`codeblooded.visual.animations`** (boolean, default: `true`)
  - Enable or disable horror-themed animations (cobwebs, blood drips, fog)

- **`codeblooded.visual.workspaceTint`** (boolean, default: `true`)
  - Tint the entire workbench with horror palette as complexity increases

### Analysis Settings

```json
{
  "codeblooded.analysis.threshold": 10
}
```

- **`codeblooded.analysis.threshold`** (number, default: `10`)
  - Complexity threshold for warnings
  - Functions above this value trigger warnings

## Status Bar

CodeBlooded adds two status bar items:

### Health Score Indicator
- **Location**: Left side of status bar
- **Format**: `🎨 Health: 85`
- **Click**: Shows detailed metrics in output panel

### Audio State Indicator
- **Location**: Right side of status bar
- **Format**: `🔊` (enabled) or `🔇` (disabled)
- **Click**: Toggles audio on/off



## How It Works

### Analysis Pipeline

```
Code Change → Debounce (1s) → AST Parse → Complexity Analysis →
Sensory Mapping → Audio Synthesis + Visual Decorations
```

### Complexity Calculation

CodeBlooded calculates **cyclomatic complexity** by counting decision points:

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

**Full Complexity Analysis:**
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Python (`.py`)

**Basic Support (syntax highlighting, decorations):**
- Java, C#, Go, Rust, C/C++, PHP, Ruby, Swift, Kotlin, Scala
- HTML, CSS, SCSS, LESS

*More languages with full AST analysis coming soon!*

## Performance

- **Parse Time**: < 500ms for files under 1000 lines
- **Analysis Time**: < 200ms for typical files
- **Audio Latency**: < 100ms
- **UI Responsiveness**: No blocking, all analysis runs asynchronously

### Performance Tips

1. **Disable animations** for large files: Set `codeblooded.visual.animations` to `false`
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
1. Ensure file is TypeScript, JavaScript, or Python
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
1. Disable animations: Set `codeblooded.visual.animations` to `false`
2. Increase threshold: Set `codeblooded.analysis.threshold` higher to reduce warnings
3. Close graph webview: Visualization can be resource-intensive
4. Analyze smaller files: Split large files into smaller modules

## Privacy

CodeBlooded runs entirely locally. No code or data is sent to external servers.

- **No telemetry**: We don't collect usage data
- **No network requests**: All analysis happens on your machine
- **No code storage**: Code is analyzed in memory only

## Known Issues

- Safari-based environments may require user gesture before audio plays
- Very large files (>5000 lines) may experience slower analysis
- Graph rendering with >200 nodes can be slow

See [GitHub Issues](https://github.com/aakritiinjapan/CodeBlooded/issues) for full list.

## Roadmap

- [x] Python language support ✓
- [ ] Java, C++ full AST analysis
- [ ] Custom theme editor
- [ ] Export analysis reports
- [ ] Integration with GitHub Actions

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Feedback

- **Bug Reports**: [GitHub Issues](https://github.com/aakritiinjapan/CodeBlooded/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/aakritiinjapan/CodeBlooded/issues)

## License

MIT - see [LICENSE](./LICENSE) for details

## Related

- [@codeblooded/core](../core/README.md) - Core complexity analysis engine

---

**Made with 🩸 by the CodeBlooded team**

*Embrace the horror of complex code*
