# Changelog

All notable changes to MarkNotes will be documented here.

## [1.0.8] - 2026-04-29

### Changed
- New app icon (markdown "M↓" mark). macOS uses a baked-in squircle for a
  native Dock/Finder appearance; Windows and Linux use the full-bleed square.
- Source 1024×1024 PNGs live in `src-tauri/icons/source/` for reproducible
  regeneration via `npm run tauri icon`.
- Web favicon now resolves to `public/favicon.png` instead of the missing
  `vite.svg` placeholder.

## [1.0.7] - 2026-04-29

### Changed
- App version now appears in the title bar next to "MarkNotes" instead of the
  bottom status bar (status bar keeps the live word/character counts).
- `tauri.conf.json` now inherits its version from `package.json` (`"version":
  "../package.json"`), so bumping a release only requires touching
  `package.json` locally — or pushing a tag, which CI handles end-to-end.

## [1.0.6] - 2026-04-29

### Fixed
- Auto-updater now actually works on macOS and Windows. Previous releases shipped
  `.dmg` / `.msi` files only, but Tauri's updater needs `.app.tar.gz` (mac) and
  `.nsis.zip` (windows) plus minisign `.sig` signatures — none of which were being
  produced. Bundle now emits `app`, `dmg`, and `nsis` targets, and the release
  workflow fails loudly if signatures are missing instead of writing empty ones
  into `latest.json`.

### Changed
- Windows installer is now an NSIS `.exe` setup instead of `.msi` (Tauri's
  recommended Windows format and the one with proper updater support).

## [1.0.5] - 2026-04-29

### Added
- Status bar with live word count, character count, and app version

## [1.0.4] - 2026-04-29

### Fixed
- Auto-updater now correctly downloads then prompts "Restart now" instead of disappearing
- Separated download and install steps to prevent process being killed before relaunch

## [1.0.3] - 2026-04-29

### Fixed
- Context menu now appears at cursor position instead of top-left corner

### Added
- Theme toggle in titlebar (cycles System → Light → Dark)
- Font size controls in titlebar (A- / A+), sizes 12–20px, persisted across sessions
- Onboarding welcome note on first launch
- Keyboard shortcut `Cmd+W` / `Ctrl+W` to deselect active note
- Keyboard shortcut `Cmd+/` / `Ctrl+/` to open shortcuts panel
- Keyboard shortcuts panel accessible from titlebar
- Platform-aware shortcut keys (⌘ on Mac, Ctrl on Windows)
- Better empty state with emoji and helpful hints

## [1.0.2] - 2026-04-29

### Added
- Secure auto-update via GitHub Releases (Ed25519 signed)
- Update notification with progress bar on startup

## [1.0.1] - 2026-04-28

### Fixed
- Windows `.ico` icon now included in bundle configuration
- Fixed `react-resizable-panels` import names

## [1.0.0] - 2026-04-28

### Added
- CodeMirror 6 editor with markdown syntax highlighting
- Live markdown preview (GitHub Flavored Markdown)
- Auto-save with 500ms debounce
- Search notes by filename
- Dark/Light theme toggle
- Keyboard shortcuts (`Cmd+N`, `Cmd+S`, `Cmd+F`)
- Resizable editor/preview panels
- Window state persistence
- Secure auto-update via GitHub Releases
