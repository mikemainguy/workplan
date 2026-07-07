#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

VERSION="$1"
if [ -z "$VERSION" ]; then
  echo "Usage: bash scripts/release.sh <version>"
  echo "  e.g. bash scripts/release.sh 0.3.0"
  exit 1
fi

# Validate version format (x.y.z)
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: Version must be in x.y.z format"
  exit 1
fi

CURRENT=$(node -e "console.log(require('./package.json').version)")
echo "=== WorkPlan Release ==="
echo "  Current version: $CURRENT"
echo "  New version:     $VERSION"
echo ""

# Step 1: Update package.json version
echo "--- Updating package.json ---"
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json'));
  pkg.version = '$VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo "  package.json updated to $VERSION"

# Step 2: Build both platform bundles
echo ""
echo "--- Building Mac ARM64 bundle ---"
bash scripts/package.sh mac-arm64

echo ""
echo "--- Building Windows x64 bundle ---"
bash scripts/package.sh win-x64

# Step 3: Verify zips exist
MAC_ZIP="dist/workplan-${VERSION}-mac-arm64.zip"
WIN_ZIP="dist/workplan-${VERSION}-win-x64.zip"

if [ ! -f "$MAC_ZIP" ] || [ ! -f "$WIN_ZIP" ]; then
  echo "Error: Expected zip files not found"
  ls dist/*.zip 2>/dev/null
  exit 1
fi

echo ""
echo "--- Bundles ready ---"
ls -lh "$MAC_ZIP" "$WIN_ZIP"

# Step 4: Git commit and tag
echo ""
echo "--- Committing and tagging ---"
git add package.json
git commit -m "Release v${VERSION}"
git tag "v${VERSION}"

# Step 5: Push to origin
echo ""
echo "--- Pushing to origin ---"
git push origin main
git push origin "v${VERSION}"

# Step 6: Create GitHub release
echo ""
echo "--- Creating GitHub release ---"
RELEASE_URL=$(gh release create "v${VERSION}" \
  "$MAC_ZIP" \
  "$WIN_ZIP" \
  --title "WorkPlan v${VERSION}" \
  --generate-notes)

echo ""
echo "=== Release complete! ==="
echo "  Version: v${VERSION}"
echo "  Release: ${RELEASE_URL}"
echo "  Mac:     $(du -sh "$MAC_ZIP" | cut -f1)"
echo "  Windows: $(du -sh "$WIN_ZIP" | cut -f1)"
