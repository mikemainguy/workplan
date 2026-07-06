# WorkPlan

Personal context engine for managing interactions, people, and projects. Helps you remember what was discussed, what's owed, and what to prepare for across hundreds of daily interactions.

## Development

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

## Tech Stack

- Next.js 16 (App Router, Server Components)
- SQLite via Prisma + better-sqlite3
- sqlite-vec for vector search
- @xenova/transformers for local ML embeddings
- shadcn/ui + Tailwind CSS

## Building Portable Distributions

The app can be packaged as a standalone portable bundle that requires zero dependencies on the target machine. No Node.js, no npm, no admin rights needed.

### Prerequisites (build machine only)

- Node.js v24+
- npm

### Build a bundle

```bash
# Mac (Apple Silicon)
bash scripts/package.sh mac-arm64

# Mac (Intel)
bash scripts/package.sh mac-x64

# Windows (64-bit) — can be built from Mac
bash scripts/package.sh win-x64
```

Output goes to `dist/workplan-{version}-{platform}.zip`.

### What's in the bundle

- Portable Node.js runtime (~35MB, no install needed)
- Next.js standalone server + all app code
- Pre-built native addons (better-sqlite3, sqlite-vec)
- Prisma migration files (database auto-created on first run)
- Launcher scripts

### User instructions

1. Download the zip for your platform
2. Unzip to any folder
3. Double-click `Start WorkPlan.command` (Mac) or `Start WorkPlan.bat` (Windows)
4. Browser opens to http://localhost:3000
5. To stop: use the Shutdown button in the sidebar, or press Ctrl+C in the terminal

Data is stored in `~/.workplan/` (your home directory). This means upgrades are seamless — just unzip the new version and run it. Your data is automatically found.

You can override the data location by setting the `WORKPLAN_DATA_DIR` environment variable.

## Releasing a New Version

1. Bump version in `package.json`
2. Build bundles:
   ```bash
   bash scripts/package.sh mac-arm64
   bash scripts/package.sh win-x64
   ```
3. Commit and tag:
   ```bash
   git add -A && git commit -m "Release v0.2.0"
   git push origin main
   ```
4. Create GitHub release with bundles attached:
   ```bash
   gh release create v0.2.0 \
     dist/workplan-0.2.0-mac-arm64.zip \
     dist/workplan-0.2.0-win-x64.zip \
     --title "WorkPlan v0.2.0" 
     
   ```

The app checks for new releases on startup and shows a banner in the sidebar when an update is available.
