# MarkNotes — Build Plan

A professional desktop markdown notes app built with Tauri 2 + React + shadcn/ui.
Notes are stored as `.md` files on disk. Compiles to a native `.dmg` (macOS) and `.msi` (Windows) installer.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v4 |
| Editor | CodeMirror 6 |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Fonts | Geist |
| State | Zustand |
| Tauri Plugins | `fs`, `dialog`, `store`, `window-state` |
| Rust | Custom `tauri::command`s for all fs ops |
| Output | `.dmg` (macOS) + `.msi` (Windows) |

---

## Architecture

```
React UI  →  Tauri IPC Bridge  →  Rust Commands  →  OS / Filesystem
                                       ↓
                              tauri-plugin-fs       → ~/Documents/MarkNotes/*.md
                              tauri-plugin-dialog   → native folder/file pickers
                              tauri-plugin-store    → OS app data dir (theme, last folder)
                              tauri-plugin-window-state → window size/position
```

---

## App Layout

```
┌─────────────────────────────────────────────────────┐
│  [custom titlebar — drag region — min/max/close]    │
├────────────────┬────────────────┬───────────────────┤
│  Sidebar       │  CodeMirror 6  │  Markdown Preview │
│  ───────────   │  Editor        │                   │
│  + New Note    │                │  (react-markdown  │
│  🔍 Search     │  (syntax       │   remark-gfm      │
│  ───────────   │   highlighted  │   rehype-         │
│  note-1.md     │   markdown)    │   highlight)      │
│  2h ago        │                │                   │
│  note-2.md     │                │                   │
│  yesterday     │                │                   │
└────────────────┴────────────────┴───────────────────┘
```

---

## Task Checklist

### Task 0 — Plan
- [x] Write PLAN.md

---

### Task 1 — Scaffold Tauri 2 + React + TypeScript + Vite
**Objective:** Working Tauri 2 app window running locally.

- [x] Run `create-tauri-app` with React + TypeScript + Vite template
- [x] Configure `tauri.conf.json`: app name `MarkNotes`, window 1200×800, `decorations: false`
- [x] Set build targets to `darwin` (macOS) and `windows-msi` only
- [x] Verify `tauri dev` opens a native window

**Done when:** Native app window opens without errors.

---

### Task 2 — Tailwind CSS v4 + shadcn/ui + Geist font + theming
**Objective:** Full design system wired up and working.

- [x] Install Tailwind CSS v4 with `@tailwindcss/vite` plugin
- [x] Configure CSS variables for shadcn theming
- [x] Install and apply Geist font globally
- [x] Init shadcn/ui, add components: `Button`, `Input`, `ScrollArea`, `Separator`, `Tooltip`, `DropdownMenu`, `Dialog`, `Sonner`
- [x] System-aware dark/light theme on first launch
- [x] Theme preference persisted via `tauri-plugin-store`

**Done when:** Themed app renders in Tauri window, dark/light toggle works, preference survives restart.

---

### Task 3 — Custom frameless titlebar + window controls
**Objective:** Native-feeling window chrome.

- [x] Set `decorations: false` in `tauri.conf.json`
- [x] Build `<Titlebar>` component with `data-tauri-drag-region`
- [x] Implement min / max / close buttons using Tauri `Window` API
- [x] Install and configure `tauri-plugin-window-state`
- [x] Window size and position persists across restarts

**Done when:** Window is draggable, all controls work, reopens at same size/position.

---

### Task 4 — Rust commands for filesystem operations
**Objective:** Core Tauri IPC layer — all fs ops go through Rust.

- [x] Write `tauri::command`s in `src-tauri/src/main.rs`:
  - `list_notes(folder: String) → Result<Vec<NoteEntry>, String>` — name + last modified
  - `read_note(path: String) → Result<String, String>`
  - `write_note(path: String, content: String) → Result<(), String>`
  - `delete_note(path: String) → Result<(), String>`
  - `rename_note(old: String, new: String) → Result<(), String>`
  - `ensure_notes_dir(path: String) → Result<(), String>`
- [x] Register all commands in Tauri builder
- [x] Configure `fs` plugin permissions in `capabilities/default.json` scoped to `$DOCUMENT/MarkNotes`

**Done when:** `invoke('list_notes', ...)` from browser devtools returns real file data.

---

