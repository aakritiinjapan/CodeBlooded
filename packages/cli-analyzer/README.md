# @codechroma/cli

> Command-line analyzer for CodeChroma - batch analysis and CI/CD integration

Analyze entire codebases from the command line. Generate HTML reports, export audio signatures, enforce complexity thresholds in CI/CD pipelines, and integrate with other development tools via JSON output.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @codechroma/cli
```

### Local Installation

```bash
npm install --save-dev @codechroma/cli
```

### npx (No Installation)

```bash
npx @codechroma/cli analyze ./src
```

## Quick Start

```bash
# Analyze a single file
codechroma analyze ./src/index.ts

# Analyze directory recursively
codechroma analyze ./src --recursive

# Generate HTML report
codechroma analyze ./src -r --output report.html

# CI/CD mode with threshold
codechroma analyze ./src -r --threshold 10 --format json

# Export audio signatures
codechroma analyze ./src -r --export-audio --audio-path ./audio
```

## Commands

### `analyze`

Analyze source code files and generate reports.

```bash
codechroma analyze <path> [options]
```

#### Arguments

- **`<path>`** (required)
  - File or directory path to analyze
  - Examples: `./src/index.ts`, `./src`, `.`

#### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--recursive` | `-r` | boolean | `false` | Recursively analyze subdirectories |
| `--threshold` | `-t` | number | - | Complexity threshold for CI/CD (exit code 1 if exceeded) |
| `--output` | `-o` | string | - | Output file path for report |
| `--format` | `-f` | string | `text` | Output format: `text`, `html`, `json` |
| `--export-audio` | `-a` | boolean | `false` | Export audio signatures as WAV files |
| `--audio-path` | - | string | `./audio` | Directory for audio signature exports |
| `--include` | `-i` | string | `**/*.{ts,tsx,js,jsx}` | Glob pattern for files to include |
| `--exclude` | `-e` | string | `**/node_modules/**` | Glob pattern for files to exclude |
| `--verbose` | `-v` | boolean | `false` | Show detailed progress and debug info |
| `--quiet` | `-q` | boolean | `false` | Suppress all output except errors |

## Usage Examples

### Basic Analysis

Analyze a single file:

```bash
codechroma analyze ./src/utils/helper.ts
```

Output:
```
🎨 CodeChroma Analysis

File: ./src/utils/helper.ts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Lines of Code:        145
  Cyclomatic Complexity: 12
  Functions:            8
  Health Score:         78/100

Functions:
  ✓ parseData           Complexity: 3  (Low)
  ✓ validateInput       Complexity: 5  (Low)
  ⚠ processRecords      Complexity: 8  (Medium)
  ⚠ transformData       Complexity: 11 (High)
  ✗ complexCalculation  Complexity: 18 (Critical) ☠️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Recursive Directory Analysis

Analyze all files in a directory:

```bash
codechroma analyze ./src --recursive
```

Output:
```
🎨 CodeChroma Analysis

Analyzing 47 files...
⠋ Processing... [████████████████████] 100% | 47/47 files

Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Files:          47
  Total Functions:      312
  Total Lines:          8,456
  Average Complexity:   6.2
  Health Score:         82/100

Complexity Distribution:
  Low (1-5):           198 functions (63%)
  Medium (6-10):       89 functions (29%)
  High (11-15):        21 functions (7%)
  Critical (16+):      4 functions (1%) ☠️

Top 5 Most Complex Files:
  1. ./src/parser/ast-analyzer.ts      Complexity: 45  Health: 62
  2. ./src/engine/audio-engine.ts      Complexity: 38  Health: 68
  3. ./src/visualization/graph.ts      Complexity: 32  Health: 71
  4. ./src/mapper/sensory-mapper.ts    Complexity: 28  Health: 75
  5. ./src/utils/complexity.ts         Complexity: 24  Health: 78

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### HTML Report Generation

Generate a standalone HTML report with interactive visualizations:

```bash
codechroma analyze ./src -r --output report.html --format html
```

Creates `report.html` with:
- Summary dashboard with aggregate metrics
- Sortable file list table
- Interactive D3.js graph visualization
- Horror-themed styling
- Function-level detail views
- Exportable as standalone file (no external dependencies)

### JSON Export

Export analysis results as JSON for integration with other tools:

```bash
codechroma analyze ./src -r --output analysis.json --format json
```

Output format:

