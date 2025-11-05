# Quick Start: Publishing CodeChroma

## 🚀 Fast Track (5 minutes)

### 1. Create Publisher (one-time setup)
- Go to: https://marketplace.visualstudio.com/manage
- Sign in with Microsoft account
- Click "Create publisher"
- Choose a publisher ID (e.g., `yourname`)
- **Save this ID!**

### 2. Get Access Token (one-time setup)
- Go to: https://dev.azure.com
- Profile icon → "Personal access tokens"
- "New Token" → Name: "VS Code Publishing"
- Scopes: Check "Marketplace: Manage"
- **Copy and save the token!**

### 3. Update Configuration
Edit `package.json` and replace:
```json
"publisher": "codechroma"  →  "publisher": "YOUR_PUBLISHER_ID"
```

Replace `yourusername` in these URLs:
- `repository.url`
- `bugs.url`
- `homepage`

### 4. Build & Publish
```bash
cd packages/vscode-extension

# Install vsce if needed
npm install -g @vscode/vsce

# Login (paste your token when prompted)
vsce login YOUR_PUBLISHER_ID

# Build
npm run build

# Validate
npm run prepublish

# Publish!
npm run publish
```

Done! Your extension will be live in ~5 minutes.

## 📝 Before Publishing Checklist

- [ ] Publisher account created
- [ ] Personal Access Token saved
- [ ] `package.json` updated with your publisher ID
- [ ] GitHub URLs updated (replace `yourusername`)
- [ ] Extension builds: `npm run build`
- [ ] Logged in: `vsce login YOUR_PUBLISHER_ID`

## 🎨 Optional: Add Icon

Create a 128x128 PNG at `images/icon.png` or remove the `"icon"` field from package.json.

## 📚 Need More Details?

See `PUBLISHING.md` for the complete guide.

## 🔄 Publishing Updates

```bash
# Bump version
npm version patch  # 0.1.0 → 0.1.1

# Publish
npm run publish
```

## 🆘 Common Issues

**"Publisher not found"**
→ Update `"publisher"` in package.json with your actual ID

**"Authentication failed"**
→ Run `vsce login YOUR_PUBLISHER_ID` again

**"Missing repository"**
→ Update GitHub URLs in package.json

## 🎃 That's it!

Your extension will appear at:
`https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER_ID.codechroma-vscode`
