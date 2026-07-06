#!/bin/bash
set -e

# Usage: ./scripts/package.sh [mac-arm64|mac-x64|win-x64]
PLATFORM="${1:-mac-arm64}"
NODE_VERSION="v24.14.1"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_VERSION=$(node -e "console.log(require('./package.json').version)")
DIST_DIR="$PROJECT_DIR/dist"
BUNDLE_DIR="$DIST_DIR/workplan-${APP_VERSION}-${PLATFORM}"

echo "=== Packaging WorkPlan v${APP_VERSION} for $PLATFORM ==="

# Determine Node.js download URL
case "$PLATFORM" in
  mac-arm64)
    NODE_URL="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-arm64.tar.gz"
    NODE_DIR="node-$NODE_VERSION-darwin-arm64"
    ;;
  mac-x64)
    NODE_URL="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-x64.tar.gz"
    NODE_DIR="node-$NODE_VERSION-darwin-x64"
    ;;
  win-x64)
    NODE_URL="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-win-x64.zip"
    NODE_DIR="node-$NODE_VERSION-win-x64"
    ;;
  *)
    echo "Unknown platform: $PLATFORM"
    echo "Usage: $0 [mac-arm64|mac-x64|win-x64]"
    exit 1
    ;;
esac

# Step 1: Build Next.js standalone
echo "--- Building Next.js standalone ---"
cd "$PROJECT_DIR"
npx next build

# Step 2: Create bundle directory
echo "--- Creating bundle ---"
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"

# Step 3: Copy standalone output (includes .next/server, etc.)
cp -a .next/standalone/. "$BUNDLE_DIR/"
# Add static assets into the existing .next directory
cp -r .next/static "$BUNDLE_DIR/.next/static"

# Copy public assets if they exist
if [ -d "public" ]; then
  cp -r public "$BUNDLE_DIR/public"
fi

# Step 4: Handle native extensions for target platform
echo "--- Setting up native extensions ---"

# 4a: Download correct better-sqlite3 prebuilt for target
PREBUILD_PLATFORM=""
PREBUILD_ARCH=""
case "$PLATFORM" in
  mac-arm64) PREBUILD_PLATFORM="darwin"; PREBUILD_ARCH="arm64" ;;
  mac-x64)   PREBUILD_PLATFORM="darwin"; PREBUILD_ARCH="x64" ;;
  win-x64)   PREBUILD_PLATFORM="win32";  PREBUILD_ARCH="x64" ;;
esac

SQLITE3_DIR="$BUNDLE_DIR/node_modules/better-sqlite3"
if [ -d "$SQLITE3_DIR" ]; then
  echo "  Downloading better-sqlite3 for $PLATFORM..."
  cd "$SQLITE3_DIR"
  npx prebuild-install \
    --platform "$PREBUILD_PLATFORM" \
    --arch "$PREBUILD_ARCH" 2>&1
  cd "$PROJECT_DIR"
fi

# 4b: Copy sqlite-vec native extension
SQLITE_VEC_PKG="sqlite-vec-darwin-arm64"
case "$PLATFORM" in
  mac-arm64) SQLITE_VEC_PKG="sqlite-vec-darwin-arm64" ;;
  mac-x64)   SQLITE_VEC_PKG="sqlite-vec-darwin-x64" ;;
  win-x64)   SQLITE_VEC_PKG="sqlite-vec-windows-x64" ;;
esac

