# Session 49 Request: Load Actual Application Icons for .app Bundles and .exe Files

## User Prompt (Verbatim)
`/plan for .apps and exes make the sidebar load the actual app icons`

## Core Requirements & Objectives
1. **Actual Native App Icon Extraction & Serving Backend**:
   - Add `GET /quotas/api/fs/icon?path=<filePath>` endpoint in `dsh-providers/src/quotas/web.ts`.
   - Extract native macOS `.icns` from `.app/Contents/Resources/` via `Info.plist` and convert to 32x32 / 64x64 PNG via `sips`.
   - Cache extracted icons in `/tmp/dsh-app-icons/` or memory for instant sub-millisecond serving.
2. **Frontend Native App Icon Component & Fallbacks**:
   - Upgrade `renderAppIcon` to support dynamic image loading with `NativeAppIconImg` component.
   - Smooth fallback to SVG vector icons if no native icon is available or while loading.
   - Support `.app` bundles in filesystem tree, `.exe` / `.dmg` / `.pkg` files, and the Apps settings section.
