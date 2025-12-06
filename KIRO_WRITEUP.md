# How I Built CodeBlooded with Kiro: A Developer's Journey

## The Problem That Started It All

It happened on a regular Tuesday at work. I was staring at my code—functional, sure, but an absolute mess. Nested loops, sprawling functions, the kind of code that makes you wince when you look at it six months later. I could've just thrown it at an AI and asked it to clean up, but that felt wrong. I didn't want something to do the work *for* me; I wanted to learn how to write better code myself.

That's when the idea hit me: what if there was a tool that could teach me to code better, but make it fun instead of feeling like homework? Something that would give me feedback in a way I'd actually remember. And that's how CodeBlooded was born—a code complexity analyzer with a horror twist.

## Starting with Vibe Coding: From Idea to Foundation

I started simple. I opened Kiro and typed: "I want a code helper that detects bad code."

That's it. No detailed spec, no architecture diagrams, just a rough idea.

What happened next blew my mind. Kiro immediately understood what I was trying to build and suggested using AST (Abstract Syntax Tree) analysis and cyclomatic complexity metrics. It explained how these could be the foundation for detecting "bad code" patterns. This one suggestion became the entire technical foundation of CodeBlooded.

### The Most Impressive Code Generation

The most impressive moment came when I asked Kiro to implement the AST analyzer. Within minutes, it generated a complete parser registry system that could handle multiple languages (TypeScript, JavaScript, Python) with a plugin architecture for extensibility. The code included:

- Proper error handling for parse failures
- Performance optimizations (parsing files under 1000 lines in <500ms)
- Complexity calculation algorithms that counted decision points accurately
- A clean interface that made it easy to add new language parsers later

What really impressed me was that it wasn't just working code—it was *production-ready* code with proper TypeScript types, error boundaries, and even comments explaining the complexity calculations. This saved me days of research and implementation time.

## Transitioning to Spec-Driven Development

After getting that initial foundation from vibe coding, I realized I needed something more structured. The project was getting complex, and I wanted to ensure I was building it right. That's when I decided to try Kiro's spec-driven development approach.

I took what Kiro had suggested, refined it based on my needs, and asked Kiro to create a formal spec. The difference was night and day.

### How Spec-Driven Development Changed Everything

**The Requirements Phase:**
Kiro helped me transform my vague ideas into formal requirements using the EARS (Easy Approach to Requirements Syntax) pattern. Instead of "the system should analyze code," I ended up with precise requirements like:

> "WHEN a source code file is provided to the AST Analyzer, THE codeblooded System SHALL parse the file into an Abstract Syntax Tree within 500 milliseconds for files under 1000 lines"

This precision forced me to think through edge cases I hadn't considered. What happens with syntax errors? How do we handle unsupported languages? The requirements document became my north star.

**The Design Phase:**
The design document Kiro created was comprehensive but not overwhelming. It included:

- Component architecture with clear separation of concerns
- Data flow diagrams showing how code goes from source → AST → metrics → sensory output
- Interface definitions that made implementation straightforward
- Error handling strategies for each component

But here's what really made spec-driven development shine: **correctness properties**.

Kiro helped me define formal properties that my code should satisfy. For example:
- *Property 1: For any valid source code, parsing then analyzing should never throw an unhandled exception*
- *Property 2: For any complexity value, the mapped frequency should be within the defined range for that complexity level*

These properties became the foundation for property-based testing later, catching bugs I never would have found with regular unit tests.

**The Task Breakdown:**
The tasks document broke down the entire implementation into manageable chunks. Each task was:
- Clearly scoped (no vague "implement the thing")
- Referenced specific requirements
- Built incrementally on previous tasks
- Included testing as sub-tasks

This made it easy to track progress and know exactly what to work on next.

### Spec-Driven vs. Vibe Coding: When to Use Each

After experiencing both approaches, here's what I learned:

**Vibe Coding is perfect for:**
- Initial exploration and prototyping
- Getting quick suggestions and ideas
- Implementing small, isolated features
- When you're not sure exactly what you want yet

