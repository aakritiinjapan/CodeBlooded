# @codeblooded/core

> Core analysis engine for codeblooded - AST parsing, sensory mapping, audio synthesis, and visualization

The core package provides the foundational components for analyzing code complexity and translating it into multi-sensory feedback. It handles AST parsing, metric extraction, audio-visual mapping, and graph generation.

## Installation

```bash
npm install @codeblooded/core
```

## Quick Start

```typescript
import { ASTAnalyzer, SensoryMapper, AudioEngine, VisualizationEngine } from '@codeblooded/core';

// 1. Parse and analyze code
const analyzer = new ASTAnalyzer();
const code = `
function complexFunction(a, b, c) {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        return a + b + c;
      }
    }
  }
  return 0;
}
`;

const parseResult = await analyzer.parse(code, 'typescript');
const analysis = analyzer.analyze(parseResult);

// 2. Map to sensory outputs
const mapper = new SensoryMapper();
const themeMapping = mapper.mapToTheme(analysis.metrics.cyclomaticComplexity);

// 3. Play audio feedback
const audioEngine = new AudioEngine();
await audioEngine.initialize();
await audioEngine.play(themeMapping.audio);

// 4. Generate visualization
const vizEngine = new VisualizationEngine();
const graphData = vizEngine.generateGraph(analysis);
```

## API Reference

### ASTAnalyzer

Parses source code into Abstract Syntax Trees and extracts complexity metrics.

#### Methods

##### `parse(code: string, language: Language): Promise<ParseResult>`

Parses source code into an AST.

```typescript
const parseResult = await analyzer.parse(code, 'typescript');
// Returns: { ast, language, parseTime }
```

##### `analyze(parseResult: ParseResult): AnalysisResult`

Analyzes AST and extracts metrics.

```typescript
const analysis = analyzer.analyze(parseResult);
// Returns: { file, metrics, functions, dependencies }
```

#### Interfaces

```typescript
interface ParseResult {
  ast: any;                    // Language-specific AST
  language: Language;          // 'typescript' | 'javascript'
  parseTime: number;           // Parse duration in ms
}

interface AnalysisResult {
  file: string;                // File path
  metrics: CodeMetrics;        // Overall file metrics
  functions: FunctionMetric[]; // Per-function metrics
  dependencies: Dependency[];  // Import/call relationships
}

interface CodeMetrics {
  totalLines: number;          // Total lines including blank
  codeLines: number;           // Lines with code
  commentLines: number;        // Lines with comments
  cyclomaticComplexity: number;// Sum of all function complexities
  maintainabilityIndex: number;// 0-100 score
}

interface FunctionMetric {
  name: string;                // Function name
  startLine: number;           // Starting line number
  endLine: number;             // Ending line number
  cyclomaticComplexity: number;// Complexity score
  linesOfCode: number;         // Function LOC
  parameters: number;          // Parameter count
  nestingDepth: number;        // Max nesting level
}

interface Dependency {
  from: string;                // Source module
  to: string;                  // Target module
  type: 'import' | 'call' | 'inheritance';
}
```

### SensoryMapper

Translates code metrics into audio frequencies and visual colors.

#### Methods

##### `mapToAudio(complexity: number): AudioMapping`

Maps complexity to audio parameters.

```typescript
const audioMapping = mapper.mapToAudio(12);
// Returns: { frequency: 600, waveform: 'sawtooth', duration: 1000, volume: 0.7, effects: [...] }
```

##### `mapToVisual(complexity: number): VisualMapping`

Maps complexity to visual colors.

```typescript
const visualMapping = mapper.mapToVisual(12);
// Returns: { color: '#CC5500', backgroundColor: '#1C1C1C', textColor: '#FFFFFF', opacity: 0.8 }
```

##### `mapToTheme(complexity: number): ThemeMapping`

Maps complexity to complete theme (audio + visual + animations).

```typescript
const themeMapping = mapper.mapToTheme(12);
// Returns: { audio, visual, complexity: 'high', animations: [...] }
```

#### Interfaces

