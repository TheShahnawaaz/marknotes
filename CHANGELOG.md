# Changelog

All notable changes to MarkNotes will be documented here.

## [1.0.5] - 2026-04-29

### Added
- Status bar showing live word count and character count

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
