# Release and Distribution Improvements

## Description

Establish a robust, automated **release and distribution process** for `formatr` to ensure:
- **Stable semantic versioning** following SemVer strictly.
- **Automated changelog generation** from commit messages.
- **Streamlined NPM release process** with clear release notes.
- **Quality gates** (tests, linting, type-checking) before every release.
- **Version tags** in Git for traceability.
- **GitHub Releases** with detailed release notes and assets.
- **Deprecation notices** for breaking changes in advance of major versions.

A professional release process is essential for:
- **User trust**: Clear versioning and changelogs help users understand what changed and whether to upgrade.
- **Maintainability**: Automated releases reduce manual errors and save time.
- **Adoption**: Projects with well-maintained releases are more likely to be adopted by enterprises.
- **Contributor experience**: Clear release guidelines make it easier for contributors to understand the project's stability.

Current state:
- `formatr` is at version `0.2.3`, suggesting it's in active development.
- There's no visible automated release process or changelog.
- Release notes likely need to be written manually.

### Example Usage

**Automated release workflow:**
1. Developer merges a PR with commit messages following Conventional Commits (e.g., `feat:`, `fix:`, `chore:`).
2. CI runs tests, linting, and type-checking.
3. CI automatically determines the next version based on commit types:
   - `feat:` → minor version bump (0.2.3 → 0.3.0)
   - `fix:` → patch version bump (0.2.3 → 0.2.4)
   - `BREAKING CHANGE:` → major version bump (0.2.3 → 1.0.0)
4. CI generates a changelog from commit messages.
5. CI creates a Git tag (e.g., `v0.3.0`).
6. CI publishes to NPM with the new version.
7. CI creates a GitHub Release with the changelog and links to docs.

**Example changelog (auto-generated):**
```markdown
## [0.3.0] - 2025-01-15

### Features
- Add `slice`, `pad`, `truncate`, and `replace` text filters (#1)
- Add strict mode for placeholders (#3)

### Bug Fixes
- Fix currency filter with invalid currency codes (#42)
- Fix escaping in quoted filter arguments (#47)

### Documentation
- Expand README with real-world examples (#5)
- Add CONTRIBUTING.md with contribution guidelines

### BREAKING CHANGES
- Remove deprecated `onMissing: "ignore"` option (use `"keep"` instead)

[Full Changelog](https://github.com/TimurManjosov/formatr/compare/v0.2.3...v0.3.0)
```

## Requirements