### Task 5 — Notes folder init + sidebar with note list
**Objective:** First real user-facing feature end-to-end.

- [x] On app start: resolve `$DOCUMENT/MarkNotes`, call `ensure_notes_dir`, load notes
- [x] Sidebar lists notes with filename + relative last-modified time ("2h ago", "yesterday")
- [x] "Open Folder" button → `tauri-plugin-dialog` directory picker → reloads list
- [x] Chosen folder path persisted via `tauri-plugin-store`
- [x] Zustand store: `{ folderPath, notes[], activeNoteId }`

**Done when:** App opens, `~/Documents/MarkNotes/` auto-created, sidebar shows notes, folder change persists.

---

### Task 6 — CodeMirror 6 editor + live markdown preview
**Objective:** Core editing experience.

- [x] Three-column layout: Sidebar | Editor | Preview
- [x] CodeMirror 6 with `@codemirror/lang-markdown`, theme synced to app dark/light mode
- [x] Preview: `react-markdown` + `remark-gfm` + `rehype-highlight`
- [x] Auto-save: debounced 500ms after last keystroke via `write_note`
- [x] Active note highlighted in sidebar

**Done when:** Click note → loads in editor → live preview updates → file saved to disk automatically.

---

### Task 7 — Full CRUD — create, rename, delete
**Objective:** Complete note management.

- [x] "New Note" → creates `untitled-{timestamp}.md`, selects it immediately
- [x] Right-click context menu on sidebar note (shadcn `DropdownMenu`): Rename, Delete
- [x] Rename: inline input in sidebar → calls `rename_note`
- [x] Delete: shadcn `Dialog` confirmation → calls `delete_note`
- [x] `Sonner` toast on errors (write fail, rename conflict, etc.)

**Done when:** Full create → rename → delete flow works, errors surface as toasts.

---

### Task 8 — Search + keyboard shortcuts
**Objective:** Power-user usability.

- [x] Search input in sidebar filters note list by filename (client-side, instant)
- [x] Highlight matched substring in results
- [x] `Cmd/Ctrl+N` → new note
- [x] `Cmd/Ctrl+S` → force save
- [x] `Cmd/Ctrl+F` → focus search

**Done when:** Search filters live, all shortcuts work on both Mac and Windows.

---

### Task 9 — Polish + production build
**Objective:** Shippable, production-quality app.

- [x] Empty state: no folder selected
- [x] Empty state: no notes in folder
- [x] Empty state: no search results
- [x] Loading states during fs operations
- [x] App icon — 1024×1024 PNG (Tauri auto-generates all sizes)
- [x] `tauri build` produces `.dmg` (macOS) and `.msi` (Windows)
- [x] Verify installer on both platforms, app runs without any dev tooling

**Done when:** Clean installer produced, app runs on fresh machine, notes save to `~/Documents/MarkNotes/`.

---

## Folder Structure (target)

```
test-tauri-app/
├── src/                        # React frontend
│   ├── components/
│   │   ├── titlebar/
│   │   │   └── Titlebar.tsx
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── NoteItem.tsx
│   │   │   └── SearchInput.tsx
│   │   ├── editor/
│   │   │   └── Editor.tsx
│   │   └── preview/
│   │       └── Preview.tsx
│   ├── store/
│   │   └── notes.ts            # Zustand store
│   ├── lib/
│   │   ├── tauri.ts            # typed invoke wrappers
│   │   └── utils.ts
│   ├── hooks/
│   │   └── useNotes.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Tauri commands + app setup
│   │   └── lib.rs
│   ├── capabilities/
│   │   └── default.json        # scoped permissions
│   ├── icons/                  # app icons (all sizes)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── PLAN.md                     # this file
└── package.json
```

---

## Progress

| Task | Status |
|---|---|
| Task 0 — Plan | ✅ Done |
| Task 1 — Scaffold | ✅ Done |
| Task 2 — Tailwind + shadcn + theming | ✅ Done |
| Task 3 — Titlebar + window controls | ✅ Done |
| Task 4 — Rust fs commands | ✅ Done |
| Task 5 — Sidebar + folder init | ✅ Done |
| Task 6 — Editor + preview | ✅ Done |
| Task 7 — CRUD | ✅ Done |
| Task 8 — Search + shortcuts | ✅ Done |
| Task 9 — Polish + build | ✅ Done |
