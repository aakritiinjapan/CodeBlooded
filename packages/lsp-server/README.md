# @codechroma/lsp-server

> Language Server Protocol implementation for CodeChroma - IDE-agnostic code analysis integration

Bring CodeChroma's multi-sensory code analysis to any editor that supports LSP. Get real-time complexity diagnostics, refactoring suggestions, and code actions in VS Code, Neovim, Emacs, Sublime Text, and more.

## Features

- **Real-time Diagnostics**: Complexity warnings as you type
- **Code Actions**: Refactoring suggestions for complex functions
- **Custom Commands**: Trigger audio playback and graph visualization
- **IDE-Agnostic**: Works with any LSP-compatible editor
- **Lightweight**: Minimal resource usage
- **TypeScript & JavaScript**: Full support for modern syntax

## Installation

### Global Installation (Recommended)

```bash
npm install -g @codechroma/lsp-server
```

### Local Installation

```bash
npm install --save-dev @codechroma/lsp-server
```

### From Source

```bash
git clone https://github.com/yourusername/codechroma.git
cd codechroma/packages/lsp-server
npm install
npm run build
npm link
```

## Quick Start

### 1. Start the Server

```bash
codechroma-lsp --stdio
```

The server communicates via stdin/stdout using the LSP protocol.

### 2. Configure Your Editor