```json
{
  "summary": {
    "totalFiles": 47,
    "totalFunctions": 312,
    "totalLines": 8456,
    "averageComplexity": 6.2,
    "healthScore": 82,
    "filesAboveThreshold": 0
  },
  "files": [
    {
      "file": "./src/index.ts",
      "metrics": {
        "totalLines": 145,
        "codeLines": 120,
        "commentLines": 15,
        "cyclomaticComplexity": 12,
        "maintainabilityIndex": 78
      },
      "functions": [
        {
          "name": "parseData",
          "startLine": 10,
          "endLine": 25,
          "cyclomaticComplexity": 3,
          "linesOfCode": 15,
          "parameters": 2,
          "nestingDepth": 2
        }
      ],
      "dependencies": [
        {
          "from": "./src/index.ts",
          "to": "./src/utils/helper.ts",
          "type": "import"
        }
      ]
    }
  ]
}
```

### CI/CD Integration

Enforce complexity thresholds in continuous integration:

```bash
codechroma analyze ./src -r --threshold 10 --format json --quiet
```

- **Exit Code 0**: All files pass threshold
- **Exit Code 1**: One or more files exceed threshold

#### GitHub Actions Example

```yaml
name: Code Quality Check

on: [push, pull_request]

jobs:
  codechroma:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CodeChroma
        run: npm install -g @codechroma/cli
      
      - name: Analyze Code Complexity
        run: codechroma analyze ./src -r --threshold 10 --format json --output analysis.json
      
      - name: Upload Analysis Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: codechroma-analysis
          path: analysis.json
```

#### GitLab CI Example

```yaml
codechroma:
  stage: test
  image: node:18
  script:
    - npm install -g @codechroma/cli
    - codechroma analyze ./src -r --threshold 10 --format json --output analysis.json
  artifacts:
    reports:
      codequality: analysis.json
    when: always
```

#### Jenkins Pipeline Example

```groovy
pipeline {
  agent any
  stages {
    stage('Code Quality') {
      steps {
        sh 'npm install -g @codechroma/cli'
        sh 'codechroma analyze ./src -r --threshold 10 --format json --output analysis.json'
      }
      post {
        always {
          archiveArtifacts artifacts: 'analysis.json', fingerprint: true
        }
      }
    }
  }
}
```

### Audio Signature Export

Export audio representations of code complexity:

```bash
codechroma analyze ./src -r --export-audio --audio-path ./audio-signatures
```

Generates WAV files:
```
./audio-signatures/
├── src-index.ts-signature.wav
├── src-utils-helper.ts-signature.wav
├── src-parser-ast-analyzer.ts-signature.wav
└── ...
```

Each audio file:
- Duration: 2-5 seconds based on complexity distribution
- Format: WAV (stereo, 44.1kHz)
- Content: Synthesized tones representing function complexities
- Panning: Left/right based on code structure

Use cases:
- Unique "sonic fingerprint" for each file
- Audio-based code review
- Accessibility for visually impaired developers
- Creative code sonification projects

### Custom File Patterns

Include/exclude specific files:

```bash
# Only analyze TypeScript files
codechroma analyze ./src -r --include "**/*.ts"

# Exclude test files
codechroma analyze ./src -r --exclude "**/*.test.ts"

# Multiple patterns
codechroma analyze ./src -r --include "**/*.{ts,tsx}" --exclude "**/{test,__tests__}/**"
```

### Verbose Output

Show detailed progress and debug information:

```bash
codechroma analyze ./src -r --verbose
```

Output includes:
- File discovery progress
- Parse times for each file
- Analysis duration
- Memory usage
- Warning and error details

### Quiet Mode

Suppress all output except errors (useful for scripts):

```bash
codechroma analyze ./src -r --threshold 10 --quiet
echo $?  # Check exit code
```

## Output Formats

### Text (Default)

Human-readable console output with colors and formatting.

**Best for:**
- Quick manual checks
- Development workflow
- Terminal-based reviews

### HTML

Standalone HTML file with embedded CSS, JavaScript, and D3.js.

**Best for:**
- Sharing reports with team
- Documentation
- Visual presentations
- Archiving analysis results

**Features:**
- Interactive graph visualization
- Sortable tables
- Horror-themed styling
- No external dependencies
- Works offline

### JSON

Structured data format for programmatic consumption.

**Best for:**
- CI/CD integration
- Tool integration
- Custom reporting
- Data analysis
- API responses

**Schema:**
```typescript
interface CLIOutput {
  summary: SummaryMetrics;
  files: AnalysisResult[];
}

interface SummaryMetrics {
  totalFiles: number;
  totalFunctions: number;
  totalLines: number;
  averageComplexity: number;
  healthScore: number;
  filesAboveThreshold: number;
}
```

## Configuration File

Create `.codechroma.json` in project root for persistent settings:

