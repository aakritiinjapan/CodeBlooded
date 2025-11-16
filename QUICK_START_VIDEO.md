# 🎬 Quick Start - Process Jumpscare Video

## TL;DR - 3 Commands

```powershell
# 1. Install FFmpeg
winget install ffmpeg

# 2. Process video
cd packages/vscode-extension/media/images
.\process-video.bat

# 3. Reload extension and test!
```

## What You'll Get

A 4-second silent jumpscare video that plays with your custom audio!

**Before:** Static image with CSS animations (slow, not scary)
**After:** Real horror video with perfect audio sync (TERRIFYING! 💀)

## Expected Output

```
Processing video...
Input: watermarked-a987f40f-b583-4c26-9995-23509e85d89b.mp4
Output: jumpscare-silent.mp4 (6-10 seconds, no audio)

Success! Created: jumpscare-silent.mp4
Duration: 4 seconds
Audio: Removed
```

## Test It

1. Open VS Code extension development window
2. Open a TypeScript file
3. Add 5+ syntax errors
4. Wait 2 seconds
5. **JUMPSCARE!** 👻🎃

The video will play for 4 seconds with your custom horror audio perfectly synced!

---

**Need help?** See `JUMPSCARE_VIDEO_SETUP.md` for detailed instructions.