See [Editor Configuration](#editor-configuration) for specific setup instructions.

### 3. Open a TypeScript or JavaScript File

The server activates automatically and provides diagnostics.

## LSP Capabilities

### Text Document Synchronization

- **`textDocument/didOpen`**: Analyze file when opened
- **`textDocument/didChange`**: Re-analyze on changes (debounced 2 seconds)
- **`textDocument/didSave`**: Re-analyze on save
- **`textDocument/didClose`**: Clean up resources

### Diagnostics

Complexity warnings published automatically:

| Complexity | Severity | Message |
|------------|----------|---------|
| 1-5 | None | No diagnostic |
| 6-10 | Information | "Function has medium complexity (6-10)" |
| 11-15 | Warning | "Function has high complexity (11-15). Consider refactoring." |
| 16+ | Error | "Function has critical complexity (16+). Refactor immediately." |

### Code Actions

Refactoring suggestions for complex functions:

- **Extract Method**: Break down complex functions
- **Simplify Conditional**: Reduce nested if statements
- **Reduce Nesting**: Flatten deeply nested code

### Custom Commands

- **`codechroma.playAudio`**: Play audio feedback for current file
- **`codechroma.showGraph`**: Display AST graph visualization

### Hover Information

Hover over functions to see:
- Cyclomatic complexity
- Lines of code
- Parameter count
- Nesting depth

## Editor Configuration

### VS Code

Create or edit `.vscode/settings.json`:

```json
{
  "codechroma.lsp.enabled": true,
  "codechroma.lsp.serverPath": "codechroma-lsp",
  "codechroma.lsp.trace.server": "off"
}
```

Install the LSP client extension or configure manually in `settings.json`:

```json
{
  "languageServerExample.trace.server": "verbose",
  "languageServerExample.maxNumberOfProblems": 100
}
```

Or use the official CodeChroma VS Code extension (recommended).

### Neovim

Using `nvim-lspconfig`:

```lua
-- ~/.config/nvim/init.lua or ~/.config/nvim/lua/lsp-config.lua

local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define CodeChroma LSP
if not configs.codechroma then
  configs.codechroma = {
    default_config = {
      cmd = { 'codechroma-lsp', '--stdio' },
      filetypes = { 'typescript', 'javascript', 'typescriptreact', 'javascriptreact' },
      root_dir = lspconfig.util.root_pattern('package.json', 'tsconfig.json', '.git'),
      settings = {},
    },
  }
end

-- Setup CodeChroma LSP
lspconfig.codechroma.setup({
  on_attach = function(client, bufnr)
    -- Enable completion triggered by <c-x><c-o>
    vim.api.nvim_buf_set_option(bufnr, 'omnifunc', 'v:lua.vim.lsp.omnifunc')

    -- Mappings
    local bufopts = { noremap=true, silent=true, buffer=bufnr }
    vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, bufopts)
    vim.keymap.set('n', 'gd', vim.lsp.buf.definition, bufopts)
    vim.keymap.set('n', 'K', vim.lsp.buf.hover, bufopts)
    vim.keymap.set('n', '<space>ca', vim.lsp.buf.code_action, bufopts)
    
    -- Custom commands
    vim.keymap.set('n', '<space>cp', function()
      vim.lsp.buf.execute_command({ command = 'codechroma.playAudio' })
    end, bufopts)
    
    vim.keymap.set('n', '<space>cg', function()
      vim.lsp.buf.execute_command({ command = 'codechroma.showGraph' })
    end, bufopts)
  end,
  flags = {
    debounce_text_changes = 2000,
  },
})
```

### Emacs

Using `lsp-mode`:

```elisp
;; ~/.emacs.d/init.el or ~/.emacs

(require 'lsp-mode)

;; Define CodeChroma LSP client
(lsp-register-client
 (make-lsp-client
  :new-connection (lsp-stdio-connection '("codechroma-lsp" "--stdio"))
  :major-modes '(typescript-mode js-mode typescript-tsx-mode js-jsx-mode)
  :server-id 'codechroma
  :priority 1))

;; Enable LSP for TypeScript and JavaScript
(add-hook 'typescript-mode-hook #'lsp)
(add-hook 'js-mode-hook #'lsp)
(add-hook 'typescript-tsx-mode-hook #'lsp)
(add-hook 'js-jsx-mode-hook #'lsp)

;; Custom keybindings
(with-eval-after-load 'lsp-mode
  (define-key lsp-mode-map (kbd "C-c c p") 
    (lambda () (interactive) (lsp-execute-code-action "codechroma.playAudio")))
  (define-key lsp-mode-map (kbd "C-c c g") 
    (lambda () (interactive) (lsp-execute-code-action "codechroma.showGraph"))))
```

### Sublime Text

Using LSP package:

1. Install LSP package: `Package Control: Install Package` → `LSP`

2. Create `LSP-codechroma.sublime-settings`:

```json
{
  "clients": {
    "codechroma": {
      "enabled": true,
      "command": ["codechroma-lsp", "--stdio"],
      "selector": "source.ts | source.tsx | source.js | source.jsx",
      "settings": {}
    }
  }
}
```

3. Restart Sublime Text

### Vim (with vim-lsp)

```vim
" ~/.vimrc

if executable('codechroma-lsp')
  au User lsp_setup call lsp#register_server({
    \ 'name': 'codechroma',
    \ 'cmd': {server_info->['codechroma-lsp', '--stdio']},
    \ 'allowlist': ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
    \ })
endif

" Enable diagnostics
let g:lsp_diagnostics_enabled = 1
let g:lsp_diagnostics_echo_cursor = 1

" Keybindings
function! s:on_lsp_buffer_enabled() abort
  setlocal omnifunc=lsp#complete
  nmap <buffer> gd <plug>(lsp-definition)
  nmap <buffer> K <plug>(lsp-hover)
  nmap <buffer> <leader>ca <plug>(lsp-code-action)
endfunction

augroup lsp_install
  au!
  autocmd User lsp_buffer_enabled call s:on_lsp_buffer_enabled()
augroup END
```

### Helix

Edit `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "typescript"
language-server = { command = "codechroma-lsp", args = ["--stdio"] }

[[language]]
name = "javascript"
language-server = { command = "codechroma-lsp", args = ["--stdio"] }

[[language]]
name = "tsx"
language-server = { command = "codechroma-lsp", args = ["--stdio"] }

[[language]]
name = "jsx"
language-server = { command = "codechroma-lsp", args = ["--stdio"] }
```

## Command-Line Options

```bash
codechroma-lsp [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--stdio` | Use stdin/stdout for communication (required) | - |
| `--node-ipc` | Use node IPC for communication | - |
| `--socket=<port>` | Use socket on specified port | - |
| `--log-level=<level>` | Set log level: `error`, `warn`, `info`, `debug` | `info` |
| `--log-file=<path>` | Write logs to file | - |

### Examples

```bash
# Standard stdio mode (most common)
codechroma-lsp --stdio

# Debug mode with verbose logging
codechroma-lsp --stdio --log-level=debug --log-file=/tmp/codechroma-lsp.log

# Socket mode (for testing)
codechroma-lsp --socket=6009
```

## Configuration

### Server Settings

Configure via LSP client settings:

```json
{
  "codechroma": {
    "analysis": {
      "threshold": 10,
      "debounceMs": 2000
    },
    "diagnostics": {
      "enabled": true,
      "showInformation": true,
      "showWarnings": true,
      "showErrors": true
    },
    "codeActions": {
      "enabled": true,
      "suggestRefactoring": true
    },
    "audio": {
      "enabled": false
    }
  }
}
```

### Workspace Configuration

Create `.codechroma.json` in project root:

```json
{
  "threshold": 10,
  "languages": ["typescript", "javascript"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"],
  "audio": {
    "enabled": false
  }
}
```

## Diagnostic Examples

### Information (Complexity 6-10)

```typescript
function processData(items) {  // ℹ️ Function has medium complexity (8)
  if (!items) return [];
  
  return items
    .filter(item => item.active)
    .map(item => {
      if (item.type === 'A') {
        return transformA(item);
      } else if (item.type === 'B') {
        return transformB(item);
      }
      return item;
    });
}
```

### Warning (Complexity 11-15)

```typescript
function validateForm(data) {  // ⚠️ Function has high complexity (12). Consider refactoring.
  if (!data) return false;
  
  if (data.name) {
    if (data.name.length > 0) {
      if (data.email) {
        if (data.email.includes('@')) {
          if (data.password) {
            if (data.password.length >= 8) {
              if (data.confirmPassword) {
                if (data.password === data.confirmPassword) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return false;
}
```

### Error (Complexity 16+)

```typescript
function complexCalculation(a, b, c, d) {  // ❌ Function has critical complexity (18). Refactor immediately.
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (d > 0) {
          if (a > b) {
            if (b > c) {
              if (c > d) {
                return a + b + c + d;
              } else if (d > c) {
                return a * b * c * d;
              }
            } else if (c > b) {
              if (d > a) {
                return a - b - c - d;
              }
            }
          } else if (b > a) {
            if (c > d) {
              return (a + b) * (c + d);
            }
          }
        }
      }
    }
  }
  return 0;
}
```

## Code Action Examples

### Extract Method

**Before:**
```typescript
function processOrder(order) {  // Complexity: 15
  // Validation logic (5 decision points)
  if (!order) return false;
  if (!order.items) return false;
  if (order.items.length === 0) return false;
  if (!order.customer) return false;
  if (!order.customer.email) return false;
  
  // Processing logic (10 decision points)
  // ... complex processing ...
  
  return true;
}
```

**Code Action:** "Extract validation into separate method"

**After:**
```typescript
function validateOrder(order) {  // Complexity: 5
  if (!order) return false;
  if (!order.items) return false;
  if (order.items.length === 0) return false;
  if (!order.customer) return false;
  if (!order.customer.email) return false;
  return true;
}

function processOrder(order) {  // Complexity: 10
  if (!validateOrder(order)) return false;
  
  // Processing logic
  // ... complex processing ...
  
  return true;
}
```

### Simplify Conditional

**Before:**
```typescript
function checkStatus(user) {  // Complexity: 8
  if (user.active) {
    if (user.verified) {
      if (user.subscription) {
        if (user.subscription.active) {
          return 'premium';
        }
      }
    }
  }
  return 'basic';
}
```

**Code Action:** "Simplify nested conditionals"

**After:**
```typescript
function checkStatus(user) {  // Complexity: 4
  if (!user.active) return 'basic';
  if (!user.verified) return 'basic';
  if (!user.subscription) return 'basic';
  if (!user.subscription.active) return 'basic';
  return 'premium';
}
```

## Troubleshooting

### Server Not Starting

**Issue**: Editor shows "LSP server failed to start"

**Solutions**:
1. Check installation: `which codechroma-lsp` or `where codechroma-lsp`
2. Test manually: `codechroma-lsp --stdio` (should wait for input)
3. Check logs: Enable `--log-file` and review output
4. Verify Node.js: Requires Node.js 18+

### No Diagnostics Appearing

**Issue**: No complexity warnings shown

**Solutions**:
1. Check file type: Only `.ts`, `.tsx`, `.js`, `.jsx` supported
2. Check syntax: Files with parse errors are skipped
3. Check threshold: Complexity may be below diagnostic threshold
4. Enable diagnostics: Verify `diagnostics.enabled` is `true`
5. Check editor LSP client: Ensure diagnostics are enabled

### Code Actions Not Available

**Issue**: No refactoring suggestions

**Solutions**:
1. Check complexity: Code actions only for functions with complexity > 10
2. Enable code actions: Verify `codeActions.enabled` is `true`
3. Check cursor position: Must be on function declaration
4. Update editor: Some editors have limited code action support

### High CPU Usage

**Issue**: LSP server consuming excessive CPU

**Solutions**:
1. Increase debounce: Set `analysis.debounceMs` to 3000 or higher
2. Exclude files: Add patterns to `exclude` in config
3. Limit file size: Server skips files > 10,000 lines
4. Check for loops: Ensure no infinite analysis loops (check logs)

### Custom Commands Not Working

**Issue**: `codechroma.playAudio` or `codechroma.showGraph` fail

**Solutions**:
1. Check editor support: Not all editors support custom commands
2. Check command syntax: Verify exact command name
3. Check audio availability: Audio requires browser environment
4. Use VS Code extension: Full feature support in official extension

## Performance

- **Startup Time**: < 1 second
- **Analysis Time**: < 200ms per file
- **Memory Usage**: ~50MB base + ~1MB per open file
- **Debounce Delay**: 2 seconds (configurable)

### Performance Tips

1. **Increase debounce** for large files
2. **Exclude test files** if not needed
3. **Close unused files** to reduce memory
4. **Disable audio** in LSP mode (use VS Code extension for audio)

## Limitations

- **Audio/Visual**: Limited in LSP mode (use VS Code extension for full experience)
- **Graph Visualization**: Requires editor support for webviews
- **File Size**: Files > 10,000 lines are skipped
- **Languages**: Only TypeScript and JavaScript currently supported

## Development

### Building from Source

```bash
git clone https://github.com/yourusername/codechroma.git
cd codechroma/packages/lsp-server
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Debugging

Enable debug logging:

```bash
codechroma-lsp --stdio --log-level=debug --log-file=/tmp/codechroma-lsp.log
```

Then tail the log file:

```bash
tail -f /tmp/codechroma-lsp.log
```

## Protocol Details

### Initialization

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "capabilities": {
      "textDocument": {
        "synchronization": { "dynamicRegistration": true },
        "diagnostic": { "dynamicRegistration": true },
        "codeAction": { "dynamicRegistration": true }
      }
    }
  }
}
```

### Server Capabilities

```json
{
  "capabilities": {
    "textDocumentSync": 1,
    "diagnosticProvider": { "interFileDependencies": false },
    "codeActionProvider": true,
    "hoverProvider": true,
    "executeCommandProvider": {
      "commands": ["codechroma.playAudio", "codechroma.showGraph"]
    }
  }
}
```

## License

MIT - see [LICENSE](../../LICENSE) for details

## Related

- [@codechroma/core](../core/README.md) - Core analysis engine
- [codechroma-vscode](../vscode-extension/README.md) - VS Code extension (recommended for full features)
- [@codechroma/cli](../cli-analyzer/README.md) - Command-line tool

## Support

- [GitHub Issues](https://github.com/yourusername/codechroma/issues)
- [Documentation](https://codechroma.dev)
- [Discord Community](https://discord.gg/codechroma)

---

**Made with 🎃 by the CodeChroma team**
