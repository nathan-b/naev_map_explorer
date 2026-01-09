# Release Process

This document describes how to create and publish releases for Naev Map Explorer.

## Overview

Releases are automated via GitHub Actions. When you push a version tag (e.g., `v1.0.0`), GitHub Actions will:
1. Build packages for Windows, macOS, and Linux
2. Run all tests before building
3. Create a GitHub Release with all binaries attached
4. Generate release notes automatically from commits

## Release Artifacts

Each release produces approximately 14 files (~1.2GB total):

**Windows:**
- `Naev Map Explorer-{version}-x64.exe` (NSIS installer)
- `Naev Map Explorer-{version}-arm64.exe` (NSIS installer)
- `Naev Map Explorer-{version}-x64-portable.exe` (no installation required)
- `Naev Map Explorer-{version}-arm64-portable.exe` (no installation required)

**macOS:**
- `Naev Map Explorer-{version}-x64.dmg` (drag-to-install)
- `Naev Map Explorer-{version}-arm64.dmg` (drag-to-install, Apple Silicon)
- `Naev Map Explorer-{version}-x64.zip` (alternative distribution)
- `Naev Map Explorer-{version}-arm64.zip` (alternative distribution)

**Linux:**
- `Naev Map Explorer-{version}-x86_64.AppImage` (universal Linux binary)
- `Naev Map Explorer-{version}-arm64.AppImage` (universal Linux binary)
- `naev-map-explorer_{version}_amd64.deb` (Debian/Ubuntu)
- `naev-map-explorer_{version}_arm64.deb` (Debian/Ubuntu)
- `naev-map-explorer-{version}.x86_64.rpm` (Fedora/RHEL/openSUSE)
- `naev-map-explorer-{version}.aarch64.rpm` (Fedora/RHEL/openSUSE)

## Prerequisites

- All changes committed and pushed to `main` branch
- All tests passing (`npm test`)
- Version number updated in `package.json`

## Creating a Release

### 1. Update Version Number

Edit `package.json` and update the version:

```json
{
  "version": "1.0.1"
}
```

### 2. Commit Version Bump

```bash
git add package.json
git commit -m "Bump version to 1.0.1"
git push origin main
```

### 3. Create and Push Tag

```bash
# Create tag matching the version in package.json
git tag v1.0.1

# Push the tag to trigger the release workflow
git push origin v1.0.1
```

**Important:** The tag must match the pattern `v*.*.*` (e.g., `v1.0.0`, `v2.1.3`). Tags without the `v` prefix will not trigger a release.

### 4. Monitor Build Progress

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see a "Build and Release" workflow running
4. The workflow runs three parallel jobs:
   - Build ubuntu-latest (~15 minutes)
   - Build macos-latest (~15 minutes)
   - Build windows-latest (~15 minutes)

### 5. Verify Release

Once all builds complete successfully:

1. Go to the **Releases** page in your repository
2. The new release should appear with:
   - Auto-generated release notes from commits
   - All 14 binary files attached
3. Download and test artifacts on target platforms if possible

### 6. Edit Release Notes (Optional)

GitHub auto-generates release notes, but you can edit them to:
- Highlight important features
- Add screenshots
- Include breaking changes
- Add upgrade instructions

## Manual Workflow Trigger

You can also trigger builds manually without creating a release:

1. Go to **Actions** → **Build and Release**
2. Click **Run workflow**
3. Enter a version number (e.g., "1.0.0")
4. Click **Run workflow**

This builds all platforms but does NOT create a GitHub Release. Artifacts are available in the workflow run for 7 days.

## Testing a Release

### Test Release (Recommended for First Release)

Create a test tag to verify the entire pipeline works:

```bash
git tag v0.0.1-test
git push origin v0.0.1-test
```

After verifying the release works:
1. Delete the test release from GitHub
2. Delete the test tag:
   ```bash
   git tag -d v0.0.1-test
   git push origin :refs/tags/v0.0.1-test
   ```

### Local Testing

Test builds locally before creating a release:

