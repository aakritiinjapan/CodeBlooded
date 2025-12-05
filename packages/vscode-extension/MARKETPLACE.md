# codeblooded - Multi-Sensory Code Analysis with Optional Horror Features

Transform code complexity into an immersive sensory experience with audio-visual feedback and **optional psychological horror elements**.

---

## 🚨 IMPORTANT SAFETY WARNINGS

### ⚠️ Photosensitivity Warning

**This extension contains OPTIONAL features with flashing lights and rapid visual changes that may trigger seizures in individuals with photosensitive epilepsy.**

### 🎃 Psychological Horror Content (Optional, Disabled by Default)

codeblooded includes **opt-in horror features** with:
- Jump scares with disturbing imagery
- Screen distortion effects
- Phantom typing events
- Unsettling audio and visuals

### ❌ Not Recommended For

- ✗ Photosensitive epilepsy or seizure disorders
- ✗ Anxiety disorders, PTSD, or panic disorders
- ✗ Heart conditions sensitive to sudden stress
- ✗ Anyone preferring calm coding environments
- ✗ Users under 13 years of age

### 🛡️ Safety Features

- **🚨 Panic Button** (`Ctrl+Alt+S`): Instant disable
- **🛡️ Safe Mode**: Horror disabled by default
- **♿ Accessibility**: Respects "Reduce Motion" settings
- **📺 Screen Sharing Detection**: Auto-disables during presentations
- **💾 Code Safety**: Your actual code is never harmed

---

## 🎯 Core Features (Always Available)

### Real-Time Code Analysis
- **AST Parsing**: Analyze TypeScript/JavaScript complexity in real-time
- **Cyclomatic Complexity**: Track code complexity metrics
- **Visual Feedback**: Horror-themed color coding (Blue → Purple → Orange → Red)
- **Audio Feedback**: Frequency-mapped tones (220Hz-880Hz+)
- **Interactive Graphs**: D3.js visualizations with horror aesthetics

### Complexity Mapping

| Complexity | Color | Frequency | Theme |
|------------|-------|-----------|-------|
| 1-5 (Low) | Midnight Blue | 220-330Hz | Deep hum |
| 6-10 (Medium) | Toxic Purple | 330-523Hz | Eerie notes |
| 11-15 (High) | Blood Orange | 523-880Hz | Sharp tones |
| 16+ (Critical) | Crimson Red | 880Hz+ | Harsh distortion |

---

## 🎃 Optional Horror Features (Opt-In Only)

**⚠️ These features are DISABLED by default. You must explicitly enable them in settings.**

### Random Jumpscare System
- 6 unique jumpscare variants with synchronized audio
- Unpredictable timing (30-120 second cooldowns)
- Weighted randomization prevents repetition

### Screen Distortion Effects
- Screen shake (2-8 pixels)
- VHS artifacts and scan lines
- Chromatic aberration (RGB separation)
- Glitch effects and color inversion

### Progressive Escalation
- Horror intensity starts at 20% and gradually increases
- Escalates 5% every 2 minutes of coding
- Resets after 5 minutes of inactivity

### Entity Presence
- "Watching eyes" (👁️) appear in editor gutter
- Eyes move and avoid your cursor
- Maximum 3 eyes at once

### Phantom Typing
- Brief character insertions (1-3 chars)
- Automatically removed after 0.5-1.5 seconds
- **100% safe and reversible** - your code is never harmed

### Whispering Variables
- Variable names temporarily overlay with creepy alternatives
- `user` → `victim`, `data` → `secrets`, etc.
- Displays for 1-3 seconds then fades

### Context-Aware Triggers
- Special effects when typing horror keywords
- `kill`, `dead`, `error`, `fatal`, etc.
- 30% trigger chance with 20-second cooldowns

### Hidden Easter Eggs
- Secret horror elements to discover
- Achievement tracking
- Special effects for dedicated explorers

---

## 🚀 Quick Start

### Installation

1. Install from VS Code Marketplace
2. Open a TypeScript or JavaScript file
3. Start coding - audio/visual feedback activates automatically

### Enabling Horror Features (Optional)

1. Open Settings (`Ctrl+,`)
2. Search for `codeblooded.horror.enabled`
3. Set to `true`
4. Read and accept the warning dialog
5. Learn the panic button: `Ctrl+Alt+S`

