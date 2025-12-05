# CodeChroma Kiro Configuration

This directory contains all Kiro-specific configuration, steering files, hooks, and specifications for the CodeChroma project.

## Directory Structure

```
.kiro/
├── steering/              # Agent guidance and patterns
│   ├── safety-standards.md      # Mandatory safety requirements (always included)
│   ├── horror-patterns.md       # Reusable horror implementation patterns (file-matched)
│   └── AGENTS.md               # Agent personality and communication style (always included)
├── hooks/                 # Event-driven automation
│   ├── horror-keyword-trigger.json  # Triggers effects on horror keywords
│   └── safety-check.json           # Validates safety properties
├── settings/              # MCP and other settings
│   └── mcp.json          # MCP server configurations
└── specs/                 # Feature specifications
    ├── codeblooded/                    # Core functionality spec
    └── psychological-horror-enhancements/  # Horror features spec
```

## Steering Files

### safety-standards.md
**Inclusion**: Always

Defines mandatory safety requirements for all CodeChroma development:
- Photosensitivity protection (3 flashes/second max)
- Code safety (reversible effects only)
- User control (opt-in, panic button)
- Accessibility compliance (Reduce Motion support)
- Performance standards (non-blocking operations)

### horror-patterns.md
**Inclusion**: File-matched (`**/*horror*.{ts,tsx,js,jsx}`)

Provides reusable implementation patterns for horror effects:
- Random Event Trigger pattern
- Safe State Modification pattern
- Accessibility-Aware Animation pattern
- Flash Frequency Limiter pattern
- Panic Button Integration pattern
- Context-Aware Triggers pattern
- Progressive Intensity Scaling pattern

### AGENTS.md
**Inclusion**: Always (community standard)

Defines the agent's personality and communication style:
- Horror-themed but helpful tone
- Safety-conscious approach
- Technical precision with dark metaphors
- Code review guidelines
- Forbidden behaviors

## Hooks

### horror-keyword-trigger.json
**Event**: `postToolUse` on `@builtin/write`

Monitors code changes for horror keywords (kill, dead, error, etc.) and triggers context-aware effects with 30% probability and 20-second cooldown.

**Script**: `scripts/check-horror-keywords.js`

### safety-check.json
**Event**: `stop`

Validates that horror effects respect safety constraints after agent completion:
- Flash frequency limits
- State restoration patterns
- Panic button integration
- Accessibility checks
- Non-blocking operations

**Script**: `scripts/validate-safety-properties.js`

## MCP Servers

### horror-audio-generator
**Status**: Disabled (placeholder)

Would generate horror-themed audio effects for jumpscares and ambient sounds.

### horror-image-processor
**Status**: Disabled (placeholder)

Would process and distort images for jumpscare popups and visual effects.

## Specifications

### codeblooded
Core functionality specification for the multi-sensory code analysis framework.

### psychological-horror-enhancements
Specification for transforming CodeChroma into a psychological horror experience with:
- Random jumpscare system
- Screen distortion effects
- Progressive horror escalation
- Entity presence indicators
- Phantom typing events
- Context-aware triggers

## Usage

### Running Validation

```bash
kiro-cli validate
```

This checks:
- JSON schema for all `.json` files
- Markdown front-matter YAML in steering files
- AGENTS.md parseability
- MCP server command executability

### Testing Hooks Locally

```bash
# Test horror keyword trigger
echo '{"tool_input":{"operations":[{"type":"write","content":"kill the bug","path":"test.ts"}]}}' | node scripts/check-horror-keywords.js

# Test safety validator
echo '{"hook_event_name":"stop","cwd":"'$(pwd)'"}' | node scripts/validate-safety-properties.js
```

### Enabling Hooks

Hooks are enabled by default. To disable a hook, set `"enabled": false` in its JSON file.

### Adding New Steering Files

1. Create `.md` file in `.kiro/steering/`
2. Add YAML front-matter:
   ```yaml
   ---
   inclusion: always  # or fileMatch or manual
   fileMatchPattern: "**/*.ts"  # if fileMatch
   ---
   ```
3. Write content in Markdown

### Adding New Hooks

1. Create `.json` file in `.kiro/hooks/`
2. Define hook configuration:
   ```json
   {
     "name": "Hook Name",
     "event": "postToolUse",
     "command": "node",
     "args": ["scripts/your-script.js"],
     "timeout_ms": 5000
   }
   ```
3. Create corresponding script in `scripts/`

## Best Practices

1. **Always validate** before committing: `kiro-cli validate`
2. **Test hooks locally** before relying on them in automation
3. **Document safety mechanisms** in steering files
4. **Use property-based tests** for safety properties
5. **Keep MCP configs** in version control (use env vars for secrets)

## Hackathon Submission

This `.kiro` directory is **required** for Kiroween hackathon submission. Judges will:

1. Clone the repo
2. Run `kiro-cli validate`
3. Check for proper structure
4. Review steering files for quality
5. Test hooks for functionality

**Do not gitignore this directory!** It's proof of Kiro usage.

## Resources

- [Kiro Documentation](https://kiro.dev/docs)
- [Steering Files Guide](https://kiro.dev/docs/steering)
- [Hooks Guide](https://kiro.dev/docs/hooks)
- [MCP Servers](https://kiro.dev/docs/mcp)
- [Spec-Driven Development](https://kiro.dev/docs/specs)
