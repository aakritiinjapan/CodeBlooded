# codeblooded Design Document

## Overview

CodeBlooded is a multi-sensory code analysis framework built as a TypeScript/Node.js monorepo. The architecture follows a shared-core pattern where common analysis, mapping, audio, and visualization logic resides in a core package, consumed by three client implementations: VS Code Extension, CLI Analyzer, and LSP Server. The system processes source code through an AST analysis pipeline, extracts complexity metrics, maps them to sensory outputs (audio frequencies and visual colors), and presents results through horror-themed interfaces.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   VS Code    │  │     CLI      │  │  LSP Server  │      │
│  │  Extension   │  │   Analyzer   │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                      Core Package                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     AST      │  │   Sensory    │  │    Audio     │      │
│  │   Analyzer   │─▶│    Mapper    │─▶│    Engine    │      │
│  └──────────────┘  └──────┬───────┘  └──────────────┘      │
│                            │                                  │
│                    ┌───────▼───────┐                         │
│                    │ Visualization │                         │
│                    │    Engine     │                         │
│                    └───────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
codeblooded/
├── packages/
│   ├── core/                    # Shared analysis engine
│   │   ├── src/
│   │   │   ├── ast-analyzer/
│   │   │   ├── sensory-mapper/
│   │   │   ├── audio-engine/
│   │   │   ├── visualization/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── lsp-server/              # Language Server Protocol
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── handlers/
│   │   │   └── diagnostics.ts
│   │   └── package.json
│   ├── vscode-extension/        # VS Code client
│   │   ├── src/
│   │   │   ├── extension.ts
│   │   │   ├── webview/
│   │   │   ├── decorations.ts
│   │   │   └── statusbar.ts
│   │   ├── package.json
│   │   └── package.json (extension manifest)
│   └── cli-analyzer/            # Command-line tool
│       ├── src/
│       │   ├── cli.ts
│       │   ├── reporter.ts
│       │   └── exporter.ts
│       └── package.json
├── package.json                 # Root workspace config
├── tsconfig.json               # Base TypeScript config
└── lerna.json / pnpm-workspace.yaml
```

## Components and Interfaces

### 1. AST Analyzer

**Purpose**: Parse source code files into Abstract Syntax Trees and extract complexity metrics.

**Key Interfaces**:

```typescript
interface ASTAnalyzer {
  parse(code: string, language: Language): Promise<ParseResult>;
  analyze(ast: ParseResult): AnalysisResult;
}

interface ParseResult {
  ast: any;  // Language-specific AST
  language: Language;
  parseTime: number;
}

interface AnalysisResult {
  file: string;
  metrics: CodeMetrics;
  functions: FunctionMetric[];
  dependencies: Dependency[];
}

interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
}

interface FunctionMetric {
  name: string;
  startLine: number;
  endLine: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
  parameters: number;
  nestingDepth: number;
}

interface Dependency {
  from: string;
  to: string;
  type: 'import' | 'call' | 'inheritance';
}

enum Language {
  TypeScript = 'typescript',
  JavaScript = 'javascript',
  Unknown = 'unknown'
}
```

**Implementation Strategy**:
- Use `@typescript-eslint/parser` for TypeScript/TSX files
- Use `esprima` for JavaScript/JSX files
- Implement visitor pattern to traverse AST nodes
- Calculate cyclomatic complexity by counting decision points (if, while, for, case, &&, ||, ?, catch)
- Extract function boundaries and nesting levels
- Track import/require statements for dependency graph

**Parser Registry**:
```typescript
interface ParserPlugin {
  language: Language;
  extensions: string[];
  parse(code: string): any;
}

class ParserRegistry {
  private parsers: Map<Language, ParserPlugin>;
  
  register(plugin: ParserPlugin): void;
  getParser(language: Language): ParserPlugin;
  detectLanguage(filePath: string): Language;
}
```

### 2. Sensory Mapper

**Purpose**: Translate code metrics into audio frequencies and visual color representations following the horror theme.

**Key Interfaces**:

```typescript
interface SensoryMapper {
  mapToAudio(complexity: number): AudioMapping;
  mapToVisual(complexity: number): VisualMapping;
  mapToTheme(complexity: number): ThemeMapping;
}

interface AudioMapping {
  frequency: number;        // Hz
  waveform: WaveformType;
  duration: number;         // milliseconds
  volume: number;           // 0-1
  effects: AudioEffect[];
}

enum WaveformType {
  Sine = 'sine',
  Square = 'square',
  Sawtooth = 'sawtooth',
  Triangle = 'triangle'
}

interface AudioEffect {
  type: 'distortion' | 'reverb' | 'delay' | 'tremolo';
  intensity: number;
}