**Remember**: Horror features are completely optional. codeblooded works perfectly without them!

---

## ⚙️ Configuration

### Essential Settings

```json
{
  // Core features
  "codeblooded.audio.enabled": true,
  "codeblooded.audio.volume": 0.5,
  "codeblooded.visual.animations": true,
  
  // Horror features (optional)
  "codeblooded.horror.enabled": false,  // Disabled by default
  "codeblooded.horror.intensity": 50,   // 0-100 scale
  "codeblooded.horror.safeMode": true,  // Quick disable
  
  // Individual effect toggles
  "codeblooded.horror.enableJumpscares": true,
  "codeblooded.horror.enableScreenEffects": true,
  "codeblooded.horror.enablePhantomEvents": true,
  "codeblooded.horror.enableEntityPresence": true,
  
  // Safety settings
  "codeblooded.safety.respectReduceMotion": true,
  "codeblooded.safety.maxFlashFrequency": 3,
  "codeblooded.safety.panicButtonKey": "ctrl+alt+s"
}
```

### Intensity Levels

- **0-30**: Minimal horror, rare events
- **31-60**: Moderate horror, occasional events
- **61-100**: Maximum horror, frequent events

---

## 🎮 Commands

### Essential Commands
- `codeblooded: Toggle Audio Feedback` - Enable/disable audio
- `codeblooded: Show AST Graph` - Open interactive visualization
- `codeblooded: Panic Button` - **Instantly disable all horror**
- `codeblooded: Toggle Safe Mode` - Quick horror enable/disable
- `codeblooded: Show Horror Controls` - View all settings

### Testing Commands
- `codeblooded: Test Audio` - Test audio system
- `codeblooded: Test Horror Popup` - Preview jumpscare
- `codeblooded: Test Screen Distortion` - Preview screen effects
- `codeblooded: Emergency Restore` - Clear all phantom effects

### Debug Commands
- `codeblooded: Show Debug Info` - View system state
- `codeblooded: Show Horror Engine State` - View horror status
- `codeblooded: Toggle Verbose Logging` - Enable detailed logs

---

## 🛡️ Safety & Accessibility

### Panic Button

Press `Ctrl+Alt+S` at ANY time to instantly disable all horror effects.

### Accessibility Features

- **Reduce Motion**: Automatically disables screen shake and rapid animations
- **High Contrast**: Adjusts horror effects for visibility
- **Screen Sharing Detection**: Auto-disables during presentations
- **Focus Mode**: Pauses effects during deep work
- **Flash Frequency Limiting**: Maximum 3 flashes/second

### Code Safety

- All phantom events are **temporary and reversible**
- Your saved files are **never modified**
- Emergency restore command available
- Automatic error recovery

---

## 📚 Documentation

- **[User Guide](https://github.com/aakritiinjapan/codeblooded/blob/main/HORROR_FEATURES_GUIDE.md)**: Complete horror features documentation
- **[Main README](https://github.com/aakritiinjapan/codeblooded/blob/main/README.md)**: Project overview and architecture
- **[GitHub Issues](https://github.com/aakritiinjapan/codeblooded/issues)**: Report bugs or request features

---

## 🎃 Why Horror Theme?

Code complexity can be scary. codeblooded embraces this with a horror aesthetic that makes quality feedback memorable and engaging. The optional psychological horror features add tension and unpredictability for developers who enjoy horror games.

**Important**: Horror features are entirely optional entertainment. codeblooded works perfectly as a standard code analysis tool without any horror elements.

---

## 🤝 Contributing

Contributions welcome! Visit our [GitHub repository](https://github.com/aakritiinjapan/codeblooded).

---

## 📄 License

MIT License - See [LICENSE](https://github.com/aakritiinjapan/codeblooded/blob/main/LICENSE)

---

## ⚠️ Final Reminder

**Before enabling horror features**:
1. Read all safety warnings
2. Ensure you don't have photosensitive epilepsy or related conditions
3. Learn the panic button: `Ctrl+Alt+S`
4. Start with low intensity (30-40)
5. Enable Safe Mode if you feel uncomfortable

**Your safety is our priority. When in doubt, keep horror features disabled.**

---

**Made with 🎃 by the codeblooded team**

*codeblooded: Where code quality meets psychological horror*