### Semantic Versioning
- [ ] Follow **SemVer** strictly:
  - `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
  - `MAJOR`: Breaking changes (incompatible API changes)
  - `MINOR`: New features (backwards-compatible)
  - `PATCH`: Bug fixes (backwards-compatible)
- [ ] Use pre-release versions for testing: `1.0.0-alpha.1`, `1.0.0-beta.1`, `1.0.0-rc.1`
- [ ] Reserve version `1.0.0` for stable release (when API is finalized and tested).

### Conventional Commits
- [ ] Enforce **Conventional Commits** for all commit messages:
  - `feat:` – New feature (minor version bump)
  - `fix:` – Bug fix (patch version bump)
  - `docs:` – Documentation changes (no version bump)
  - `chore:` – Maintenance tasks (no version bump)
  - `refactor:` – Code refactoring (no version bump)
  - `test:` – Test updates (no version bump)
  - `BREAKING CHANGE:` in commit body – Major version bump
- [ ] Use a commit message linter (e.g., `commitlint`) to enforce the format.
- [ ] Add pre-commit hooks to validate commit messages.

### Automated Changelog
- [ ] Use a changelog generator (e.g., `standard-version`, `semantic-release`, `release-please`).
- [ ] Automatically generate `CHANGELOG.md` from commit messages.
- [ ] Group changes by type: Features, Bug Fixes, Documentation, Breaking Changes, etc.
- [ ] Include links to PRs, commits, and GitHub issues.
- [ ] Update changelog on every release.

### CI/CD Pipeline
- [ ] Use GitHub Actions (or similar) to automate releases.
- [ ] Release workflow:
  1. Trigger on merge to `main` or manually via workflow_dispatch.
  2. Run tests, linting, type-checking, and build.
  3. Determine next version based on commit messages.
  4. Generate changelog.
  5. Update `package.json` version.
  6. Commit version bump and changelog.
  7. Create Git tag (e.g., `v0.3.0`).
  8. Push tag and commit to repository.
  9. Publish to NPM.
  10. Create GitHub Release with changelog and assets.

### NPM Release
- [ ] Publish to NPM with `npm publish` or `pnpm publish`.
- [ ] Use `.npmignore` to exclude development files (tests, benchmarks, examples).
- [ ] Ensure `package.json` includes correct `files`, `main`, `module`, `types` fields.
- [ ] Include a `README.md`, `LICENSE`, and `CHANGELOG.md` in the published package.
- [ ] Tag releases on NPM: `latest`, `next` (for pre-releases), `beta`, `alpha`.

### GitHub Releases
- [ ] Create a GitHub Release for every version.
- [ ] Include the auto-generated changelog in the release notes.
- [ ] Attach build artifacts if needed (e.g., bundled JS, types).
- [ ] Include upgrade notes for major versions.

### Quality Gates
- [ ] Before releasing, ensure:
  - All tests pass.
  - Linting passes.
  - Type-checking passes.
  - Build succeeds.
  - No known critical bugs.
- [ ] Use branch protection rules to enforce quality gates on `main`.

### Deprecation Policy
- [ ] For breaking changes, provide deprecation notices in advance:
  - Add deprecation warnings in the code (e.g., console.warn).
  - Document deprecated features in the README and changelog.
  - Maintain deprecated features for at least one minor version before removing.
- [ ] Example: If `onMissing: "ignore"` is deprecated in `0.3.0`, remove it in `1.0.0`.

### Pre-Release Versions
- [ ] Use pre-release versions for testing major changes:
  - `1.0.0-alpha.1` – Early testing, API may change significantly.
  - `1.0.0-beta.1` – Feature-complete, but may have bugs.
  - `1.0.0-rc.1` – Release candidate, final testing before stable.
- [ ] Publish pre-releases to NPM with a `next` or `beta` tag (not `latest`).

### Documentation
- [ ] Add a **RELEASING.md** file with step-by-step release instructions.
- [ ] Document the release process in the main README or CONTRIBUTING.md.
- [ ] Explain how to trigger a release (e.g., merge to `main`, run GitHub Action).

### Backwards Compatibility
- [ ] Releases should not break existing functionality unless it's a major version.
- [ ] Provide migration guides for breaking changes.
- [ ] Use TypeScript deprecation warnings (`@deprecated` JSDoc tag) for API changes.

## Acceptance Criteria

### Implementation
- [ ] Semantic versioning is enforced in `package.json`.
- [ ] Conventional Commits are enforced via `commitlint` and pre-commit hooks.
- [ ] Changelog is automatically generated from commit messages.
- [ ] GitHub Actions workflow automates the release process.
- [ ] Releases are published to NPM with correct tags.
- [ ] GitHub Releases are created with detailed release notes.
- [ ] Quality gates (tests, linting, build) are enforced before releases.

### Testing
- [ ] Release workflow is tested with a dry run (no actual publish).
- [ ] Changelog generation is tested with sample commits.
- [ ] Pre-release versions are tested in a staging environment.

### Documentation
- [ ] `RELEASING.md` file is created with release instructions.
- [ ] `CONTRIBUTING.md` includes guidelines for commit messages.
- [ ] `CHANGELOG.md` is generated and kept up-to-date.
- [ ] README includes a link to the latest release and changelog.

### Automation
- [ ] Releases are fully automated (no manual steps required).
- [ ] Release workflow runs on merge to `main` or via manual trigger.
- [ ] NPM publish and GitHub Release creation are automated.

### Developer Experience
- [ ] Contributors understand the commit message format.
- [ ] Maintainers can trigger releases easily.
- [ ] Users can easily understand what changed in each release.
- [ ] Deprecation notices give users time to migrate.

## Implementation Ideas

### Approach 1: Use `semantic-release`

Install and configure `semantic-release`:

```bash
pnpm add -D semantic-release @semantic-release/changelog @semantic-release/git @semantic-release/github
```

Create `.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    ["@semantic-release/git", {
      "assets": ["package.json", "CHANGELOG.md"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }]
  ]
}
```

Add GitHub Actions workflow:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Approach 2: Use `commitlint`

Enforce Conventional Commits:

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional husky
```

Create `commitlint.config.js`:

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

Add husky hook:

```bash
npx husky install
npx husky add .husky/commit-msg "npx --no -- commitlint --edit $1"
```

### Approach 3: Manual Release Script

Create `scripts/release.sh`:

```bash
#!/bin/bash
set -e

# Run quality checks
npm test
npm run lint
npm run build

# Determine next version
VERSION=$(npx standard-version --dry-run | grep "tagging release" | awk '{print $3}')

# Generate changelog and bump version
npx standard-version

# Push changes
git push --follow-tags origin main

# Publish to NPM
npm publish

echo "Released $VERSION successfully!"
```

### Approach 4: Use GitHub Release Action

Create a GitHub Action for releases:

```yaml
# .github/workflows/release.yml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., 0.3.0)'
        required: true

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: npm version ${{ github.event.inputs.version }}
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - run: git push --follow-tags
      - uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ github.event.inputs.version }}
          generate_release_notes: true
```

### Potential Pitfalls
- **Commit discipline**: Requires all contributors to follow Conventional Commits; enforce with CI.
- **Breaking changes**: Must carefully identify and document breaking changes.
- **Rollback**: If a release has issues, have a rollback plan (e.g., publish a new patch version with fixes).
- **NPM tokens**: Keep NPM tokens secure; use GitHub Secrets.
- **Changelog noise**: Too many commits can make changelogs verbose; consider squashing PRs.

## Additional Notes

- **Related issues**: None directly, but all features should be included in release notes.
- **Future extensions**:
  - Add automated security scanning (e.g., `npm audit`, Snyk).
  - Add performance regression testing in CI.
  - Add visual changelog with screenshots for major versions.
  - Add release announcements to Twitter, Reddit, or other channels.
- **Community feedback**: Encourage users to report issues with releases promptly.

---