interface VisualMapping {
  color: string;            // Hex color
  backgroundColor: string;
  textColor: string;
  opacity: number;
}

interface ThemeMapping {
  audio: AudioMapping;
  visual: VisualMapping;
  complexity: ComplexityLevel;
  animations: Animation[];
}

enum ComplexityLevel {
  Low = 'low',           // 1-5
  Medium = 'medium',     // 6-10
  High = 'high',         // 11-15
  Critical = 'critical'  // 16+
}

interface Animation {
  type: 'pulse' | 'drip' | 'glow' | 'cobweb' | 'fog';
  duration: number;
  intensity: number;
}
```

**Mapping Rules**:

| Complexity | Level | Frequency | Color | Waveform | Effects |
|------------|-------|-----------|-------|----------|---------|
| 1-5 | Low | 220-330Hz | #191970 (Midnight Blue) | Sine | Reverb (low) |
| 6-10 | Medium | 330-523Hz | #9400D3 (Toxic Purple) | Triangle | Tremolo |
| 11-15 | High | 523-880Hz | #CC5500 (Blood Orange) | Sawtooth | Distortion (medium) |
| 16+ | Critical | 880Hz+ | #DC143C (Crimson Red) | Square | Distortion (high) |

**Special Cases**:
- Errors: Tritone interval (augmented 4th, e.g., 440Hz + 622Hz)
- Success: Gothic organ chord (minor triad with added 7th)

### 3. Audio Engine

**Purpose**: Synthesize audio feedback using Web Audio API based on mapped frequencies.

**Key Interfaces**:

```typescript
interface AudioEngine {
  initialize(): Promise<void>;
  play(mapping: AudioMapping): Promise<void>;
  stop(): void;
  setVolume(volume: number): void;
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
}

interface AudioContext {
  context: AudioContext;
  masterGain: GainNode;
  oscillators: Map<string, OscillatorNode>;
}
```

**Implementation Strategy**:
- Wrap Web Audio API for cross-platform compatibility
- Use `tone.js` for advanced synthesis and effects
- Implement oscillator pooling for performance
- Support simultaneous tones for chord synthesis
- Apply effects chain: Oscillator → Effects → Gain → Destination
- Implement fade-in/fade-out to prevent audio clicks
- Cache audio buffers for repeated patterns

**Audio Synthesis Pipeline**:
```
AudioMapping → Oscillator Creation → Effect Application → 
Gain Control → Audio Context Destination → Speaker Output
```

### 4. Visualization Engine

**Purpose**: Generate D3.js-based force-directed graphs and horror-themed visual effects.

**Key Interfaces**:

```typescript
interface VisualizationEngine {
  generateGraph(analysis: AnalysisResult): GraphData;
  renderGraph(container: HTMLElement, data: GraphData): void;
  applyTheme(theme: ThemeMapping): void;
  addAnimation(nodeId: string, animation: Animation): void;
}

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
  healthScore: number;
}
```

**D3.js Force Simulation Configuration**:
```typescript
const forceConfig = {
  charge: -300,              // Repulsion between nodes
  linkDistance: 100,         // Edge length
  centerForce: 0.1,         // Pull toward center
  collisionRadius: 30       // Prevent overlap
};
```

**Visual Effects Implementation**:
- **Cobweb Overlays**: SVG path elements with bezier curves, applied to nodes with complexity > 10
- **Blood Drip Animation**: CSS keyframe animation with transform translateY and opacity
- **Ghostly Glow**: SVG filter with feGaussianBlur and feMerge, animated with CSS
- **Skull Icons**: Custom SVG icons replacing circle nodes for critical complexity
- **Fog Effect**: Canvas-based particle system with perlin noise for movement

### 5. LSP Server

**Purpose**: Provide Language Server Protocol integration for IDE-agnostic support.

**Key Interfaces**:

```typescript
interface LSPServer {
  start(port: number): Promise<void>;
  onDidChangeTextDocument(handler: TextDocumentChangeHandler): void;
  sendDiagnostics(uri: string, diagnostics: Diagnostic[]): void;
  provideCodeActions(params: CodeActionParams): CodeAction[];
}

interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  message: string;
  source: 'codeblooded';
  code?: string;
}

interface CodeAction {
  title: string;
  kind: CodeActionKind;
  edit?: WorkspaceEdit;
  command?: Command;
}

enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4
}
```

**LSP Capabilities**:
- `textDocument/didChange`: Trigger analysis on file changes
- `textDocument/publishDiagnostics`: Send complexity warnings
- `textDocument/codeAction`: Suggest refactoring for high complexity
- Custom commands: `codeblooded.playAudio`, `codeblooded.showGraph`

**Diagnostic Mapping**:
- Complexity 1-5: No diagnostic
- Complexity 6-10: Information (blue)
- Complexity 11-15: Warning (yellow)
- Complexity 16+: Error (red)

### 6. VS Code Extension

**Purpose**: Provide real-time audio-visual feedback within VS Code editor.

**Key Components**:

```typescript
interface VSCodeExtension {
  activate(context: ExtensionContext): void;
  deactivate(): void;
}

interface DecorationManager {
  applyDecorations(editor: TextEditor, analysis: AnalysisResult): void;
  clearDecorations(editor: TextEditor): void;
}

interface WebviewManager {
  createPanel(): WebviewPanel;
  updateGraph(data: GraphData): void;
  dispose(): void;
}

interface StatusBarManager {
  updateHealthScore(score: number): void;
  updateAudioState(enabled: boolean): void;
  show(): void;
  hide(): void;
}
```

**Extension Activation Flow**:
1. Register commands (`codeblooded.toggleAudio`, `codeblooded.showGraph`)
2. Initialize core analyzer and audio engine
3. Set up document change listeners with debouncing (1000ms)
4. Create status bar items
5. Register decoration types for each complexity level

**Decoration Types**:
```typescript
const decorationTypes = {
  low: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(25, 25, 112, 0.2)',
    border: '1px solid #191970'
  }),
  medium: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(148, 0, 211, 0.2)',
    border: '1px solid #9400D3'
  }),
  high: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(204, 85, 0, 0.2)',
    border: '1px solid #CC5500'
  }),
  critical: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(220, 20, 60, 0.3)',
    border: '2px solid #DC143C',
    after: { contentText: ' ☠️' }
  })
};
```

**Webview Implementation**:
- HTML/CSS/JS bundle with D3.js included
- Message passing between extension and webview
- Responsive layout with horror theme styling
- Interactive graph with zoom/pan controls

### 7. CLI Analyzer

**Purpose**: Batch analysis tool for CI/CD integration and codebase-wide reports.

**Key Interfaces**:

```typescript
interface CLIAnalyzer {
  analyze(options: CLIOptions): Promise<CLIResult>;
}

interface CLIOptions {
  path: string;
  recursive: boolean;
  threshold?: number;
  outputFormat: 'html' | 'json' | 'text';
  outputPath?: string;
  exportAudio: boolean;
  audioPath?: string;
}

interface CLIResult {
  files: AnalysisResult[];
  summary: SummaryMetrics;
  exitCode: number;
}

interface SummaryMetrics {
  totalFiles: number;
  totalFunctions: number;
  averageComplexity: number;
  filesAboveThreshold: number;
  healthScore: number;
}
```

**CLI Commands**:
```bash
# Analyze single file
codeblooded analyze ./src/index.ts

# Analyze directory recursively
codeblooded analyze ./src --recursive

# Generate HTML report
codeblooded analyze ./src -r --output report.html

# Export audio signatures
codeblooded analyze ./src -r --export-audio --audio-path ./audio

# CI/CD mode with threshold
codeblooded analyze ./src -r --threshold 10 --format json
```

**HTML Report Structure**:
- Summary dashboard with aggregate metrics
- File list with sortable columns
- Embedded D3.js graph visualization
- Function-level detail view
- Horror-themed CSS styling
- Exportable as standalone HTML file

**Audio Export**:
- Generate WAV files using Web Audio API offline rendering
- One file per source file analyzed
- Filename: `{source-file-name}-signature.wav`
- Duration: 2-5 seconds based on complexity distribution
- Stereo output with panning based on code structure

## Data Models

### Core Data Flow

```
Source Code (string)
    ↓
ParseResult (AST + metadata)
    ↓
AnalysisResult (metrics + functions + dependencies)
    ↓
ThemeMapping (audio + visual + animations)
    ↓
Output (sound + colors + graph)
```

### Persistence

**Configuration Storage**:
```typescript
interface CodeBloodedConfig {
  audio: {
    enabled: boolean;
    volume: number;
    waveform: WaveformType;
  };
  visual: {
    theme: 'horror' | 'default';
    animations: boolean;
  };
  analysis: {
    threshold: number;
    languages: Language[];
  };
}
```

**Storage Locations**:
- VS Code: Extension global state
- CLI: `.codeblooded.json` in project root or user home
- LSP: Workspace configuration

## Error Handling

### Error Categories

1. **Parse Errors**: Invalid syntax, unsupported language
2. **Analysis Errors**: AST traversal failures, metric calculation errors
3. **Audio Errors**: Web Audio API unavailable, synthesis failures
4. **Visualization Errors**: D3.js rendering failures, DOM issues
5. **File System Errors**: File not found, permission denied

### Error Handling Strategy

```typescript
class codebloodedError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: any
  ) {
    super(message);
  }
}