```typescript
interface AudioMapping {
  frequency: number;           // Hz (220-880+)
  waveform: WaveformType;      // 'sine' | 'triangle' | 'sawtooth' | 'square'
  duration: number;            // Milliseconds
  volume: number;              // 0-1
  effects: AudioEffect[];      // Applied effects
}

interface AudioEffect {
  type: 'distortion' | 'reverb' | 'delay' | 'tremolo';
  intensity: number;           // 0-1
}

interface VisualMapping {
  color: string;               // Hex color code
  backgroundColor: string;     // Background hex
  textColor: string;           // Text hex
  opacity: number;             // 0-1
}

interface ThemeMapping {
  audio: AudioMapping;
  visual: VisualMapping;
  complexity: ComplexityLevel; // 'low' | 'medium' | 'high' | 'critical'
  animations: Animation[];
}

interface Animation {
  type: 'pulse' | 'drip' | 'glow' | 'cobweb' | 'fog';
  duration: number;            // Milliseconds
  intensity: number;           // 0-1
}
```

### AudioEngine

Synthesizes audio feedback using Web Audio API.

#### Methods

##### `initialize(): Promise<void>`

Initializes the audio context.

```typescript
await audioEngine.initialize();
```

##### `play(mapping: AudioMapping): Promise<void>`

Plays audio based on mapping.

```typescript
await audioEngine.play(themeMapping.audio);
```

##### `stop(): void`

Stops all audio playback.

```typescript
audioEngine.stop();
```

##### `setVolume(volume: number): void`

Sets master volume (0-1).

```typescript
audioEngine.setVolume(0.5);
```

##### `enable(): void` / `disable(): void`

Enables or disables audio output.

```typescript
audioEngine.enable();
audioEngine.disable();
```

##### `isEnabled(): boolean`

Checks if audio is enabled.

```typescript
if (audioEngine.isEnabled()) {
  await audioEngine.play(mapping);
}
```

### VisualizationEngine

Generates D3.js-based force-directed graphs.

#### Methods

##### `generateGraph(analysis: AnalysisResult): GraphData`

Converts analysis results to graph data.

```typescript
const graphData = vizEngine.generateGraph(analysis);
// Returns: { nodes, edges, metadata }
```

##### `renderGraph(container: HTMLElement, data: GraphData): void`

Renders graph to DOM element.

```typescript
const container = document.getElementById('graph');
vizEngine.renderGraph(container, graphData);
```

##### `applyTheme(theme: ThemeMapping): void`

Applies horror theme styling.

```typescript
vizEngine.applyTheme(themeMapping);
```

##### `addAnimation(nodeId: string, animation: Animation): void`

Adds animation to specific node.

```typescript
vizEngine.addAnimation('function-123', {
  type: 'drip',
  duration: 2000,
  intensity: 0.8
});
```

#### Interfaces

```typescript
interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'function' | 'class' | 'module';
  metrics: CodeMetrics;
  complexity: ComplexityLevel;
  color: string;
  size: number;
  icon?: 'skull' | 'cobweb' | 'default';
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'import' | 'call' | 'inheritance';
  weight: number;
}

interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  averageComplexity: number;
  healthScore: number;         // 0-100
}
```

## Complexity Calculation

### Cyclomatic Complexity

codeblooded calculates cyclomatic complexity by counting decision points in the code:

**Decision Points:**
- `if` statements
- `else if` branches
- `while` loops
- `for` loops
- `do-while` loops
- `case` clauses in switch statements
- `&&` logical AND operators
- `||` logical OR operators
- `?` ternary operators
- `catch` blocks

**Formula:** `Complexity = 1 + number of decision points`

**Example:**

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

### Maintainability Index

Calculated using the formula:

```
MI = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
```

Where:
- `HV` = Halstead Volume
- `CC` = Cyclomatic Complexity
- `LOC` = Lines of Code

Normalized to 0-100 scale.

## Audio-Visual Mapping Rules

### Complexity Levels

| Complexity | Level | Description |
|------------|-------|-------------|
| 1-5 | Low | Simple, maintainable code |
| 6-10 | Medium | Moderate complexity, acceptable |
| 11-15 | High | Complex, consider refactoring |
| 16+ | Critical | Very complex, refactor immediately |

### Audio Mapping

| Level | Frequency Range | Waveform | Effects | Theme |
|-------|----------------|----------|---------|-------|
| Low | 220-330Hz | Sine | Reverb (low) | Deep ominous hum |
| Medium | 330-523Hz | Triangle | Tremolo | Eerie dissonant notes |
| High | 523-880Hz | Sawtooth | Distortion (medium) | Sharp piercing tones |
| Critical | 880Hz+ | Square | Distortion (high) | Harsh horror stingers |

