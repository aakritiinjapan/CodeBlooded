# GitHub Actions Workflows

This directory contains CI/CD workflows for the codeblooded monorepo.

## Workflows

### Test (`test.yml`)
Runs on every push and pull request to `main` and `develop` branches.

**Actions:**
- Runs linting and formatting checks
- Executes all tests across packages
- Builds all packages to verify compilation
- Tests on Node.js 18.x and 20.x

### Build (`build.yml`)
Runs on pushes to `main` branch and version tags.

**Actions:**
- Builds all packages in dependency order
- Packages VS Code extension as `.vsix`
- Uploads build artifacts for download

### Publish (`publish.yml`)
Runs on GitHub releases or manual workflow dispatch.

**Actions:**
- Publishes npm packages (@codeblooded/core, @codeblooded/lsp-server, @codeblooded/cli)
- Publishes VS Code extension to marketplace
- Attaches extension to GitHub release

## Required Secrets

Configure these secrets in your GitHub repository settings:

### NPM_TOKEN
- **Purpose:** Authenticate npm package publishing
- **How to get:** 
  1. Login to npmjs.com
  2. Go to Access Tokens
  3. Generate new token with "Automation" type
  4. Add to GitHub Secrets

### VSCE_PAT
- **Purpose:** Authenticate VS Code Marketplace publishing
- **How to get:**
  1. Go to https://dev.azure.com
  2. Create Personal Access Token
  3. Set organization to "All accessible organizations"
  4. Set scope to "Marketplace: Manage"
  5. Add to GitHub Secrets

## Manual Publishing

You can manually trigger publishing via GitHub Actions UI:

1. Go to Actions tab
2. Select "Publish" workflow
3. Click "Run workflow"
4. Choose what to publish:
   - npm packages
   - VS Code extension
   - Both

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Test the test workflow
act push -W .github/workflows/test.yml

# Test the build workflow
act push -W .github/workflows/build.yml
```