enum ErrorCode {
  PARSE_ERROR = 'PARSE_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  AUDIO_ERROR = 'AUDIO_ERROR',
  VISUALIZATION_ERROR = 'VISUALIZATION_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR'
}
```

**Error Recovery**:
- Parse errors: Return partial analysis with error markers
- Audio errors: Gracefully degrade to visual-only mode
- Visualization errors: Fall back to text-based output
- File system errors: Skip file and continue with batch analysis

**User Feedback**:
- VS Code: Show error notifications with actionable messages
- CLI: Print errors to stderr with exit codes
- LSP: Send error diagnostics to client

## Testing Strategy

### Unit Tests

**Core Package**:
- AST Analyzer: Test parsing for various code patterns, complexity calculations
- Sensory Mapper: Verify frequency/color mappings for all complexity levels
- Audio Engine: Mock Web Audio API, test oscillator creation and effects
- Visualization Engine: Test graph data generation, node/edge creation

**Test Framework**: Jest with TypeScript support

**Coverage Target**: 80% line coverage for core package

### Integration Tests

**VS Code Extension**:
- Test extension activation and command registration
- Mock VS Code API for decoration and webview testing
- Test document change handling and debouncing

**CLI Analyzer**:
- Test file system traversal and batch analysis
- Test report generation (HTML, JSON)
- Test audio export functionality

**LSP Server**:
- Test LSP protocol message handling
- Test diagnostic generation and code actions
- Use `vscode-languageserver-protocol` test utilities

### End-to-End Tests

**Scenarios**:
1. Analyze sample TypeScript file → Verify audio/visual output
2. VS Code: Type code → Verify real-time feedback
3. CLI: Analyze project → Verify HTML report generation
4. LSP: Connect client → Verify diagnostics

**Test Data**:
- Sample code files with known complexity levels
- Edge cases: empty files, syntax errors, very large files

### Performance Tests

**Benchmarks**:
- Parse time for files of varying sizes (100, 1000, 10000 lines)
- Analysis time for projects of varying sizes (10, 100, 1000 files)
- Audio synthesis latency
- Graph rendering time for varying node counts

**Performance Targets**:
- Parse + analyze: < 500ms for 1000-line file
- Audio synthesis: < 100ms latency
- Graph rendering: < 2s for 100 nodes
- VS Code responsiveness: No UI blocking

## Dependencies

### Core Package
- `@typescript-eslint/parser`: ^6.0.0
- `esprima`: ^4.0.1
- `tone.js`: ^14.7.77
- `d3`: ^7.8.5

### LSP Server
- `vscode-languageserver`: ^9.0.0
- `vscode-languageserver-textdocument`: ^1.0.11

### VS Code Extension
- `vscode`: ^1.80.0 (engine)
- `@types/vscode`: ^1.80.0

### CLI Analyzer
- `commander`: ^11.0.0
- `chalk`: ^5.3.0
- `ora`: ^7.0.1

### Development
- `typescript`: ^5.2.0
- `jest`: ^29.6.0
- `@types/jest`: ^29.5.0
- `eslint`: ^8.47.0
- `prettier`: ^3.0.0
- `lerna` or `pnpm`: For monorepo management

## Deployment and Distribution

### VS Code Extension
- Package with `vsce`
- Publish to VS Code Marketplace
- Versioning: Semantic versioning (semver)

### CLI Tool
- Publish to npm as `@codeblooded/cli`
- Provide global installation: `npm install -g @codeblooded/cli`
- Binary distribution for major platforms

### LSP Server
- Publish to npm as `@codeblooded/lsp-server`
- Provide installation instructions for various editors

## Security Considerations

1. **Code Execution**: Never execute analyzed code, only parse AST
2. **File System Access**: Validate file paths, prevent directory traversal
3. **Audio Output**: Limit volume and frequency ranges to safe levels
4. **Dependencies**: Regular security audits with `npm audit`
5. **User Data**: No telemetry or data collection without explicit consent

## Future Enhancements

1. **Additional Languages**: Python, Java, C++, Rust support
2. **Machine Learning**: Predict complexity trends, suggest refactoring
3. **Collaborative Features**: Share sonic signatures, compare codebases
4. **Custom Themes**: User-defined color schemes and audio profiles
5. **Real-time Collaboration**: Multi-user analysis sessions
6. **IDE Plugins**: IntelliJ, Sublime Text, Atom support
