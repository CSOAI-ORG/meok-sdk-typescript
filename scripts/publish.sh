#!/usr/bin/env bash
# @meok/sdk — npm Publish Script
# Usage: ./scripts/publish.sh [patch|minor|major]
# Default bump level: patch

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUMP="${1:-patch}"

cd "${ROOT_DIR}"

echo "🔍 Current version: $(node -p "require('./package.json').version")"

# ── 1. Bump version in package.json ─────────────────────────────────
echo "📦 Bumping ${BUMP} version..."
npm version "${BUMP}" --no-git-tag-version
NEW_VERSION="$(node -p "require('./package.json').version")"
echo "✅ New version: ${NEW_VERSION}"

# ── 2. Run tests ────────────────────────────────────────────────────
echo "🧪 Running tests..."
npm test

# ── 3. Build ────────────────────────────────────────────────────────
echo "🔨 Building..."
npm run build

# ── 4. Publish to npm ───────────────────────────────────────────────
echo "🚀 Publishing to npm..."
npm publish --access public

# ── 5. Tag git release ──────────────────────────────────────────────
echo "🏷️  Tagging release v${NEW_VERSION}..."
git add package.json package-lock.json
git commit -m "release: v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
git push origin main --tags

echo "🎉 @meok/sdk v${NEW_VERSION} published successfully!"