**Spec-Driven Development shines when:**
- Building complex, multi-component systems
- You need to ensure correctness and safety (critical for CodeBlooded's horror features!)
- Working on features that will evolve over time
- You want clear documentation for future maintenance

For CodeBlooded, I used vibe coding to explore the initial concept, then switched to spec-driven development once I knew what I was building. This hybrid approach was incredibly effective.

## Adding the Fun: The Psychological Horror Enhancement

After building the core analyzer, I realized something was missing—the *fun* part. Code complexity analysis is useful, but it's not exactly thrilling. So I asked Kiro: "How can I make this more engaging and fun?"

Kiro came back with suggestions that completely transformed the project:
- Random jumpscares triggered during coding
- Screen distortion effects that intensify with code complexity
- "Entity presence" indicators (watching eyes that follow you)
- Phantom typing events
- Progressive horror escalation over time

These suggestions were gold. I immediately asked Kiro to create another spec for "psychological horror enhancements," and it delivered a complete design for turning CodeBlooded from a useful tool into an *experience*.

## Leveraging Steering Docs: Teaching Kiro About Safety

Here's where things got really interesting. Horror effects are fun, but they can also be dangerous if not implemented correctly. Photosensitive users could have seizures from flashing lights. Phantom typing could corrupt someone's code if not handled properly.

I needed Kiro to understand that safety wasn't optional—it was paramount.

### Creating the Safety Standards Steering Doc

I created a steering document called `safety-standards.md` that laid out non-negotiable rules:

- Flash frequency must NEVER exceed 3 flashes per second
- All phantom events must be reversible within 2 seconds
- Respect system accessibility settings (Reduce Motion)
- Provide a panic button for instant disable
- Never modify saved files on disk

The beauty of steering docs is that they're *always* included in Kiro's context. Every time I asked Kiro to implement a horror effect, it automatically checked against these safety standards. 

For example, when implementing the jumpscare system, Kiro's code included:

```typescript
async trigger(): Promise<void> {
  if (!this.flashLimiter.canFlash()) return;
  if (this.accessibilitySettings.reduceMotion) return;
  if (!this.isEnabled) return; // Panic button check
  
  await this.showHorrorPopup();
}
```

I didn't have to remind it about safety—the steering doc ensured it was baked into every implementation.

### The Agent Personality Steering Doc

I also created an `AGENTS.md` steering doc that defined how Kiro should communicate when working on this project. It taught Kiro to:

- Use horror-themed language ("exorcise the complexity demon")
- Always prioritize safety over horror intensity
- Be explicit about safety mechanisms in code comments
- Frame high complexity as "code nightmares" that need refactoring

This made the entire development experience more cohesive and fun. Kiro would say things like:

> "The phantom has become too real - it refuses to fade back into the void. This is a critical safety violation."

Instead of boring technical explanations, I got engaging, thematic feedback that matched the project's vibe.

## Automating Workflows with Agent Hooks

As the project grew, I found myself doing repetitive checks. Every time I modified horror effect code, I needed to verify it respected safety constraints. Every time I added new code, I wanted to check if it contained horror keywords that should trigger special effects.

That's when I discovered agent hooks.

### Hook 1: Horror Keyword Trigger

I created a hook that automatically runs whenever I write code to TypeScript or JavaScript files. It scans for horror keywords like "kill," "dead," "error," and "fatal."

```json
{
  "name": "Horror Keyword Trigger",
  "event": "postToolUse",
  "matcher": {
    "tool": "@builtin/write",
    "filePattern": "**/*.{ts,tsx,js,jsx}"
  },
  "command": "node",
  "args": ["scripts/check-horror-keywords.js"]
}
```

Now, whenever I'm implementing a feature and type something like "killProcess," the hook automatically reminds me that this could trigger a horror effect and suggests implementing the corresponding trigger in the context-aware system.

This hook improved my development process by:
- Catching opportunities for context-aware triggers I might have missed
- Ensuring consistency in keyword detection
- Saving me from manually checking every file

### Hook 2: Safety Property Checker

The second hook runs at the end of every Kiro session and validates that all horror effects respect safety properties:

```json
{
  "name": "Safety Property Checker",
  "event": "stop",
  "command": "node",
  "args": ["scripts/validate-safety-properties.js"]
}
```

This script checks:
- Flash frequency limits in all animation code
- State restoration logic in phantom events
- Panic button integration in all effect managers
- Accessibility setting checks

If any safety property is violated, the hook fails and shows me exactly what needs to be fixed. This automated safety net gave me confidence that I wasn't accidentally introducing dangerous code.

### The Impact of Hooks

These hooks transformed my workflow from reactive to proactive. Instead of remembering to run checks manually, they happen automatically at the right moments. It's like having a safety inspector and feature suggester working alongside me constantly.

The horror keyword hook alone saved me hours of manual code review, and the safety checker caught two potential issues before they made it into production.

## The Results: A Complete Project in Record Time

Looking back, I'm amazed at what I built with Kiro's help:

**Core Features:**
- Multi-language AST analyzer (TypeScript, JavaScript, Python)
- Real-time complexity analysis with audio-visual feedback
- D3.js force-directed graph visualizations
- VS Code extension with 15+ commands

**Horror Enhancement Features:**
- 2 unique jumpscare variants with synchronized audio
- Screen distortion effects (shake, glitch, VHS, chromatic aberration)
- Progressive horror escalation system
- Entity presence indicators
- Phantom typing with safe state management
- Whispering variables overlay
- Context-aware keyword triggers
- Time dilation effects
- 11 hidden easter eggs

**Safety Features:**
- Photosensitivity warnings and flash frequency limiting
- Panic button (Ctrl+Alt+S) for instant disable
- Accessibility compliance (Reduce Motion support)
- Screen sharing detection
- Granular effect controls
- Safe mode (horror disabled by default)

All of this, documented with comprehensive specs, tested with property-based tests, and protected by automated safety checks.

## Key Takeaways: How to Use Kiro Effectively

Based on my experience building CodeBlooded, here's what I learned:

### 1. Start with Vibe Coding for Exploration
Don't overthink the beginning. Throw your rough idea at Kiro and see what it suggests. Some of my best architectural decisions came from Kiro's initial suggestions.

### 2. Switch to Spec-Driven for Complex Features
Once you know what you're building, create a spec. The structure forces you to think through edge cases, and the correctness properties catch bugs early.

### 3. Use Steering Docs to Teach Kiro Your Domain
Steering docs are incredibly powerful. They let you encode domain knowledge, safety requirements, and communication style once, and Kiro remembers it forever. For a project like CodeBlooded where safety is critical, this was essential.

### 4. Automate Repetitive Checks with Hooks
If you find yourself doing the same verification steps repeatedly, create a hook. The time investment pays off immediately, and you'll catch issues you would have missed manually.

### 5. Hybrid Approach is Best
Use vibe coding for quick iterations and exploration. Use spec-driven development for complex features that need formal correctness. Use steering docs to maintain consistency. Use hooks to automate quality checks. Together, they're unstoppable.

## Conclusion

CodeBlooded started as a simple idea—"I want to learn to code better"—and became a full-featured, production-ready VS Code extension with horror-themed psychological effects, all built in a fraction of the time it would have taken without Kiro.

The combination of vibe coding for exploration, spec-driven development for structure, steering docs for domain knowledge, and agent hooks for automation created a development workflow that felt like having an expert pair programmer who never gets tired, never forgets safety requirements, and always suggests creative solutions.

If you're building something complex, don't just use one Kiro feature—use them all together. That's where the real magic happens.

## Technology Stack

Building CodeBlooded required a diverse set of technologies, each chosen for specific capabilities:

### Core Languages & Runtime
- **TypeScript 5.2** - Primary language for type safety and developer experience
- **Node.js 18+** - Runtime environment for all packages
- **JavaScript** - For dynamic webview content and audio synthesis

### Code Analysis & Parsing
- **@typescript-eslint/parser 6.0** - AST parsing for TypeScript/TSX files
- **esprima 4.0** - JavaScript/JSX AST parsing
- **filbert 0.1** - Python code parsing support

### Audio Synthesis & Processing
- **Tone.js 14.7** - Advanced audio synthesis library for horror sound effects
- **Web Audio API** - Browser-based audio processing
- **speaker 0.3** - Node.js audio output for CLI tool

### Visualization & Graphics
- **D3.js 7.8** - Force-directed graph visualizations of code structure
- **SVG** - Vector graphics for cobweb overlays, skull icons, and horror effects
- **CSS3 Animations** - Screen shake, glitch effects, blood drips, VHS distortion

### VS Code Extension Development
- **VS Code Extension API 1.80+** - Core extension framework
- **Webview API** - For jumpscare popups and graph visualizations
- **Decoration API** - Color-coded highlighting and entity presence indicators
- **Configuration API** - User settings and preferences
- **Keybinding API** - Panic button and command shortcuts

### Build Tools & Bundling
- **Webpack 5** - Module bundling for VS Code extension
- **ts-loader 9.4** - TypeScript compilation in Webpack
- **npm workspaces** - Monorepo management
- **vsce 2.22** - VS Code extension packaging and publishing

### Testing & Quality
- **Jest 29.6** - Unit testing framework
- **ts-jest 29.1** - TypeScript support for Jest
- **Property-Based Testing** - Custom implementation for safety properties
- **ESLint 8.47** - Code linting with TypeScript support
- **Prettier 3.0** - Code formatting

### Development Tools
- **TypeScript Compiler (tsc)** - Type checking and compilation
- **rimraf 5.0** - Cross-platform file cleanup
- **Git** - Version control
- **GitHub** - Repository hosting and collaboration

### Project Architecture
- **Monorepo Structure** - Organized with npm workspaces
  - `@codeblooded/core` - Shared analysis engine
  - `codeblooded-vscode` - VS Code extension
  - `cli-analyzer` - Command-line tool (planned)
  - `lsp-server` - Language Server Protocol (planned)

### APIs & Protocols
- **Language Server Protocol (LSP)** - For editor-agnostic integration (planned)
- **VS Code Extension API** - Commands, decorations, webviews, status bar
- **Web Audio API** - Real-time audio synthesis and effects
- **File System API** - Code file reading and analysis

### Safety & Accessibility
- **System Accessibility APIs** - Reduce Motion detection
- **Screen Sharing Detection** - Automatic horror effect disabling
- **Flash Frequency Limiting** - Photosensitivity protection (max 3Hz)
- **State Management** - Safe phantom event restoration

### Configuration & Storage
- **VS Code Settings API** - User preferences persistence
- **JSON** - Configuration files and data serialization
- **Local Storage** - Extension state and easter egg tracking

### Documentation & Specs
- **Markdown** - README, specs, and documentation
- **EARS (Easy Approach to Requirements Syntax)** - Formal requirements specification
- **Mermaid** - Architecture diagrams (in design docs)

### Kiro-Specific Technologies
- **Kiro Spec-Driven Development** - Requirements, design, and task management
- **Kiro Steering Docs** - Safety standards and agent personality
- **Kiro Agent Hooks** - Automated workflow validation
  - Horror keyword detection hook
  - Safety property validation hook

### Why These Technologies?

**TypeScript** was essential for maintaining code quality in a complex project with multiple horror effects that needed to be safe and reliable.

**Tone.js** provided the advanced audio synthesis capabilities needed for horror-themed sound design (tritone intervals, distortion effects, gothic organ chords).

**D3.js** enabled the interactive force-directed graphs that visualize code structure with horror aesthetics (cobwebs, skulls, fog effects).

**VS Code Extension API** gave us the platform to create an immersive coding experience with real-time feedback, decorations, and webview-based horror effects.

**Jest + Property-Based Testing** ensured safety properties were maintained (flash frequency limits, state restoration, panic button functionality).

**Webpack** bundled everything into a single extension file, making distribution and installation seamless.

The combination of these technologies created a robust, safe, and genuinely engaging horror-themed code analysis tool that respects user safety while delivering an unforgettable experience.

---

*CodeBlooded is available on the VS Code Marketplace. Try it if you dare. 🎃*
