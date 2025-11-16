# Python Support in CodeChroma

CodeChroma now supports Python files (.py, .pyw) with **syntax error detection** and **heuristic-based complexity analysis**!

## Features

### 🔍 Syntax Error Detection

CodeChroma detects common Python syntax errors in real-time:

- **Missing colons** after `if`, `def`, `class`, `for`, `while`, `try`, etc.
- **Assignment in conditions** (`=` instead of `==`)
- **Mixed tabs and spaces** in indentation
- **Invalid print syntax** (Python 2 vs Python 3)
- **Common typos** (`esle` instead of `else`, `retrun` instead of `return`)
- **Unclosed brackets, parentheses, braces**
- **Unclosed multiline strings**
- **Invalid function/class names** (starting with numbers)
- **Unbalanced brackets** throughout the file

### 📊 Complexity Analysis

While we can't do full AST parsing in TypeScript (without running Python), CodeChroma provides **heuristic-based complexity estimation**:

#### Cyclomatic Complexity
Counts decision points:
- `if`, `elif` statements
- `for`, `while` loops
- `except` clauses
- Logical operators (`and`, `or`)

#### Function Metrics
- **Lines of Code** - function length
- **Parameters** - number of parameters
- **Nesting Depth** - based on indentation levels
- **Cyclomatic Complexity** - estimated from keywords

### 🎨 Horror Theme

Same horror effects as JavaScript/TypeScript:

| Complexity | Color | Effects |
|------------|-------|---------|
| **Low (1-5)** | 🔵 Midnight Blue | Clean, peaceful |
| **Medium (6-10)** | 🟣 Toxic Purple | ⚠️ Warning emoji |
| **High (11-15)** | 🟠 Blood Orange | 🕷️ Spider webs |
| **Critical (16+)** | 🔴 Crimson Red | ☠️🩸 Skulls, blood drips, jumpscares |

### 💡 Hover Suggestions

Same actionable refactoring suggestions based on:
- Complexity level
- Function length
- Parameter count
- Nesting depth

## Testing

Try these sample files:

1. **samples/python-example.py** - Clean Python code with varying complexity levels
2. **samples/python-with-errors.py** - Intentional syntax errors for testing

## Limitations

Since we're not running Python's actual AST parser:
- **No dependency extraction** (imports not tracked)
- **Heuristic-based complexity** (may not be 100% accurate)
- **Indentation-based function detection** (assumes standard 4-space indentation)
- **Pattern-based syntax checking** (not as comprehensive as Python's compiler)

## How It Works

```
┌─────────────────────────────────────┐
│  Python File (.py)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PythonParser                       │
│  - Regex-based function detection   │
│  - Line-by-line syntax validation   │
│  - Indentation-based nesting        │
│  - Keyword-based complexity         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Analysis Result                    │
│  ✓ Function metrics                 │
│  ✓ Complexity scores                │
│  ✓ Syntax errors (if any)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Horror Effects!                    │
│  🎨 Color themes                    │
│  🎵 Audio effects                   │
│  👻 Visual decorations              │
│  💀 Popup jumpscares                │
└─────────────────────────────────────┘
```

## Future Enhancements

To add full Python AST parsing in the future, we could:
1. Use Python's `ast` module via child process
2. Integrate a Python parser written in TypeScript (e.g., Pyodide)
3. Use VS Code's Python extension API
4. Run a Python language server

For now, the heuristic approach provides good-enough complexity estimation and excellent syntax error detection! 🐍✨
