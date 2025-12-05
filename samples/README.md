# codeblooded Sample Files

This directory contains sample code files for testing and demonstrating codeblooded's analysis capabilities. Each file is designed to showcase different complexity levels and edge cases.

## File Overview

### Complexity Level Samples

#### `low-complexity.ts`
Functions with cyclomatic complexity 1-5.
- **Expected Output**: Midnight Blue highlighting (#191970)
- **Expected Audio**: Deep ominous hum (220-330Hz, sine wave)
- **Examples**: Simple functions, single conditionals, basic loops

#### `medium-complexity.ts`
Functions with cyclomatic complexity 6-10.
- **Expected Output**: Toxic Purple highlighting (#9400D3)
- **Expected Audio**: Eerie dissonant notes (330-523Hz, triangle wave)
- **Examples**: Multiple conditionals, switch statements, nested loops

#### `high-complexity.ts`
Functions with cyclomatic complexity 11-15.
- **Expected Output**: Blood Orange highlighting (#CC5500)
- **Expected Audio**: Sharp piercing tones (523-880Hz, sawtooth wave)
- **Expected Visual**: Cobweb overlays on graph nodes
- **Examples**: Deeply nested conditionals, complex state machines, multiple nested loops

#### `critical-complexity.ts`
Functions with cyclomatic complexity 16+.
- **Expected Output**: Crimson Red highlighting (#DC143C)
- **Expected Audio**: Harsh distorted tones (880Hz+, square wave)
- **Expected Visual**: Skull icons, blood drip animations
- **Examples**: Extremely complex functions that desperately need refactoring

### Language-Specific Samples

#### `javascript-examples.js`
JavaScript-specific syntax and patterns.
- Arrow functions
- Async/await
- Promises
- Classes
- Generators
- Closures
- Various ES6+ features

### Edge Cases

#### `edge-cases.ts`
Special scenarios and edge conditions.
- Empty functions
- Single-line functions
- Recursive functions
- IIFE (Immediately Invoked Function Expressions)
- Functions with many parameters
- Optional chaining
- Nullish coalescing
- Template literals
- Regex patterns
- Bitwise operators
- Type guards
- Decorators
- Abstract classes
- Interfaces and type aliases
- Enums and namespaces

#### `syntax-errors.ts`
Intentional syntax errors for testing error handling.
- Missing braces
- Unclosed strings
- Invalid syntax
- Missing parentheses
- Unexpected tokens
- Invalid type annotations
- Unclosed comments

**Note**: This file will fail to parse. codeblooded should handle these errors gracefully and report them to the user.

#### `empty-file.ts`
Minimal file with only comments.
- Tests handling of files with no actual code
- Should result in zero complexity

## Usage

### VS Code Extension

1. Open any sample file in VS Code
2. codeblooded will automatically analyze it
3. Observe the color-coded highlighting
4. Listen to the audio feedback (if enabled)
5. Run `codeblooded: Show AST Graph` to see the visualization

### CLI Analyzer

```bash
# Analyze single file
codeblooded analyze samples/low-complexity.ts

# Analyze all samples
codeblooded analyze samples --recursive

# Generate HTML report
codeblooded analyze samples -r --output samples-report.html

# Export audio signatures
codeblooded analyze samples -r --export-audio --audio-path ./audio-samples
```

### Core Library

```typescript
import { ASTAnalyzer, SensoryMapper } from '@codeblooded/core';
import { readFileSync } from 'fs';

const analyzer = new ASTAnalyzer();
const mapper = new SensoryMapper();

// Analyze a sample file
const code = readFileSync('samples/medium-complexity.ts', 'utf8');
const parseResult = await analyzer.parse(code, 'typescript');
const analysis = analyzer.analyze(parseResult);

console.log('File Complexity:', analysis.metrics.cyclomaticComplexity);

// Get sensory mapping
for (const func of analysis.functions) {
  const theme = mapper.mapToTheme(func.cyclomaticComplexity);
  console.log(`${func.name}: Complexity ${func.cyclomaticComplexity}`);
  console.log(`  Color: ${theme.visual.color}`);
  console.log(`  Frequency: ${theme.audio.frequency}Hz`);
  console.log(`  Level: ${theme.complexity}`);
}
```

## Expected Results

### Complexity Distribution

When analyzing all sample files, you should see approximately:

- **Low (1-5)**: ~40% of functions
- **Medium (6-10)**: ~30% of functions
- **High (11-15)**: ~20% of functions
- **Critical (16+)**: ~10% of functions

### Health Scores

Expected health scores for each file:

| File | Expected Health Score | Notes |
|------|----------------------|-------|
| `low-complexity.ts` | 90-100 | Excellent code quality |
| `medium-complexity.ts` | 70-85 | Good, some improvements possible |
| `high-complexity.ts` | 50-70 | Fair, refactoring recommended |
| `critical-complexity.ts` | 20-50 | Poor, significant refactoring needed |
| `javascript-examples.js` | 60-80 | Mixed complexity levels |
| `edge-cases.ts` | 85-95 | Mostly simple functions |
| `empty-file.ts` | 100 | No code to analyze |
| `syntax-errors.ts` | N/A | Parse errors |

### Audio Signatures

When exporting audio signatures, each file will produce a unique WAV file:

- **Low complexity files**: Calm, deep tones with reverb
- **Medium complexity files**: Eerie, dissonant notes with tremolo
- **High complexity files**: Sharp, piercing tones with distortion
- **Critical complexity files**: Harsh, heavily distorted horror stingers

## Testing Checklist

Use these samples to verify codeblooded functionality:

- [ ] All TypeScript files parse successfully (except `syntax-errors.ts`)
- [ ] JavaScript files parse successfully
- [ ] Complexity calculations match expected ranges
- [ ] Color highlighting appears correctly in VS Code
- [ ] Audio feedback plays with correct frequencies
- [ ] Graph visualization renders all nodes and edges
- [ ] Horror theme effects appear (cobwebs, skulls, blood drips)
- [ ] Health scores calculate correctly
- [ ] CLI generates reports successfully
- [ ] Audio signatures export as WAV files
- [ ] Syntax errors are handled gracefully
- [ ] Empty files don't cause crashes
- [ ] Edge cases parse without errors

## Contributing

When adding new sample files:

1. Include clear comments explaining the complexity level
2. Add expected cyclomatic complexity in comments
3. Use descriptive function names
4. Update this README with the new file
5. Test with all codeblooded packages (core, VS Code, CLI, LSP)

## License

These sample files are part of the codeblooded project and are licensed under MIT.