```json
{
  "threshold": 10,
  "format": "html",
  "output": "./reports/codechroma.html",
  "recursive": true,
  "exportAudio": false,
  "include": "**/*.{ts,tsx,js,jsx}",
  "exclude": "**/node_modules/**",
  "audio": {
    "enabled": true,
    "volume": 0.7
  },
  "visual": {
    "theme": "horror",
    "animations": true
  }
}
```

Then run:

```bash
codechroma analyze ./src
```

CLI options override config file settings.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success - all files analyzed, no threshold violations |
| 1 | Threshold exceeded - one or more files above complexity threshold |
| 2 | Parse error - unable to parse one or more files |
| 3 | File system error - file not found or permission denied |
| 4 | Invalid arguments - incorrect command-line options |

## Performance

- **Analysis Speed**: ~100 files/second on typical hardware
- **Memory Usage**: ~50MB base + ~1MB per 100 files
- **HTML Report**: ~500KB for 100 files (including embedded D3.js)
- **JSON Export**: ~100KB for 100 files

### Performance Tips

1. **Use `--include` patterns** to limit file scope
2. **Exclude large directories** like `node_modules` (excluded by default)
3. **Disable audio export** unless needed (adds ~10% overhead)
4. **Use JSON format** for fastest output
5. **Run in parallel** for multiple projects

## Troubleshooting

### Command Not Found

**Issue**: `codechroma: command not found`

**Solutions**:
1. Install globally: `npm install -g @codechroma/cli`
2. Check PATH: `echo $PATH` should include npm global bin
3. Use npx: `npx @codechroma/cli analyze ./src`
4. Use local install: `./node_modules/.bin/codechroma analyze ./src`

### Parse Errors

**Issue**: Unable to parse certain files

**Solutions**:
1. Check syntax: Ensure files have valid syntax
2. Check file extensions: Only `.ts`, `.tsx`, `.js`, `.jsx` supported
3. Use `--verbose`: See detailed error messages
4. Exclude problematic files: Use `--exclude` pattern

### Threshold Always Failing

**Issue**: CI/CD always exits with code 1

**Solutions**:
1. Check threshold value: May be too low
2. Review complex files: Use HTML report to identify issues
3. Adjust threshold: Increase gradually or per-project
4. Exclude legacy code: Use `--exclude` for old files

### Audio Export Fails

**Issue**: No WAV files generated

**Solutions**:
1. Check permissions: Ensure write access to audio path
2. Check disk space: WAV files can be large
3. Use `--verbose`: See detailed error messages
4. Try different path: Use absolute path

## Integration Examples

### npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "analyze": "codechroma analyze ./src -r",
    "analyze:report": "codechroma analyze ./src -r --output report.html",
    "analyze:ci": "codechroma analyze ./src -r --threshold 10 --format json --quiet",
    "analyze:audio": "codechroma analyze ./src -r --export-audio"
  }
}
```

### Pre-commit Hook

Using Husky:

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

codechroma analyze ./src -r --threshold 15 --quiet || {
  echo "❌ Code complexity threshold exceeded"
  exit 1
}
```

### VS Code Task

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "CodeChroma: Analyze",
      "type": "shell",
      "command": "codechroma analyze ./src -r --output report.html",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

### Custom Script

```javascript
// analyze.js
const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Run analysis
  execSync('codechroma analyze ./src -r --format json --output analysis.json', {
    stdio: 'inherit'
  });
  
  // Read results
  const results = JSON.parse(fs.readFileSync('analysis.json', 'utf8'));
  
  // Custom processing
  if (results.summary.healthScore < 70) {
    console.error('❌ Health score too low:', results.summary.healthScore);
    process.exit(1);
  }
  
  console.log('✅ Code quality check passed');
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
}
```

## API Usage

Use programmatically in Node.js:

```javascript
const { CLIAnalyzer } = require('@codechroma/cli');

const analyzer = new CLIAnalyzer();

const results = await analyzer.analyze({
  path: './src',
  recursive: true,
  threshold: 10,
  outputFormat: 'json',
  exportAudio: false
});

console.log('Health Score:', results.summary.healthScore);
console.log('Files Above Threshold:', results.summary.filesAboveThreshold);

if (results.exitCode !== 0) {
  console.error('Analysis failed');
  process.exit(results.exitCode);
}
```

## License

MIT - see [LICENSE](../../LICENSE) for details

## Related

- [@codechroma/core](../core/README.md) - Core analysis engine
- [codechroma-vscode](../vscode-extension/README.md) - VS Code extension
- [@codechroma/lsp-server](../lsp-server/README.md) - LSP server

## Support

- [GitHub Issues](https://github.com/yourusername/codechroma/issues)
- [Documentation](https://codechroma.dev)
- [Discord Community](https://discord.gg/codechroma)

---

**Made with 🎃 by the CodeChroma team**