```bash
# Linux (on Linux)
npm run build:linux

# macOS (on macOS)
npm run build:mac

# Windows (on Windows, or Linux with Wine)
npm run build:win
```

Built packages appear in the `dist/` directory.

## Troubleshooting

### Build Fails on GitHub Actions

**Check the build logs:**
1. Go to Actions tab
2. Click the failed workflow run
3. Expand the failed job to see error details

**Common issues:**
- Tests failing: Fix tests and push before retrying
- Missing dependencies: Ensure package.json is correct
- Icon missing: Verify `build/icon.png` exists

**To retry:**
1. Fix the issue and push commits
2. Delete the failed tag: `git push origin :refs/tags/v1.0.0`
3. Re-create the tag: `git tag v1.0.0 && git push origin v1.0.0`

### RPM Builds Fail Locally

This is expected on Arch Linux and other non-RPM-based systems. The GitHub Actions runners (Ubuntu) have the necessary tools. As long as AppImage and deb packages build locally, the CI/CD pipeline will handle RPM builds.

### Workflow Doesn't Trigger

Verify:
- Tag name matches `v*.*.*` pattern
- Tag was pushed: `git push origin v1.0.0`
- Workflow file exists at `.github/workflows/build-release.yml`

## Code Signing (Future)

Currently, releases are **not code-signed**. Users will see security warnings on macOS and Windows:

**macOS:** "App is from an unidentified developer"
- Users: Right-click → Open → Open

**Windows:** "Windows protected your PC"
- Users: Click "More info" → "Run anyway"

### Adding Code Signing

To eliminate these warnings, you'll need:

**macOS:**
- Apple Developer account ($99/year)
- Developer ID Application certificate
- Add secrets to GitHub: `MAC_CERT_BASE64`, `MAC_CERT_PASSWORD`
- Uncomment signing lines in `.github/workflows/build-release.yml`

**Windows:**
- Code signing certificate ($200-400/year from DigiCert, Sectigo, etc.)
- Add secrets to GitHub: `WIN_CERT_BASE64`, `WIN_CERT_PASSWORD`
- Uncomment signing lines in `.github/workflows/build-release.yml`

See the comments in the workflow file for where to add signing configuration.

## Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

Examples:
- Bug fix: `v1.0.0` → `v1.0.1`
- New feature: `v1.0.1` → `v1.1.0`
- Breaking change: `v1.1.0` → `v2.0.0`

## Release Checklist

Before creating a release:

- [ ] All changes committed and pushed
- [ ] Tests passing locally (`npm test`)
- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated (if you maintain one)
- [ ] Local build tested (`npm run build:linux`)
- [ ] No console errors in dev mode
- [ ] Application icon looks good
- [ ] README.md reflects latest features

After creating a release:

- [ ] GitHub Actions builds completed successfully
- [ ] All artifacts present in release
- [ ] Downloaded and tested at least one artifact per platform
- [ ] Release notes edited if needed
- [ ] Announced release (social media, Discord, etc.)

## Build Times

Typical build times on GitHub Actions:
- **Linux builds:** ~10 minutes
- **macOS builds:** ~12 minutes
- **Windows builds:** ~10 minutes
- **Total pipeline:** ~15 minutes (runs in parallel)

## File Sizes

Approximate sizes per platform:
- **Windows installers:** ~60-80 MB each
- **Windows portable:** ~60-80 MB each
- **macOS DMG:** ~80-100 MB each
- **macOS ZIP:** ~70-90 MB each
- **Linux AppImage:** ~80-100 MB each
- **Linux deb:** ~60-80 MB each
- **Linux rpm:** ~60-80 MB each

Total per release: ~1.2 GB for all 14 files

## Support

For issues with the release process:
- Check GitHub Actions logs for build errors
- Verify workflow configuration in `.github/workflows/build-release.yml`
- Ensure electron-builder configuration in `package.json` is correct
- Test builds locally before pushing tags

## Resources

- [electron-builder documentation](https://www.electron.build/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
