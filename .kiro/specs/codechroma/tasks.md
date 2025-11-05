# Implementation Plan

- [x] 1. Set up monorepo structure and core package foundation





  - Create root package.json with workspace configuration (pnpm or lerna)
  - Set up TypeScript configuration with path aliases for cross-package imports
  - Create packages/core directory with initial package.json and tsconfig.json
  - Configure ESLint and Prettier for consistent code style
  - Set up Jest testing framework with TypeScript support
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 2. Implement AST Analyzer core functionality







  - [x] 2.1 Create TypeScript interfaces for AST analysis

    - Define ParseResult, AnalysisResult, CodeMetrics, FunctionMetric, and Dependency interfaces
    - Define Language enum and ParserPlugin interface
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 2.2 Implement ParserRegistry with plugin architecture


    - Create ParserRegistry class with register/getParser/detectLanguage methods
    - Implement language detection based on file extensions
    - _Requirements: 8.4, 8.5_
  - [x] 2.3 Implement TypeScript parser using @typescript-eslint/parser


    - Create TypeScriptParser plugin that parses .ts and .tsx files
    - Implement AST traversal using visitor pattern
    - _Requirements: 1.1, 1.2, 8.1_
  - [x] 2.4 Implement JavaScript parser using esprima


    - Create JavaScriptParser plugin that parses .js and .jsx files
    - Handle ES6+ syntax and JSX
    - _Requirements: 8.2_
  - [x] 2.5 Implement cyclomatic complexity calculation


    - Traverse AST nodes counting decision points (if, while, for, case, &&, ||, ?, catch)
    - Calculate complexity per function and aggregate for file
    - _Requirements: 1.2_
  - [x] 2.6 Implement lines of code and dependency extraction


    - Count total lines, code lines, and comment lines
    - Extract import/require statements and function calls for dependency graph
    - _Requirements: 1.3, 1.4_
  - [ ]  2.7 Write unit tests for AST Analyzer




    - Test parsing for various code patterns and edge cases
    - Test complexity calculations with known sample code
    - Test dependency extraction accuracy
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement Sensory Mapper for audio-visual translation








  - [x] 3.1 Create TypeScript interfaces for sensory mapping


    - Define AudioMapping, VisualMapping, ThemeMapping interfaces
    - Define ComplexityLevel enum and Animation interface
    - Define WaveformType and AudioEffect types
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.2 Implement complexity level classification


    - Create function to map cyclomatic complexity to ComplexityLevel enum
    - Handle edge cases (0 complexity, negative values)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
  - [x] 3.3 Implement audio frequency mapping

    - Map Low (1-5) to 220-330Hz with sine waveform
    - Map Medium (6-10) to 330-523Hz with triangle waveform
    - Map High (11-15) to 523-880Hz with sawtooth waveform
    - Map Critical (16+) to 880Hz+ with square waveform
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 12.1, 12.2, 12.3, 12.4_
  - [x] 3.4 Implement visual color mapping

    - Map Low to Midnight Blue (#191970)
    - Map Medium to Toxic Purple (#9400D3)
    - Map High to Blood Orange (#CC5500)
    - Map Critical to Crimson Red (#DC143C)
    - Set background to Eerie Black (#1C1C1C)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.5 Implement audio effects assignment

    - Assign reverb effect to Low complexity
    - Assign tremolo effect to Medium complexity
    - Assign medium distortion to High complexity
    - Assign high distortion to Critical complexity
    - Implement tritone interval for error states
    - Implement gothic organ chord for success states
    - _Requirements: 2.5, 9.5, 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 3.6 Implement animation assignment for horror theme

    - Assign cobweb animation to High and Critical complexity
    - Assign blood drip animation to Critical complexity
    - Assign ghostly glow to error states
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - [ ]*  3.7 Write unit tests for Sensory Mapper
    - Test frequency mappings for all complexity ranges
    - Test color mappings for all complexity levels
    - Test effect and animation assignments
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

-

- [ ] 4. Implement Audio Engine with Web Audio API
  - [x] 4.1 Create TypeScript interfaces for audio engine


    - Define AudioEngine and AudioContext interfaces
    - Create configuration types for oscillators and effects
    - _Requirements: 2.5, 6.1, 6.2, 6.3_
  - [x] 4.2 Implement Web Audio API wrapper


    - Initialize AudioContext and master gain node
    - Implement oscillator pooling for performance
    - Create oscillator with specified frequency and waveform
    - _Requirements: 2.5, 12.1, 12.2, 12.3, 12.4_
  - [x] 4.3 Integrate tone.js for advanced synthesis








    - Set up tone.js for effect chains
    - Implement reverb, tremolo, and distortion effects
    - Create effect routing: Oscillator → Effects → Gain → Destination
    - _Requirements: 2.5, 12.1, 12.2, 12.3, 12.4_
  - [x] 4.4 Implement audio playback controls




    - Create play() method with fade-in to prevent clicks
    - Create stop() method with fade-out
    - Implement enable/disable toggle for audio
    - Implement volume control (0-1 range)
    - _Requirements: 2.5, 6.1, 6.2, 6.3, 6.4_
  - [x] 4.5 Implement chord synthesis for special states





    - Create tritone interval synthesis for errors
    - Create gothic organ chord synthesis for success
    - Support simultaneous tone playback
    - _Requirements: 9.5, 12.5_
  - [ ]*  4.6 Write unit tests for Audio Engine
    - Mock Web Audio API for testing
    - Test oscillator creation and configuration
    - Test enable/disable and volume controls
    - _Requirements: 2.5, 6.1, 6.2, 6.3_

- [-] 5. Implement Visualization Engine with D3.js


  - [x] 5.1 Create TypeScript interfaces for visualization


    - Define GraphData, GraphNode, GraphEdge, and GraphMetadata interfaces
    - Create configuration types for D3.js force simulation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.2 Implement graph data generation from analysis results


    - Convert AnalysisResult to GraphData structure
    - Create nodes for files, functions, and classes
    - Create edges for dependencies (imports, calls, inheritance)
    - Calculate node sizes based on lines of code
    - Assign colors based on complexity levels
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.3 Implement D3.js force-directed graph rendering


    - Set up D3.js force simulation with charge, link, and center forces
    - Render nodes as circles or custom SVG icons
    - Render edges as lines with directional arrows
    - Implement zoom and pan controls
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.4 Implement interactive graph features


    - Add hover tooltips showing detailed metrics
    - Add click handlers to highlight connected nodes
    - Implement node dragging for manual layout adjustment
    - _Requirements: 4.4_
  - [x] 5.5 Implement horror-themed visual effects


    - Create cobweb SVG overlays for high complexity nodes
    - Implement blood drip CSS animation for critical complexity
    - Create ghostly glow SVG filter for error states
    - Replace critical node circles with skull SVG icons
    - _Requirements: 9.1, 9.2, 9.3, 4.5_
  - [x] 5.6 Implement fog particle system for background










    - Create canvas-based particle system
    - Use perlin noise for organic fog movement
    - Render fog with opacity gradients
    - _Requirements: 9.4_
  - [ ]*  5.7 Write unit tests for Visualization Engine
    - Test graph data generation from sample analysis results
    - Test node and edge creation logic
    - Test color and size calculations
    - _Requirements: 4.1, 4.2, 4.3_

- [-] 6. Create shared core package exports and utilities



  - [x] 6.1 Create main index.ts with public API exports


    - Export all interfaces and types
    - Export ASTAnalyzer, SensoryMapper, AudioEngine, and VisualizationEngine classes
    - Export utility functions and constants
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
  - [x] 6.2 Implement configuration management


    - Create CodeChromaConfig interface
    - Implement config loading from JSON files
    - Implement config validation and defaults
    - _Requirements: 6.4_
  - [x] 6.3 Implement error handling utilities


    - Create CodeChromaError class with error codes
    - Implement error recovery strategies
    - Create error logging utilities
    - _Requirements: 8.3_



  - [x] 6.4 Implement health score calculation












    - Create algorithm to aggregate complexity metrics into single score (0-100)
    - Weight by lines of code and function count
    - _Requirements: 5.5, 7.5_
  - [ ]*  6.5 Write integration tests for core package
    - Test end-to-end flow: code → parse → analyze → map → output
    - Test with sample TypeScript and JavaScript files
    - Verify audio and visual mappings are correct
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement LSP Server for IDE integration






  - [x] 7.1 Set up LSP server package structure


    - Create packages/lsp-server directory with package.json
    - Add dependency on @codechroma/core and vscode-languageserver
    - Configure TypeScript compilation
    - _Requirements: 11.1, 11.5_
  - [x] 7.2 Implement LSP server initialization and connection


    - Create server.ts with LSP connection setup
    - Implement initialize handler with server capabilities
    - Set up text document synchronization
    - _Requirements: 11.1, 11.2_



  - [x] 7.3 Implement document change handler with analysis













    - Listen for textDocument/didChange events
    - Debounce analysis to avoid excessive processing
    - Use core ASTAnalyzer to analyze changed documents

    - _Requirements: 11.3, 11.5_
  - [x] 7.4 Implement diagnostic generation and publishing






    - Convert AnalysisResult to LSP Diagnostic messages
    - Map complexity levels to diagnostic severity (Information, Warning, Error)
    - Send diagnostics via textDocument/publishDiagnostics
    - _Requirements: 11.2, 11.3_
  - [x] 7.5 Implement code actions for refactoring suggestions


    - Provide code actions for functions with high complexity
    - Suggest "Extract method" refactoring
    - Suggest "Simplify conditional" for nested if statements
    - _Requirements: 11.4_

  - [x] 7.6 Implement custom LSP commands

    - Register codechroma.playAudio command
    - Register codechroma.showGraph command
    - Handle command execution requests
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]*  7.7 Write integration tests for LSP server
    - Test LSP protocol message handling
    - Test diagnostic generation for sample code
    - Test code action suggestions
    - Use vscode-languageserver-protocol test utilities
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 8. Implement VS Code Extension for real-time feedback




  - [x] 8.1 Set up VS Code extension package structure


    - Create packages/vscode-extension directory with package.json
    - Configure extension manifest with activation events and commands
    - Add dependency on @codechroma/core
    - Set up webpack for bundling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 8.2 Implement extension activation and command registration

    - Create extension.ts with activate() and deactivate() functions
    - Register codechroma.toggleAudio command
    - Register codechroma.showGraph command
    - Initialize core analyzer and audio engine
    - _Requirements: 5.1, 6.1, 6.2_
  - [x] 8.3 Implement document change listener with debouncing


    - Listen for onDidChangeTextDocument events
    - Debounce analysis to 1 second after last keystroke
    - Analyze active document using core ASTAnalyzer
    - _Requirements: 5.1, 5.2_
  - [x] 8.4 Implement decoration manager for color-coded highlighting


    - Create decoration types for each complexity level (Low, Medium, High, Critical)
    - Apply decorations to function ranges based on analysis results
    - Clear decorations when document changes
    - Add skull emoji to critical complexity decorations
    - _Requirements: 5.3, 9.1_
  - [x] 8.5 Implement audio feedback on code changes

    - Play audio using AudioEngine when analysis completes
    - Use audio mapping from SensoryMapper
    - Respect audio enabled/disabled state
    - _Requirements: 5.2, 6.1, 6.2, 6.3_
  - [x] 8.6 Implement status bar manager


    - Create status bar item showing health score
    - Create status bar item showing audio enabled/disabled state
    - Update status bar when analysis completes
    - Add click handler to toggle audio

    - _Requirements: 5.5, 6.5_
  - [x] 8.7 Implement webview panel for AST graph visualization

    - Create webview panel with HTML/CSS/JS content
    - Bundle D3.js and visualization code for webview
    - Implement message passing between extension and webview
    - Render graph using VisualizationEngine
    - Apply horror theme styling
    - _Requirements: 5.4, 9.1, 9.2, 9.3, 9.4, 9.5_


  - [x] 8.8 Implement configuration persistence
    - Load audio enabled state from extension global state
    - Save audio enabled state when toggled
    - Load volume and other preferences
    - _Requirements: 6.4_
  - [ ]*  8.9 Write integration tests for VS Code extension
    - Mock VS Code API for testing
    - Test extension activation and command registration
    - Test document change handling and debouncing
    - Test decoration application
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Implement CLI Analyzer for batch analysis and CI/CD





  - [x] 9.1 Set up CLI package structure

    - Create packages/cli-analyzer directory with package.json
    - Add dependency on @codechroma/core and commander
    - Configure TypeScript compilation with executable output
    - Add bin entry in package.json for global installation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Implement CLI command parsing and options

    - Use commander to define CLI commands and options
    - Define analyze command with path, recursive, threshold, output, format options
    - Implement help text and usage examples
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


  - [x] 9.3 Implement recursive file system traversal

    - Traverse directory recursively finding supported source files
    - Filter files by extension (.ts, .tsx, .js, .jsx)
    - Handle file system errors gracefully
    - Display progress indicator using ora spinner


    - _Requirements: 7.1_
  - [x] 9.4 Implement batch analysis with core analyzer

    - Analyze each file using core ASTAnalyzer

    - Collect all AnalysisResult objects
    - Calculate aggregate SummaryMetrics
    - _Requirements: 7.1, 7.5_
  - [x] 9.5 Implement threshold checking for CI/CD

    - Compare each file's complexity against threshold
    - Track files exceeding threshold
    - Exit with non-zero code if any file exceeds threshold
    - _Requirements: 7.4_


  - [x] 9.6 Implement HTML report generation

    - Create HTML template with embedded CSS and D3.js
    - Generate summary dashboard with aggregate metrics
    - Generate file list table with sortable columns
    - Embed AST graph visualization using VisualizationEngine
    - Apply horror theme styling
    - Write standalone HTML file to output path


    - _Requirements: 7.2_

  - [x] 9.7 Implement JSON export for tooling integration
    - Serialize AnalysisResult and SummaryMetrics to JSON

    - Write JSON to output path or stdout
    - Include all metrics and metadata
    - _Requirements: 7.5_
  - [x] 9.8 Implement audio signature export

    - Use Web Audio API offline rendering to generate WAV files
    - Create one WAV file per analyzed source file
    - Name files as {source-file-name}-signature.wav
    - Generate audio based on complexity distribution (2-5 seconds)
    - Write WAV files to audio output directory
    - _Requirements: 7.3_

  - [x] 9.9 Implement text output formatter

    - Print summary metrics to console using chalk for colors
    - Print file list with complexity indicators
    - Highlight files exceeding threshold in red
    - _Requirements: 7.1, 7.4_
  - [ ]*  9.10 Write integration tests for CLI analyzer
    - Test file system traversal with sample directory structure
    - Test analysis of multiple files
    - Test HTML report generation
    - Test JSON export
    - Test threshold checking and exit codes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Create documentation and examples





  - [x] 10.1 Write README for monorepo root


    - Describe project overview and architecture
    - Provide installation instructions for all packages
    - Include quick start examples for VS Code extension and CLI
    - Add links to individual package READMEs
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1_
  - [x] 10.2 Write README for core package


    - Document public API with TypeScript interfaces
    - Provide usage examples for each component
    - Explain complexity calculation methodology
    - Document audio-visual mapping rules
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_


  - [x] 10.3 Write README for VS Code extension
    - Describe features and capabilities
    - Provide installation instructions from marketplace
    - Document commands and keyboard shortcuts
    - Include screenshots of visual feedback and webview
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 10.4 Write README for CLI analyzer


    - Document all CLI commands and options
    - Provide usage examples for common scenarios
    - Explain CI/CD integration patterns
    - Document output formats (HTML, JSON, audio)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 10.5 Write README for LSP server


    - Document LSP capabilities and supported features
    - Provide installation instructions for various editors
    - Include configuration examples for VS Code, Neovim, Emacs
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 10.6 Create sample code files for testing and demos

    - Create TypeScript files with varying complexity levels
    - Create JavaScript files with different patterns
    - Include edge cases (empty files, syntax errors)
    - _Requirements: 1.1, 8.1, 8.2_

- [x] 11. Set up build and deployment pipeline




  - [x] 11.1 Configure monorepo build scripts


    - Add build scripts to root package.json for all packages
    - Configure TypeScript project references for incremental builds
    - Set up watch mode for development
    - _Requirements: 10.1_


  - [ ] 11.2 Configure VS Code extension packaging
    - Set up vsce for extension packaging
    - Configure webpack for production bundle


    - Minimize bundle size by excluding dev dependencies
    - _Requirements: 5.1_
  - [x] 11.3 Configure CLI packaging for npm


    - Set up npm publish configuration
    - Configure executable permissions for CLI binary


    - Test global installation locally
    - _Requirements: 7.1_
  - [ ] 11.4 Configure LSP server packaging for npm
    - Set up npm publish configuration
    - Include installation script for binary setup
    - _Requirements: 11.1_
  - [ ] 11.5 Set up CI/CD with GitHub Actions
    - Create workflow for running tests on push
    - Create workflow for building all packages
    - Create workflow for publishing to npm and VS Code marketplace
    - _Requirements: 7.4_