SQLITE_VEC_SRC="node_modules/$SQLITE_VEC_PKG"
# Install platform package if not present (for cross-builds)
if [ ! -d "$SQLITE_VEC_SRC" ]; then
  echo "  Downloading $SQLITE_VEC_PKG for cross-build..."
  TMPDIR=$(mktemp -d)
  cd "$TMPDIR"
  npm pack "$SQLITE_VEC_PKG@0.1.9" --force 2>&1
  tar -xzf *.tgz
  mkdir -p "$PROJECT_DIR/$SQLITE_VEC_SRC"
  cp -r package/* "$PROJECT_DIR/$SQLITE_VEC_SRC/"
  cd "$PROJECT_DIR"
  rm -rf "$TMPDIR"
fi

if [ -d "$SQLITE_VEC_SRC" ]; then
  DEST="$BUNDLE_DIR/node_modules/$SQLITE_VEC_PKG"
  mkdir -p "$DEST"
  cp -r "$SQLITE_VEC_SRC/"* "$DEST/"
fi

# 4c: Copy sqlite-vec JS wrapper
mkdir -p "$BUNDLE_DIR/node_modules/sqlite-vec"
cp -r node_modules/sqlite-vec/* \
  "$BUNDLE_DIR/node_modules/sqlite-vec/"

# Step 5: Create empty database with schema applied
echo "--- Creating seed database ---"
mkdir -p "$BUNDLE_DIR/data"
SEED_DB="$BUNDLE_DIR/data/workplan.db"
rm -f "$SEED_DB"
# Apply migrations using the project's prisma setup
DATABASE_URL="file:$SEED_DB" npx prisma migrate deploy 2>&1

# Step 6: Download portable Node.js
echo "--- Downloading Node.js $NODE_VERSION for $PLATFORM ---"
CACHE_DIR="$DIST_DIR/.node-cache"
mkdir -p "$CACHE_DIR"
NODE_ARCHIVE="$CACHE_DIR/$NODE_DIR.tar.gz"

if [ "$PLATFORM" = "win-x64" ]; then
  NODE_ARCHIVE="$CACHE_DIR/$NODE_DIR.zip"
fi

if [ ! -f "$NODE_ARCHIVE" ]; then
  curl -L -o "$NODE_ARCHIVE" "$NODE_URL"
fi

# Extract Node.js binary
echo "--- Extracting Node.js ---"
mkdir -p "$BUNDLE_DIR/runtime"
if [ "$PLATFORM" = "win-x64" ]; then
  unzip -q "$NODE_ARCHIVE" -d "$CACHE_DIR"
  cp "$CACHE_DIR/$NODE_DIR/node.exe" "$BUNDLE_DIR/runtime/"
else
  tar -xzf "$NODE_ARCHIVE" -C "$CACHE_DIR" 2>/dev/null
  cp "$CACHE_DIR/$NODE_DIR/bin/node" "$BUNDLE_DIR/runtime/"
fi

# Step 7: Create launcher scripts
echo "--- Creating launchers ---"
cat > "$BUNDLE_DIR/start.sh" << 'LAUNCHER'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
export NODE_ENV=production
export PORT="${PORT:-3000}"
export DATABASE_URL="file:$DIR/data/workplan.db"

mkdir -p "$DIR/data"

echo ""
echo "  WorkPlan is starting..."
echo "  Open http://localhost:$PORT in your browser"
echo "  Press Ctrl+C to stop"
echo ""

"$DIR/runtime/node" "$DIR/server.js" &
SERVER_PID=$!

sleep 2
open "http://localhost:$PORT" 2>/dev/null || true

wait $SERVER_PID
LAUNCHER
chmod +x "$BUNDLE_DIR/start.sh"

# Mac .command file (double-clickable)
cp "$BUNDLE_DIR/start.sh" "$BUNDLE_DIR/Start WorkPlan.command"
chmod +x "$BUNDLE_DIR/Start WorkPlan.command"

# Windows .bat file
cat > "$BUNDLE_DIR/Start WorkPlan.bat" << 'WINLAUNCHER'
@echo off
set DIR=%~dp0
set NODE_ENV=production
set PORT=3000
set DATABASE_URL=file:%DIR%data\workplan.db

if not exist "%DIR%data" mkdir "%DIR%data"

echo.
echo   WorkPlan is starting...
echo   Open http://localhost:%PORT% in your browser
echo   Press Ctrl+C to stop
echo.

start http://localhost:%PORT%
"%DIR%runtime\node.exe" "%DIR%server.js"
WINLAUNCHER

# Step 8: Create zip
echo "--- Creating zip ---"
cd "$DIST_DIR"
ZIP_NAME="workplan-${APP_VERSION}-${PLATFORM}.zip"
rm -f "$ZIP_NAME"
zip -r -q "$ZIP_NAME" "workplan-${APP_VERSION}-${PLATFORM}"

FINAL_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
echo ""
echo "=== Done! ==="
echo "Bundle: $DIST_DIR/$ZIP_NAME ($FINAL_SIZE)"
echo ""
