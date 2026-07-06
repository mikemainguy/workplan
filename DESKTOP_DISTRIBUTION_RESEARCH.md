# Desktop Distribution Research: Next.js + SQLite + ML Embeddings

**Date:** July 2026
**Project:** workplan-init (Next.js 16, Prisma 7, better-sqlite3, sqlite-vec, @xenova/transformers)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Approach 1: Electron](#approach-1-electron)
3. [Approach 2: Tauri](#approach-2-tauri)
4. [Approach 3: Neutralinojs](#approach-3-neutralinojs)
5. [Approach 4: Next.js Standalone + caxa](#approach-4-nextjs-standalone--caxa)
6. [Approach 5: Next.js Standalone + Node.js SEA](#approach-5-nextjs-standalone--nodejs-sea)
7. [Approach 6: Next.js Standalone + pkg/nexe](#approach-6-nextjs-standalone--pkgnexe)
8. [Approach 7: Bun Compile](#approach-7-bun-compile)
9. [Approach 8: Docker](#approach-8-docker)
10. [Approach 9: Nativefier / Pake / Web Wrappers](#approach-9-nativefier--pake--web-wrappers)
11. [Approach 10: PWA (Progressive Web App)](#approach-10-pwa-progressive-web-app)
12. [Approach 11: Wails (Go-based)](#approach-11-wails-go-based)
13. [Approach 12: ToDesktop (Managed Electron Service)](#approach-12-todesktop-managed-electron-service)
14. [Cross-Cutting Concerns](#cross-cutting-concerns)
15. [Recommendation Matrix](#recommendation-matrix)
16. [Final Recommendation](#final-recommendation)

---

## Executive Summary

Your stack has **three critical native/binary dependencies** that heavily constrain which approaches are viable:

| Dependency | Nature | Challenge |
|---|---|---|
| **better-sqlite3** | Native C++ Node.js addon (.node file) | Requires Node.js runtime; must be rebuilt per platform/arch |
| **sqlite-vec** | Native SQLite extension (.dylib/.dll/.so) | Must ship platform-specific binary alongside app |
| **@xenova/transformers** | ONNX Runtime + WASM + model files (~23-100MB+) | Large model files must be bundled or downloaded at first run |

Additionally, **Prisma** requires its Query Engine binary (a native binary per platform), and your app uses **Next.js App Router with Server Components**, which requires a Node.js server process (not just static HTML).

**Bottom line:** Any approach that lacks a Node.js runtime is either non-viable or requires significant architectural rework. Electron is the most proven path. Tauri with a Node.js sidecar is the most modern alternative. Everything else involves substantial tradeoffs.

---

## Approach 1: Electron

### How It Works
Electron bundles Chromium + Node.js into a desktop application. Your Next.js app runs its server inside Electron's main process (or as a child process), and the renderer (Chromium) displays the UI. You get full Node.js API access, so all native addons work natively.

### Tools/Frameworks
- **electron-builder**: Standalone packaging tool focused on building installers (DMG, NSIS, AppImage). Handles code signing, auto-updates, native module rebuilding.
- **electron-forge**: Official Electron scaffolding/build pipeline. Uses first-party Electron tooling, gets new features (ASAR integrity, universal macOS builds) first.
- **Nextron**: Next.js + Electron framework with templates and hot-reload dev workflow. Bundles electron-builder internally. However, it does NOT support SSR/Server Components (uses static export only).
- **Custom setup (recommended for your stack)**: Use `next build` with `output: "standalone"`, then launch the standalone server.js from Electron's main process. Load the Next.js server URL in the BrowserWindow. This preserves full App Router + Server Components + API routes.

### Architecture for Your Stack
```
Electron Main Process
  -> Spawns Next.js standalone server (server.js) on a free port
  -> BrowserWindow loads http://localhost:{port}
  -> server.js has full Node.js access to:
     - better-sqlite3 (native addon)
     - sqlite-vec (loaded as extension)
     - Prisma (with query engine binary)
     - @xenova/transformers (ONNX models)
```

### Pros
- **Full Node.js runtime**: All native addons (better-sqlite3, sqlite-vec) work with zero workarounds
- **Prisma works natively**: Just include the query engine binary for each target platform
- **Server Components work**: Run the actual Next.js server, not a static export
- **Mature ecosystem**: Auto-updates (electron-updater), code signing, crash reporting, system tray, native menus
- **Largest community**: Most examples, tutorials, and battle-tested solutions for this exact type of app
- **npm run dev works unchanged**: Dev workflow is completely separate from Electron packaging
- **Cross-platform**: macOS (including universal builds), Windows (x64, arm64), Linux

### Cons
- **Large bundle size**: 150-200MB+ installer due to bundled Chromium (~120MB compressed)
- **High memory usage**: 300-500MB RAM at idle (Chromium + Node.js + your app)
- **Native module rebuilding**: Must run `electron-rebuild` or configure build hooks when Electron's Node.js ABI version changes
- **Complex packaging config**: Requires careful handling of ASAR packaging, unpacking native .node files, including sqlite-vec .dylib/.dll alongside the app
- **Code signing costs**: Apple Developer Program ($99/year for macOS), Windows code signing certificate ($200-500/year for EV)
- **Security surface area**: Full Node.js + Chromium is a large attack surface

### Native Dependency Handling
- **better-sqlite3**: Use `electron-rebuild` to rebuild against Electron's Node.js version. In electron-builder, configure `asarUnpack` to keep .node files outside the ASAR archive.
- **sqlite-vec**: Ship platform-specific .dylib/.dll/.so files. Use `extraResources` in electron-builder config to include them. Load via `better-sqlite3.loadExtension()` using a path relative to `process.resourcesPath`.
- **Prisma**: Include query engine binaries via `extraResources`. Set `PRISMA_QUERY_ENGINE_LIBRARY` env var to point to the correct path at runtime.
- **@xenova/transformers**: Bundle ONNX model files in `extraResources` or download on first launch. Set `env.localModelPath` and `env.allowRemoteModels = false` for offline operation. Use the Node.js ONNX backend for best performance in Electron.

### ML Model Handling
Bundle model files (ONNX format, ~23MB for all-MiniLM-L6-v2) as extra resources. Configure transformers.js to load from the local path. Alternatively, download models on first launch and cache in the user's app data directory.

### Developer Workflow
`npm run dev` works exactly as it does today. Electron is only involved during packaging. You can add a separate `npm run electron:dev` script that launches Electron pointing at your dev server.

### Cross-Platform Support
Excellent. macOS (Intel + Apple Silicon, universal builds), Windows (x64, arm64), Linux (x64, arm64). Electron-builder produces DMG, pkg (macOS), NSIS exe/MSI (Windows), AppImage/deb/rpm (Linux).

### Maturity
Electron: **Very mature**. Used by VS Code, Slack, Discord, Figma, Notion, 1Password. Actively maintained by OpenJS Foundation. Monthly releases.
electron-builder: **Very mature**. 13k+ GitHub stars, actively maintained.
electron-forge: **Mature**. Official Electron tool, actively maintained.

### Example Projects / Docs
- [electron-sqlite-demo (better-sqlite3 + Prisma)](https://github.com/trulysinclair/electron-sqlite-demo)
- [nextjs_approuter_electron (SSR + Server Components template)](https://github.com/spa5k/nextjs_approuter_electron)
- [Mintplex-Labs/transformersjs-electron](https://github.com/Mintplex-Labs/transformersjs-electron)
- [Challenges Building an Electron App (better-sqlite3 + sqlite-vec real-world)](https://www.danielcorin.com/posts/2024/challenges-building-an-electron-app/)
- [Building an Electron App with Next.js (DoltHub)](https://www.dolthub.com/blog/2024-09-11-building-an-electron-app-with-nextjs/)
- [Konshin: Ultimate Electron + Next.js RSC](https://medium.com/@kirill.konshin/the-ultimate-electron-app-with-next-js-and-react-server-components-a5c0cabda72b)

### Verdict: STRONGLY VIABLE -- Best overall fit for your stack

---

## Approach 2: Tauri

### How It Works
Tauri uses the OS's native WebView (WebKit on macOS, WebView2 on Windows) instead of bundling Chromium. The backend is written in Rust. Frontend code runs in the WebView. Tauri does **not** include a Node.js runtime, which is the core challenge for your stack.

### Tools/Frameworks
- **Tauri v2**: Current stable release. Supports desktop + mobile. Plugin ecosystem.
- **tauri-plugin-sql**: SQLite access via Rust's sqlx library (not Node.js)
- **tauri-plugin-js / tauri-plugin-shell**: Run Node.js as a sidecar process
- **Node.js sidecar**: Bundle a compiled Node.js binary alongside the Tauri app

### Architecture for Your Stack (Sidecar Approach)
```
Tauri App (Rust backend + OS WebView)
  -> Launches Node.js sidecar (compiled with pkg or similar)
  -> Sidecar runs Next.js standalone server
  -> WebView loads http://localhost:{port}
  -> All native Node.js addons run in the sidecar process
```

### Pros
- **Tiny installer**: 3-15MB base (vs Electron's 150MB+)
- **Low memory**: 20-100MB idle RAM (vs Electron's 300-500MB)
- **Better security**: No full Node.js in the renderer, Rust backend is memory-safe
- **Modern, actively developed**: Tauri v2 is production-ready as of 2026
- **Mobile support**: Tauri v2 can target iOS and Android
- **Good Next.js docs**: Official Tauri documentation for Next.js integration

### Cons
- **No native Node.js runtime**: Your entire backend (Prisma, better-sqlite3, sqlite-vec, transformers) must run in a sidecar, which adds complexity
- **Sidecar complexity**: Must package a separate Node.js binary for each platform/architecture, configure sidecar binaries with correct target triples
- **Bundle size with sidecar**: The Node.js sidecar adds 30-50MB+, partially negating Tauri's size advantage
- **Two process architecture**: Communication between Tauri and the sidecar is via IPC (shell commands, stdin/stdout, or HTTP), not direct function calls
- **WebView inconsistencies**: OS WebView may render differently across platforms (Safari/WebKit on macOS vs Edge/WebView2 on Windows)
- **Prisma in sidecar**: Complex to set up; query engine binaries must be bundled with the sidecar
- **Less battle-tested**: Far fewer production apps than Electron, especially with this kind of stack

### Alternative: Pure Rust Backend (No Sidecar)
You could rewrite the backend in Rust:
- Use `tauri-plugin-sql` (sqlx) instead of Prisma + better-sqlite3
- Use a Rust vector search library instead of sqlite-vec
- Use Rust ONNX runtime instead of @xenova/transformers
This would give you the full benefits of Tauri but requires rewriting significant portions of your app.

### Native Dependency Handling
- **better-sqlite3**: Must run in the Node.js sidecar. Rebuild for the target platform. Cannot be used directly in Tauri's Rust backend.
- **sqlite-vec**: Either use in the Node.js sidecar or find a Rust-native alternative. sqlite-vec ships native binaries for all major platforms.
- **Prisma**: Use `prisma-client-rust` for the Rust backend (complex), or run standard Prisma in the Node.js sidecar. Alternative: use Drizzle ORM with Tauri's SQL plugin (simpler but requires ORM migration).
- **@xenova/transformers**: Must run in the Node.js sidecar or use a Rust ONNX runtime alternative.

### ML Model Handling
If using the sidecar approach, same as Electron (bundle models, set local paths). If going pure Rust, use `ort` (ONNX Runtime for Rust) crate.

### Developer Workflow
`npm run dev` still works for Next.js development. Tauri development adds `cargo tauri dev` which launches the Tauri shell pointing at your dev server. If using a sidecar, you need additional scripts to build the sidecar binary.

### Cross-Platform Support
Good. macOS (Intel + Apple Silicon), Windows (x64), Linux (x64, arm64). Each platform requires a separate sidecar binary with the correct target triple suffix (e.g., `my-sidecar-aarch64-apple-darwin`).

### Maturity
Tauri v2: **Mature for simple apps, maturing for complex ones**. 90k+ GitHub stars, backed by the Tauri Foundation. Growing ecosystem. Less proven with complex Node.js-heavy apps like yours.

### Example Projects / Docs
- [Tauri + Next.js guide](https://v2.tauri.app/start/frontend/nextjs/)
- [Node.js as a sidecar](https://v2.tauri.app/learn/sidecar-nodejs/)
- [Tauri v2 + Next.js Monorepo Guide](https://melvinoostendorp.nl/blog/tauri-v2-nextjs-monorepo-guide)
- [tauri-plugin-js (Node.js runtime bridge)](https://dev.to/huakun/tauri-without-electron-bloat-a-type-safe-js-runtime-bridge-with-tauri-plugin-js-35m8)
- [Drizzle + SQLite in Tauri](https://dev.to/huakun/drizzle-sqlite-in-tauri-app-kif)

### Verdict: VIABLE WITH SIGNIFICANT EFFORT -- Sidecar approach works but adds complexity. Best if you want smaller bundles and are willing to invest in the sidecar architecture.

---

## Approach 3: Neutralinojs

### How It Works
Neutralinojs is a lightweight framework that uses the OS's existing browser library (like Tauri) and provides a thin C++ runtime with a JavaScript API. It does NOT include Node.js or any JS runtime beyond what the WebView provides.

### Tools/Frameworks
- **neu CLI**: Project scaffolding and building
- **Extensions API**: WebSocket-based IPC to connect external processes (could be a Node.js process)

### Pros
- **Very small**: Binary is ~2MB
- **Simple for basic apps**: Good for static HTML/CSS/JS wrappers
- **Cross-platform**: macOS, Windows, Linux

### Cons
- **No Node.js runtime**: Cannot run better-sqlite3, Prisma, sqlite-vec, or @xenova/transformers directly
- **No Server Components**: Next.js App Router requires a Node.js server; Neutralinojs only supports static HTML
- **Extension system is limited**: WebSocket-based IPC to external processes adds latency; developer must package extension binaries themselves
- **No native addon support**: C++ extensions via WebSocket are slower than native code due to IPC overhead
- **SQLite support**: Only available through community extensions, not built-in
- **Small ecosystem**: Far fewer plugins, examples, and community support than Electron or Tauri
- **Framework-level limitations**: Cannot extend the native API without building from source

### Native Dependency Handling
Not viable. You would need to run a separate Node.js process via the Extensions API and communicate over WebSocket, essentially building your own sidecar system without Tauri's tooling.

### ML Model Handling
Would need to run in an external Node.js process. The WebView could potentially run transformers.js in WASM mode, but performance would be poor.

### Developer Workflow
`npm run dev` is unaffected. But the Neutralinojs integration would require extensive custom tooling.

### Cross-Platform Support
macOS, Windows, Linux. But no official tooling for packaging Node.js sidecars.

### Maturity
**Moderately mature for simple apps**. 7k+ GitHub stars. Active development but small team. Not designed for the complexity of your stack.

### Verdict: NOT VIABLE -- The lack of Node.js runtime and the complexity of working around it make this a poor fit. You would essentially be rebuilding what Tauri's sidecar system already provides, but with worse tooling.

---

## Approach 4: Next.js Standalone + caxa

### How It Works
[caxa](https://github.com/AppThreat/caxa) creates a self-extracting archive that bundles your entire project + a Node.js binary. When the user runs the executable, it extracts everything to a temp directory and runs your app with the bundled Node.js. Combined with `next build --standalone`, this packages your Next.js server into a single executable.

### Build Process
```
1. next build (with output: "standalone")
2. Copy public/ and .next/static/ into .next/standalone/
3. Copy native addons (better-sqlite3 .node files, sqlite-vec .dylib/.dll)
4. Copy Prisma query engine binaries
5. Copy/download ONNX model files
6. caxa --input .next/standalone --output workplan -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/server.js"
```

### Pros
- **Supports native modules**: Since caxa extracts to disk and runs real Node.js, all native addons work (better-sqlite3, sqlite-vec, Prisma engine)
- **Simple concept**: Just a self-extracting archive + Node.js binary
- **Preserves full Next.js**: Server Components, API routes, SSR all work because the real server.js runs
- **npm run dev unchanged**: Zero impact on development workflow
- **Fast packaging**: Packages in seconds
- **No Chromium overhead**: ~30-50MB total (Node.js binary + your app) vs Electron's 150MB+

### Cons
- **No native window chrome**: Opens in the user's default browser, NOT a dedicated desktop window. This is a significant UX issue -- it doesn't feel like a "desktop app"
- **First-run extraction delay**: The first time the user runs the app, it extracts to a temp directory (may take seconds)
- **No auto-updates**: You must build your own update mechanism
- **No system tray, native menus, or OS integration**: It's just a Node.js server
- **Temp directory management**: Extracted files live in the OS temp directory; cleanup is handled but can be fragile
- **No code signing for the archive**: The executable may trigger OS security warnings
- **caxa maintenance**: The original `leafac/caxa` is no longer maintained; the fork at `AppThreat/caxa` (formerly `cdxgen/caxa`) is the active one
- **Windows/macOS Gatekeeper**: Without code signing, users will see scary security warnings

### Native Dependency Handling
- **better-sqlite3**: Works because caxa extracts the real .node files to disk
- **sqlite-vec**: Include the .dylib/.dll in the archive; load via path relative to the extraction directory
- **Prisma**: Include query engine binary; set PRISMA_QUERY_ENGINE_LIBRARY at runtime
- **@xenova/transformers**: Include ONNX model files in the archive or download on first run

### Developer Workflow
Completely unchanged. `npm run dev` works as-is. caxa is only used for the final packaging step.

### Cross-Platform Support
macOS (Intel + Apple Silicon) and Windows (x64). Must build separate archives per platform (because Node.js binary and native addons differ). No cross-compilation support.

### Maturity
**Low-moderate**. The original caxa is unmaintained. The AppThreat fork is maintained but has a smaller community. Not widely used for production desktop apps.

### Verdict: VIABLE AS A QUICK SOLUTION -- Good for internal tools or developer-facing distribution. Not suitable for consumer-facing apps due to lack of native window, auto-updates, and code signing.

---

## Approach 5: Next.js Standalone + Node.js SEA

### How It Works
Node.js Single Executable Applications (SEA) embed your JavaScript into the Node.js binary itself, producing a single executable. Stable since Node.js 22, significantly improved in Node.js 24+. However, SEA works by injecting a single JS blob into the binary -- it does NOT bundle native addons.

### Build Process
```
1. next build (with output: "standalone")
2. Bundle server.js + dependencies into a single JS file (using esbuild)
3. Create SEA config (sea-config.json)
4. Generate the SEA blob: node --experimental-sea-config sea-config.json
5. Copy node binary and inject blob: npx postject node NODE_SEA_BLOB sea-prep.blob
6. Ship native addons (.node files, .dylib/.dll) alongside the binary
```

### Pros
- **Single binary** (for the JS portion): Looks clean and professional
- **Official Node.js feature**: Part of core Node.js, actively improved
- **No runtime dependency**: Users don't need Node.js installed
- **Fast cold start**: No extraction step, JS is embedded directly

### Cons
- **Native addons CANNOT be embedded**: better-sqlite3 (.node), sqlite-vec (.dylib/.dll), and Prisma query engine must ship as separate files alongside the binary. This undermines the "single executable" promise.
- **Complex build pipeline**: Must use esbuild to bundle, then postject to inject, then handle native addons separately
- **Next.js compatibility uncertain**: Next.js standalone output involves dynamic requires, multiple files, and complex module resolution that may not bundle cleanly into a single JS blob
- **No native window**: Like caxa, opens in the user's browser
- **No auto-updates, system tray, or OS integration**
- **Experimental feel**: While "stable," the practical tooling for complex apps like Next.js is immature
- **No code signing tooling**: Must handle OS security warnings manually
- **Model files still separate**: ONNX models must ship alongside

### Native Dependency Handling
- **better-sqlite3**: Must ship .node file alongside binary, load via `createRequire`
- **sqlite-vec**: Must ship .dylib/.dll alongside binary
- **Prisma**: Must ship query engine alongside binary
- **@xenova/transformers**: Model files must ship alongside or download on first run

### Developer Workflow
`npm run dev` unchanged. SEA packaging is a separate build step.

### Cross-Platform Support
Builds on macOS and Windows. Must build on each target platform (no cross-compilation for the native portion). Node.js SEA itself supports cross-platform targets.

### Maturity
**Maturing but not yet production-ready for complex apps**. Simple CLI tools work well. Complex Next.js apps with native addons push the boundaries of what SEA handles gracefully.

### Verdict: NOT RECOMMENDED FOR THIS PROJECT -- The inability to embed native addons and the complexity of bundling Next.js into a single blob make this impractical. You end up with a "single executable" that still needs a folder of companion files.

---

## Approach 6: Next.js Standalone + pkg / nexe

### How It Works
**pkg** (by Vercel) and **nexe** compile your Node.js application into a standalone executable by bundling the V8 engine + your code. They handle more complex scenarios than SEA, including some native addon support.

### Status
- **pkg**: **DEPRECATED**. Last release was 5.8.1. Vercel archived the repository, citing Node.js SEA as the successor. A fork exists at `tetratelabs/node-pkg`.
- **nexe**: **Active but fragile**. Refreshed in 2024, still maintained. Native module support requires shipping .node files alongside the binary.

### Pros
- **pkg (when it worked)**: Could snapshot the filesystem and handle requires well. One blog post documents successfully packaging Next.js with pkg.
- **nexe**: Still maintained, supports newer Node.js versions

### Cons
- **pkg is dead**: No updates, no bug fixes, no support for Node.js 22+
- **nexe native module support is finicky**: .node files must ship alongside; complex apps often break
- **Neither handles Next.js well**: Dynamic imports, server components, and complex module resolution cause issues
- **No native window, auto-updates, or OS integration**
- **Build times**: nexe compiles Node.js from source when native modules are involved (can take 30+ minutes)

### Native Dependency Handling
Both require native addons (.node files) to be shipped alongside the executable. Neither can embed them.

### Verdict: NOT RECOMMENDED -- pkg is dead, nexe is fragile for complex apps. Use caxa or SEA instead if you want this category of solution.

---

## Approach 7: Bun Compile

### How It Works
`bun build --compile` produces a single executable that bundles the Bun runtime + your application. Bun has built-in SQLite support (`bun:sqlite`), which could replace better-sqlite3.

### Pros
- **Built-in SQLite**: `bun:sqlite` is 3-6x faster than better-sqlite3, zero dependencies
- **Cross-compilation**: Can target macOS/Windows/Linux from any platform
- **Single binary output**: Clean distribution
- **Fast build times**: Bun's bundler is very fast

### Cons
- **better-sqlite3 is incompatible**: Bun's bundler cannot resolve better-sqlite3 when compiling to a single executable. You MUST migrate to `bun:sqlite`
- **Prisma compatibility**: Prisma's query engine and native bindings may not work with Bun's compile mode
- **sqlite-vec**: Unknown compatibility with `bun:sqlite` (designed for Node.js better-sqlite3)
- **@xenova/transformers**: May have compatibility issues with Bun's WASM/ONNX handling
- **Next.js compatibility**: Bun can run Next.js dev server, but compiling Next.js standalone into a single Bun executable is uncharted territory
- **No native window**: Opens in browser
- **Requires significant migration**: Would need to replace better-sqlite3 with bun:sqlite, potentially replace Prisma, test sqlite-vec compatibility

### Native Dependency Handling
Bun's compile mode struggles with native Node.js addons. The recommended path is to use Bun's built-in alternatives (bun:sqlite instead of better-sqlite3).

### Verdict: NOT VIABLE WITHOUT MAJOR REFACTOR -- Would require replacing better-sqlite3 with bun:sqlite, potentially replacing Prisma, and dealing with unknown sqlite-vec compatibility. Too many unknowns for a production app.

---

## Approach 8: Docker

### How It Works
Package your app as a Docker container. Users install Docker Desktop and run your container. The container includes Node.js, all native dependencies, and your app.

### Pros
- **Perfect environment isolation**: All dependencies are bundled exactly as you built them
- **Native addons just work**: better-sqlite3, sqlite-vec, Prisma -- all work perfectly inside the container
- **Cross-platform**: Same container runs on macOS, Windows, Linux
- **Familiar to developers**: Most developers know Docker
- **Easy to build**: Just a Dockerfile with your Next.js standalone output

### Cons
- **Requires Docker Desktop**: Users must install Docker Desktop (400MB+), which is a significant barrier for non-technical users
- **Not a "desktop app"**: Opens in the browser, not a native window
- **Docker Desktop licensing**: Free for personal use, but requires a paid subscription for commercial use in companies with 250+ employees or $10M+ revenue
- **Resource overhead**: Docker VM/hypervisor uses additional CPU/RAM
- **File system access**: Sharing files between the container and host requires volume mounts, which is confusing for end users
- **No auto-updates**: Must manage container image updates
- **Poor UX for consumers**: Installing Docker, pulling images, running commands -- not acceptable for non-developer end users
- **macOS file I/O performance**: Docker on macOS has historically slow file system access
- **SQLite data persistence**: Must mount a volume for the SQLite database, or data is lost when the container stops

### Native Dependency Handling
Excellent. Everything runs in a Linux container with all dependencies pre-installed.

### ML Model Handling
Bundle models in the container image (increases image size by ~23-100MB+) or mount from host.

### Developer Workflow
`npm run dev` unchanged. Docker is only for distribution.

### Cross-Platform Support
Runs anywhere Docker Desktop runs: macOS, Windows, Linux. But the user experience is poor.

### Maturity
Docker: **Very mature**. Standard industry tool.

### Verdict: VIABLE FOR DEVELOPER/TECHNICAL AUDIENCES ONLY -- Perfect for internal tools, developer tools, or server deployments. Completely unsuitable for consumer desktop distribution.

---

## Approach 9: Nativefier / Pake / Web Wrappers

### How It Works
These tools wrap a URL or local web app in a minimal desktop window. They do NOT run your server -- they just provide a browser window.

### Tools
- **Nativefier**: **UNMAINTAINED / ARCHIVED**. Used Electron under the hood. No longer developed.
- **Pake**: Active Rust/Tauri-based wrapper. ~5MB per app. Turns any URL into a native desktop app.
- **Deskify**: Rust/Tauri-based, Linux-first. Uses system WebView.
- **Naty**: Minimal WebView wrapper, <7MB.

### Pros
- **Tiny size**: Pake produces ~5MB apps
- **Dead simple**: One command to wrap a URL
- **Native window**: Unlike caxa/SEA, you get a real desktop window

### Cons
- **Does NOT run your server**: These tools only wrap a URL in a window. You still need something running your Next.js server (Node.js installed, or a separate packaging solution).
- **No Node.js runtime**: Cannot run better-sqlite3, Prisma, sqlite-vec, or transformers.js
- **No offline support**: If wrapping a URL, requires network access
- **No native addon support**: These are pure web wrappers
- **Not useful on their own for your stack**: You would need to pair one of these with caxa/SEA/Docker to run the server, then point the wrapper at localhost

### Hybrid Approach
You could combine Pake (for the native window) with caxa (for the server):
1. caxa packages your Next.js server into an executable
2. Pake wraps `http://localhost:{port}` in a native window
3. A launcher script starts the server, then opens the Pake window

This is hacky and fragile. Electron does both of these things in one package.

### Verdict: NOT VIABLE STANDALONE -- These are web wrappers, not application frameworks. They don't solve the core problem of running your Node.js server with native addons.

---

## Approach 10: PWA (Progressive Web App)

### How It Works
A PWA uses service workers, a web manifest, and caching strategies to make a web app installable and optionally offline-capable. Users "install" it from the browser, and it appears in their app launcher.

### Pros
- **Zero download size**: No installer, no binary
- **Cross-platform by default**: Works on any device with a modern browser
- **Auto-updates**: Just deploy to your web server
- **No app store approval needed**
- **Installable**: Users can add to home screen / app launcher

### Cons
- **CANNOT run native Node.js addons**: better-sqlite3, sqlite-vec, and Prisma's native query engine do not work in the browser
- **No server-side processing**: Your app needs a server for Prisma, SQLite, and ML inference. PWA is client-only.
- **SQLite in browser is limited**: Can use sql.js (SQLite compiled to WASM) or Origin Private File System, but NOT better-sqlite3 or sqlite-vec
- **ML in browser**: transformers.js works in the browser via WASM, but performance is significantly worse than Node.js, and models must be downloaded to the browser
- **Requires complete architecture rework**: Your entire data layer (Prisma + better-sqlite3 + sqlite-vec) would need to be replaced with browser-compatible alternatives
- **Browser limitations**: No file system access (limited), no native SQLite extensions, limited storage

### Architecture Rework Required
```
Current: Server Components -> Prisma -> better-sqlite3 -> sqlite-vec
PWA:     Client Components -> sql.js (WASM) -> custom vector search
         OR
         Client Components -> IndexedDB -> no SQL, no vector search
         OR
         Client Components -> API calls to a remote server (defeats the purpose)
```

### Verdict: NOT VIABLE -- Would require replacing your entire data layer and losing the benefits of server-side rendering, native SQLite, and efficient ML inference. PWA is fundamentally incompatible with your stack.

---

## Approach 11: Wails (Go-based)

### How It Works
Wails is like Tauri but with a Go backend instead of Rust. It uses the OS native WebView and provides Go-to-JavaScript bindings. No Node.js runtime.

### Pros
- **Small binaries**: Up to 90% smaller than Electron
- **Go backend**: Easier to learn than Rust for many developers
- **Good performance**: Native WebView, efficient Go runtime
- **Cross-platform**: macOS, Windows, Linux

### Cons
- **No Node.js runtime**: Same fundamental problem as Tauri -- cannot run better-sqlite3, Prisma, sqlite-vec, or @xenova/transformers
- **Would require rewriting backend in Go**: Not practical for your existing codebase
- **Sidecar possible but not well-documented**: Less tooling than Tauri for Node.js sidecars
- **Smaller ecosystem**: Fewer plugins and community resources than Tauri or Electron

### Verdict: NOT VIABLE -- Same Node.js runtime problem as Tauri, but with less tooling for working around it.

---

## Approach 12: ToDesktop (Managed Electron Service)

### How It Works
ToDesktop is a commercial service that automates Electron packaging. You point it at your web app, and it handles code signing, auto-updates, native installers, and distribution. Built on Electron internally.

### Pros
- **Minimal effort**: Handles packaging, code signing, auto-updates, analytics
- **Professional installers**: DMG, NSIS, AppImage with customization
- **Code signing included**: Handles Apple notarization and Windows signing
- **Auto-updates built in**

### Cons
- **Commercial/paid service**: Pricing may be a concern
- **Black box**: Less control over the packaging process
- **Native addon handling unclear**: May not support custom native addon configuration (better-sqlite3, sqlite-vec) without custom Electron configs
- **Still Electron under the hood**: Same 150MB+ bundle size
- **Designed for wrapping web apps**: May not handle the complexity of running a Next.js standalone server with native addons

### Verdict: POTENTIALLY VIABLE -- Worth investigating if you want to minimize packaging effort, but may not support the level of native addon customization your stack requires.

---

## Cross-Cutting Concerns

### 1. better-sqlite3 + sqlite-vec Packaging

These are the hardest dependencies to package:

| Approach | better-sqlite3 | sqlite-vec | Complexity |
|---|---|---|---|
| Electron | Rebuild with electron-rebuild, asarUnpack | Ship .dylib/.dll as extraResources | Medium |
| Tauri + sidecar | Bundle in sidecar | Bundle in sidecar | High |
| caxa | Just works (extracts to disk) | Include in archive | Low |
| Node.js SEA | Ship alongside binary | Ship alongside binary | Medium-High |
| Docker | Just works | Just works | Low |

### 2. Prisma Query Engine

Prisma ships a native query engine binary per platform (~15-20MB each). Every approach must handle this:
- **Electron**: Use `extraResources` + `PRISMA_QUERY_ENGINE_LIBRARY` env var
- **Tauri sidecar**: Bundle with the sidecar
- **caxa**: Include in the archive
- **Docker**: Installed in container

### 3. @xenova/transformers Model Files

ONNX model files are large (~23MB for MiniLM-L6-v2, potentially 100MB+ for larger models):
- **Bundle in app**: Increases installer size but works offline immediately
- **Download on first launch**: Smaller installer but requires internet on first run
- **Configure**: Set `env.localModelPath` to the bundled location, `env.allowRemoteModels = false`

### 4. Next.js Server Components Compatibility

Your app uses the App Router with Server Components, which requires a Node.js server:

| Approach | Server Components | API Routes | SSR |
|---|---|---|---|
| Electron + standalone server | Yes | Yes | Yes |
| Tauri + Node sidecar | Yes | Yes | Yes |
| Nextron (static export) | NO | NO | NO |
| caxa + standalone | Yes | Yes | Yes |
| PWA | NO | NO | NO |
| Pake/Nativefier | NO (wrapper only) | NO | NO |

### 5. `next build --standalone` Output

The `output: "standalone"` config in next.config.ts is key for most approaches:
- Creates a self-contained `.next/standalone/` directory
- Includes a minimal `server.js` that replaces `next start`
- Copies only necessary `node_modules` (drastically reduces size)
- Run with `node .next/standalone/server.js`
- **Must manually copy** `public/` and `.next/static/` into the standalone directory

---

## Recommendation Matrix

| Criterion | Electron | Tauri+Sidecar | caxa | Node SEA | Docker | PWA |
|---|---|---|---|---|---|---|
| Native addon support | A+ | B+ (sidecar) | A | C+ | A+ | F |
| Server Components | A+ | A (sidecar) | A+ | C | A+ | F |
| Installer size | D (150MB+) | B (40-60MB w/ sidecar) | B+ (30-50MB) | B (30-50MB) | F (requires Docker) | A+ |
| Memory usage | D (300-500MB) | B+ (80-150MB w/ sidecar) | A (just Node.js) | A | C (container overhead) | A+ |
| Native desktop feel | A+ | A | F (opens in browser) | F (opens in browser) | F (opens in browser) | C |
| Auto-updates | A+ | B | F | F | C | A+ |
| Code signing | A+ | A | D | D | N/A | N/A |
| Dev workflow impact | A (unchanged) | B (extra scripts) | A (unchanged) | B (complex build) | A (unchanged) | F (rewrite needed) |
| Maturity/ecosystem | A+ | B | C | C | A+ | A (but wrong fit) |
| Cross-platform | A+ | A | B | B | B | A+ |
| End-user simplicity | A | A | D | D | F | B |
| Effort to implement | B (medium) | C (high) | A (low) | C (high) | A (low) | F (rewrite) |

---

## Final Recommendation

### Primary Recommendation: Electron

**Electron is the clear best fit for your stack.** Here's why:

1. **Full Node.js runtime** means better-sqlite3, sqlite-vec, Prisma, and @xenova/transformers all work with minimal configuration changes
2. **Server Components work** because you run the real Next.js standalone server inside Electron
3. **Mature ecosystem** with battle-tested solutions for every challenge you'll face (native module rebuilding, code signing, auto-updates, installers)
4. **Zero impact on `npm run dev`** workflow
5. **Real-world precedent**: Apps like Dolt Workbench use exactly this stack (Electron + Next.js + better-sqlite3)

**Recommended Electron Architecture:**
```
electron-builder (packaging)
  -> Main process: launches Next.js standalone server on a free port
  -> Renderer: BrowserWindow loads http://localhost:{port}
  -> extraResources: sqlite-vec .dylib/.dll, Prisma query engine, ONNX models
  -> asarUnpack: better-sqlite3 .node files
  -> electron-rebuild: rebuilds better-sqlite3 for Electron's Node ABI
```

**The trade-off** is the 150-200MB installer and 300-500MB memory usage. For a desktop app with local ML inference and SQLite, this is acceptable.

### Secondary Recommendation: Tauri v2 + Node.js Sidecar

If bundle size and memory are critical priorities, Tauri with a Node.js sidecar is viable but requires significantly more engineering effort. Expect the total installer to still be 40-60MB (Tauri ~5MB + Node.js sidecar ~35-50MB), so the size savings over Electron are modest once you include the sidecar.

### Tertiary Recommendation: caxa (for internal/developer distribution only)

If you just need to ship a server-in-a-box to technical users (no native window needed), caxa is the fastest path. Build standalone, wrap with caxa, distribute. Users access the app at http://localhost:3000. Takes an afternoon to set up.

### Not Recommended for This Project
- Neutralinojs, Wails, Pake: No Node.js runtime
- pkg, nexe: Deprecated or fragile
- Node.js SEA: Cannot embed native addons; Next.js bundling is unreliable
- PWA: Fundamentally incompatible with native SQLite + server-side code
- Bun compile: Incompatible with better-sqlite3 and Prisma
- Docker: Bad UX for desktop distribution

---

## Sources

- [Electron + better-sqlite3 guide (DEV Community)](https://dev.to/arindam1997007/a-step-by-step-guide-to-integrating-better-sqlite3-with-electron-js-app-using-create-react-app-3k16)
- [Challenges Building an Electron App (native addons real-world)](https://www.danielcorin.com/posts/2024/challenges-building-an-electron-app/)
- [Electron Desktop App Development Guide 2026](https://www.forasoft.com/blog/article/electron-desktop-app-development-guide-for-business)
- [Tauri + Next.js official docs](https://v2.tauri.app/start/frontend/nextjs/)
- [Tauri Node.js sidecar docs](https://v2.tauri.app/learn/sidecar-nodejs/)
- [Tauri in 2026 overview](https://dev.to/ottoaria/tauri-in-2026-build-cross-platform-desktop-apps-with-web-technologies-better-than-electron-11mo)
- [Tauri v2 + Next.js monorepo guide](https://melvinoostendorp.nl/blog/tauri-v2-nextjs-monorepo-guide)
- [tauri-plugin-js (Node.js runtime bridge)](https://dev.to/huakun/tauri-without-electron-bloat-a-type-safe-js-runtime-bridge-with-tauri-plugin-js-35m8)
- [Tauri vs Electron 2026 comparison](https://tech-insider.org/tauri-vs-electron-2026/)
- [Electron vs Tauri bundle/RAM comparison](https://www.pkgpulse.com/guides/electron-vs-tauri-2026)
- [How to package Next.js into executable using PKG](https://dis.dj/publications/package-next.js-into-executable)
- [caxa npm package](https://www.npmjs.com/caxa)
- [caxa GitHub (AppThreat fork)](https://github.com/AppThreat/caxa)
- [Node.js SEA 2026 production guide](https://www.hirenodejs.com/blog/nodejs-single-executable-applications-2026)
- [Node.js SEA official docs](https://nodejs.org/api/single-executable-applications.html)
- [Improving SEA building in Node.js (Joyee Cheung)](https://joyeecheung.github.io/blog/2026/01/26/improving-single-executable-application-building-for-node-js/)
- [How to bundle Next.js as SEA (GitHub issue)](https://github.com/nodejs/single-executable/issues/121)
- [Neutralinojs official site](https://neutralino.js.org/)
- [SQLite Neutralinojs extension](https://rpucella.net/blog/posts/2025/a-sqlite-neutralinojs-extension/)
- [Nativefier GitHub (archived)](https://github.com/nativefier/nativefier)
- [Pake GitHub](https://github.com/tw93/Pake)
- [Pake overview (BrightCoding)](https://blog.brightcoding.dev/2026/06/15/pake-turn-any-webpage-into-a-native-desktop-app-instantly)
- [Best Desktop App Frameworks 2026](https://www.pkgpulse.com/guides/best-desktop-app-frameworks-2026)
- [Next.js standalone deployment guide](https://nextjs.org/docs/app/getting-started/deploying)
- [Next.js standalone mode explanation](https://focusreactive.com/standalone-next-js-when-serverless-is-not-an-option/)
- [sqlite-vec GitHub](https://github.com/asg017/sqlite-vec)
- [sqlite-vec building and distribution](https://deepwiki.com/asg017/sqlite-vec/4-building-and-distribution)
- [Transformers.js for Electron (Mintplex-Labs)](https://github.com/Mintplex-Labs/transformersjs-electron)
- [Optimizing Transformers.js for production](https://www.sitepoint.com/optimizing-transformers-js-production/)
- [electron-forge vs electron-builder](https://www.electronforge.io/core-concepts/why-electron-forge)
- [Electron code signing docs](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Electron auto-update distribution 2026](https://www.oflight.co.jp/en/columns/electron-auto-update-distribution)
- [Nextron (Next.js + Electron)](https://github.com/saltyshiomix/nextron)
- [Next.js App Router + Electron SSR template](https://github.com/spa5k/nextjs_approuter_electron)
- [Ultimate Electron + Next.js RSC guide](https://medium.com/@kirill.konshin/the-ultimate-electron-app-with-next-js-and-react-server-components-a5c0cabda72b)
- [Electron + Next.js SSR guide (SayBackend)](https://www.saybackend.com/blog/03-electron-nextjs-ssr/)
- [Prisma Electron integration discussion](https://github.com/prisma/prisma/discussions/7889)
- [electron-sqlite-demo (better-sqlite3 + Prisma)](https://github.com/trulysinclair/electron-sqlite-demo)
- [Drizzle + SQLite in Tauri](https://dev.to/huakun/drizzle-sqlite-in-tauri-app-kif)
- [Bun single-file executable docs](https://bun.com/docs/bundler/executables)
- [Bun SQLite docs](https://bun.com/docs/runtime/sqlite)
- [Wails official site](https://wails.io/)
- [ToDesktop (Electron wrapper service)](https://www.todesktop.com/nativefier-alternative)
- [pkg GitHub (deprecated)](https://github.com/vercel/pkg)
- [nexe GitHub](https://github.com/nexe/nexe)