**Special Audio Cues:**
- **Errors**: Tritone interval (e.g., 440Hz + 622Hz) - the "devil's interval"
- **Success**: Gothic organ chord (minor triad with added 7th)

### Visual Mapping

| Level | Color | Hex Code | Background |
|-------|-------|----------|------------|
| Low | Midnight Blue | #191970 | #1C1C1C (Eerie Black) |
| Medium | Toxic Purple | #9400D3 | #1C1C1C |
| High | Blood Orange | #CC5500 | #1C1C1C |
| Critical | Crimson Red | #DC143C | #1C1C1C |

### Horror Theme Effects

| Complexity | Visual Effects | Audio Effects |
|------------|---------------|---------------|
| High (11-15) | Cobweb SVG overlays | Sawtooth waveform |
| Critical (16+) | Blood drip animation, skull icons | Square wave with distortion |
| Errors | Ghostly glow with pulsing | Tritone interval |
| Background | Animated fog particles | - |

## Advanced Usage

### Custom Parser Registration

```typescript
import { ParserRegistry, ParserPlugin } from '@codeblooded/core';

const pythonParser: ParserPlugin = {
  language: 'python',
  extensions: ['.py'],
  parse: (code: string) => {
    // Custom parsing logic
    return ast;
  }
};

const registry = new ParserRegistry();
registry.register(pythonParser);
```

### Configuration

```typescript
import { CodeBloodedConfig } from '@codeblooded/core';

const config: CodeBloodedConfig = {
  audio: {
    enabled: true,
    volume: 0.7,
    waveform: 'sine'
  },
  visual: {
    theme: 'horror',
    animations: true
  },
  analysis: {
    threshold: 10,
    languages: ['typescript', 'javascript']
  }
};
```

### Health Score Calculation

The health score aggregates complexity metrics into a single 0-100 score:

```typescript
import { calculateHealthScore } from '@codeblooded/core';

const healthScore = calculateHealthScore(analysis);
// Returns: 0-100 (higher is better)
```

**Algorithm:**
1. Calculate average complexity per function
2. Weight by lines of code
3. Apply penalties for high complexity functions
4. Normalize to 0-100 scale

## Error Handling

```typescript
import { codebloodedError, ErrorCode } from '@codeblooded/core';

try {
  const result = await analyzer.parse(code, 'typescript');
} catch (error) {
  if (error instanceof codebloodedError) {
    switch (error.code) {
      case ErrorCode.PARSE_ERROR:
        console.error('Failed to parse code:', error.message);
        break;
      case ErrorCode.ANALYSIS_ERROR:
        console.error('Analysis failed:', error.message);
        break;
      case ErrorCode.AUDIO_ERROR:
        console.warn('Audio unavailable, continuing with visual only');
        break;
    }
  }
}
```

## Performance Considerations

- **Parse Time**: < 500ms for files under 1000 lines
- **Analysis Time**: < 200ms for typical files
- **Audio Synthesis**: < 100ms latency
- **Graph Rendering**: < 2s for 100 nodes

### Optimization Tips

1. **Debounce Analysis**: Wait 1 second after last keystroke before analyzing
2. **Cache Results**: Store analysis results for unchanged files
3. **Lazy Load Audio**: Initialize audio engine only when needed
4. **Limit Graph Size**: Cap nodes at 200 for performance

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires user gesture for audio)
- Node.js: Core analysis only (no audio/visual in headless mode)

## TypeScript Support

Full TypeScript definitions included. Import types:

```typescript
import type {
  AnalysisResult,
  CodeMetrics,
  FunctionMetric,
  AudioMapping,
  VisualMapping,
  ThemeMapping,
  GraphData
} from '@codeblooded/core';
```

## License

MIT

## Related Packages

- [@codeblooded/cli](../cli-analyzer/README.md) - Command-line analyzer
- [codeblooded-vscode](../vscode-extension/README.md) - VS Code extension
- [@codeblooded/lsp-server](../lsp-server/README.md) - LSP server

## Support

- [GitHub Issues](https://github.com/yourusername/codeblooded/issues)
- [Documentation](https://codeblooded.dev)
- [Discord Community](https://discord.gg/codeblooded)
