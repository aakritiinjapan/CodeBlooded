# Publishing CodeChroma to VS Code Marketplace

## Prerequisites

Before publishing, you need:

1. **Microsoft Account** - Create one at https://account.microsoft.com if you don't have one
2. **Azure DevOps Organization** - Free at https://dev.azure.com
3. **Personal Access Token (PAT)** - For authentication

## Step 1: Create Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with your Microsoft account
3. Click "Create publisher"
4. Fill in:
   - **Publisher ID**: Choose a unique ID (e.g., `yourname` or `yourcompany`)
   - **Display Name**: Your name or company name
   - **Description**: Brief bio
5. Save the publisher

## Step 2: Generate Personal Access Token

1. Go to https://dev.azure.com
2. Click your profile icon → "Personal access tokens"
3. Click "New Token"
4. Configure:
   - **Name**: "VS Code Publishing"
   - **Organization**: All accessible organizations
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Select "Marketplace" → Check "Manage"
5. Click "Create" and **SAVE THE TOKEN** (you won't see it again!)

## Step 3: Update package.json

Replace `"publisher": "codechroma"` with your actual publisher ID from Step 1.

Also update these URLs in package.json:
- `repository.url`: Your actual GitHub repo URL
- `bugs.url`: Your GitHub issues URL
- `homepage`: Your GitHub homepage or project website

## Step 4: Create Extension Icon

Create a 128x128 PNG icon at `packages/vscode-extension/images/icon.png`

The icon should:
- Be square (128x128 or larger)
- Have a transparent or solid background
- Represent your extension visually

If you don't have an icon yet, remove the `"icon"` field from package.json.

## Step 5: Build and Test Locally

```bash
cd packages/vscode-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Package it (creates a .vsix file)
npm run package
```

This creates `codechroma-vscode-0.1.0.vsix`

### Test the VSIX locally:

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Click `...` menu → "Install from VSIX..."
4. Select the `.vsix` file
5. Test all features thoroughly

## Step 6: Login to vsce

```bash
# Install vsce globally if not already installed
npm install -g @vscode/vsce

# Login with your PAT
vsce login YOUR_PUBLISHER_ID
```

When prompted, paste your Personal Access Token from Step 2.

## Step 7: Publish

```bash
cd packages/vscode-extension

# Publish to marketplace
npm run publish

# Or manually:
vsce publish
```

The extension will be published and available within a few minutes!

## Step 8: Verify Publication

1. Go to https://marketplace.visualstudio.com/vscode
2. Search for "CodeChroma"
3. Verify your extension appears
4. Check the page looks correct

## Step 9: Update README

Once published, update the README.md with:

1. Replace `yourusername` with your actual GitHub username
2. Update the installation command:
   ```
   ext install YOUR_PUBLISHER_ID.codechroma-vscode
   ```
3. Add actual marketplace link
4. Update Discord/community links if you have them

## Publishing Updates

To publish a new version:

1. Update version in `package.json`:
   ```bash
   # Patch version (0.1.0 → 0.1.1)
   npm version patch
   
   # Minor version (0.1.0 → 0.2.0)
   npm version minor
   
   # Major version (0.1.0 → 1.0.0)
   npm version major
   ```

2. Build and publish:
   ```bash
   npm run build
   npm run publish
   ```

## Troubleshooting

### "Publisher not found"
- Make sure you created a publisher at marketplace.visualstudio.com/manage
- Verify the publisher ID in package.json matches exactly

### "Authentication failed"
- Your PAT may have expired - generate a new one
- Make sure you selected "Marketplace: Manage" scope when creating the PAT
- Run `vsce login YOUR_PUBLISHER_ID` again

### "Missing required field"
- Check package.json has: name, version, publisher, engines, description
- Add repository, bugs, and homepage URLs

### "Icon not found"
- Either create the icon at the specified path
- Or remove the "icon" field from package.json

### Build errors
- Run `npm run build` first to check for TypeScript errors
- Make sure all dependencies are installed: `npm install`
- Check that @codechroma/core is built: `npm run build:core` from root

## Pre-Publishing Checklist

- [ ] Publisher account created
- [ ] Personal Access Token generated and saved
- [ ] package.json updated with correct publisher ID
- [ ] Repository URLs updated in package.json
- [ ] Extension icon created (or icon field removed)
- [ ] Extension builds without errors (`npm run build`)
- [ ] Extension tested locally from VSIX
- [ ] README.md reviewed and accurate
- [ ] LICENSE file exists in repo
- [ ] .vscodeignore configured to exclude unnecessary files
- [ ] Logged in with vsce (`vsce login`)

## What Gets Published

The `.vscodeignore` file controls what's included. By default, it excludes:
- Source files (src/)
- Tests
- Development configs
- node_modules (bundled with webpack)

Only the `dist/` folder and essential files are published.

## Marketplace Listing

After publishing, you can enhance your marketplace page:

1. Go to https://marketplace.visualstudio.com/manage
2. Click your extension
3. Add:
   - Screenshots
   - Animated GIFs
   - Detailed description
   - Categories and tags
   - Q&A responses

## Resources

- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Marketplace](https://marketplace.visualstudio.com/vscode)
