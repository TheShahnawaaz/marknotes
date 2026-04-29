import { useEffect, useRef, useState } from "react";
import { documentDir } from "@tauri-apps/api/path";
import { getVersion } from "@tauri-apps/api/app";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Titlebar } from "@/components/titlebar/Titlebar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Editor } from "@/components/editor/Editor";
import { Preview } from "@/components/preview/Preview";
import { UpdateChecker } from "@/components/UpdateChecker";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNotesStore } from "@/store/notes";
import { tauriCommands } from "@/lib/tauri";
import path from "@/lib/path";

const WELCOME_NOTE_NAME = "Welcome to MarkNotes.md";
const WELCOME_NOTE_CONTENT = `# Welcome to MarkNotes 👋

A fast, native markdown notes app built with **Tauri 2**.

## Quick Start

| Shortcut | Action |
|----------|--------|
| \`Cmd+N\` | New note |
| \`Cmd+S\` | Force save |
| \`Cmd+F\` | Focus search |
| \`Cmd+W\` | Deselect note |
| \`Cmd+/\` | Show shortcuts |

## Features

- ✍️ **Live Preview** — See your markdown rendered in real-time
- 💾 **Auto-save** — Never lose your work (saves every 500ms)
- 🎨 **Syntax Highlighting** — Beautiful code blocks
- 🔍 **Search** — Filter notes by filename
- 🌙 **Dark/Light Theme** — Toggle in the titlebar

## Markdown Support

**Bold**, *italic*, \`inline code\`, [links](https://github.com/TheShahnawaaz/marknotes)

\`\`\`javascript
// Code blocks with syntax highlighting
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

> Right-click any note in the sidebar to rename or delete it.

---

*Delete this note when you're ready to get started!*
`;

export default function App() {
  const searchRef = useRef<HTMLInputElement>(null);
  const { setFolderPath, loadNotes, activeNoteId, setActiveNote } = useNotesStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Context menu state — positioned at cursor
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; notePath: string } | null>(null);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Shortcuts modal
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close context menu on click/scroll anywhere
  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => {});
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, []);

  // Init default notes folder on first launch
  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem("marknotes-folder");
      const isFirstLaunch = !localStorage.getItem("marknotes-launched");

      let folder = saved;
      if (!folder) {
        const docDir = await documentDir();
        folder = path.join(docDir, "MarkNotes");
        localStorage.setItem("marknotes-folder", folder);
      }

      await tauriCommands.ensureNotesDir(folder);
      setFolderPath(folder);
      await loadNotes();

      // Show welcome note on first launch
      if (isFirstLaunch) {
        localStorage.setItem("marknotes-launched", "1");
        const welcomePath = path.join(folder, WELCOME_NOTE_NAME);
        const exists = await tauriCommands.readNote(welcomePath).then(() => true).catch(() => false);
        if (!exists) {
          await tauriCommands.writeNote(welcomePath, WELCOME_NOTE_CONTENT);
          await useNotesStore.getState().refreshNotes();
          useNotesStore.getState().setActiveNote(welcomePath);
        }
      }
    })();
  }, []);

  // Persist folder changes
  const { folderPath } = useNotesStore();
  useEffect(() => {
    if (folderPath) localStorage.setItem("marknotes-folder", folderPath);
  }, [folderPath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === "n") { e.preventDefault(); handleNewNote(); }
      if (mod && e.key === "s") {
        e.preventDefault();
        if (activeNoteId && content) {
          tauriCommands.writeNote(activeNoteId, content).then(() => toast.success("Saved"));
        }
      }
      if (mod && e.key === "f") { e.preventDefault(); searchRef.current?.focus(); }
      if (mod && e.key === "w") { e.preventDefault(); setActiveNote(null); }
      if (mod && e.key === "/") { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === "Escape") { setContextMenu(null); }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNoteId, content, folderPath]);

  // Load active note content
  useEffect(() => {
    if (!activeNoteId) { setContent(""); return; }
    (async () => {
      setIsLoading(true);
      try {
        const text = await tauriCommands.readNote(activeNoteId);
        setContent(text);
      } catch {
        toast.error("Failed to load note");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [activeNoteId]);

  // Auto-save with 500ms debounce
  const handleContentChange = (value: string) => {
    setContent(value);
    if (!activeNoteId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await tauriCommands.writeNote(activeNoteId, value);
        await useNotesStore.getState().refreshNotes();
      } catch {
        toast.error("Failed to save note");
      }
    }, 500);
  };

  const handleNewNote = async () => {
    const { folderPath, refreshNotes, setActiveNote } = useNotesStore.getState();
    if (!folderPath) return;
    const name = `untitled-${Date.now()}.md`;
    const notePath = path.join(folderPath, name);
    await tauriCommands.writeNote(notePath, "");
    await refreshNotes();
    setActiveNote(notePath);
  };

  const handleNoteContextMenu = (e: React.MouseEvent, notePath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, notePath });
  };

  const handleRenameClick = () => {
    if (!contextMenu) return;
    const currentName = path.basename(contextMenu.notePath).replace(/\.md$/, "");
    setRenameValue(currentName);
    setRenameDialogOpen(true);
    setContextMenu(null);
  };

  const handleRenameConfirm = async () => {
    if (!contextMenu?.notePath && !renameValue.trim()) return;
    const notePath = contextMenu?.notePath ?? deleteTarget!;
    const { folderPath, refreshNotes } = useNotesStore.getState();
    const newName = renameValue.trim().endsWith(".md") ? renameValue.trim() : `${renameValue.trim()}.md`;
    const newPath = path.join(folderPath, newName);
    try {
      await tauriCommands.renameNote(notePath, newPath);
      if (activeNoteId === notePath) setActiveNote(newPath);
      await refreshNotes();
      toast.success("Note renamed");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setRenameDialogOpen(false);
    }
  };

  const handleDeleteClick = () => {
    if (!contextMenu) return;
    setDeleteTarget(contextMenu.notePath);
    setDeleteDialogOpen(true);
    setContextMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { refreshNotes } = useNotesStore.getState();
    try {
      await tauriCommands.deleteNote(deleteTarget);
      if (activeNoteId === deleteTarget) setActiveNote(null);
      await refreshNotes();
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <Titlebar
            appVersion={appVersion}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            onShowShortcuts={() => setShortcutsOpen(true)}
          />
          <div className="flex flex-1 overflow-hidden">
            {!sidebarCollapsed && (
              <div className="w-64 shrink-0">
                <Sidebar
                  onNewNote={handleNewNote}
                  onNoteContextMenu={handleNoteContextMenu}
                  searchRef={searchRef}
                />
              </div>
            )}

            {!activeNoteId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <p className="text-4xl">📝</p>
                <p className="text-sm font-medium text-foreground">
                  {folderPath ? "No note selected" : "Open a folder to get started"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {folderPath ? "Select a note from the sidebar or press ⌘N to create one" : "Click the folder icon in the sidebar"}
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <PanelGroup direction="horizontal" className="flex-1">
                  <Panel defaultSize={50} minSize={30}>
                    {isLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      </div>
                    ) : (
                      <Editor content={content} onChange={handleContentChange} />
                    )}
                  </Panel>
                  <PanelResizeHandle className="w-px bg-border hover:bg-primary transition-colors" />
                  <Panel defaultSize={50} minSize={30}>
                    <Preview content={content} />
                  </Panel>
                </PanelGroup>
                {/* Status bar */}
                <div className="flex h-6 shrink-0 items-center justify-end gap-4 border-t border-border bg-background px-4">
                  <span className="text-xs text-muted-foreground">
                    {content.trim() ? content.trim().split(/\s+/).length : 0} words
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {content.length} chars
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Toaster richColors position="bottom-right" />
        <UpdateChecker />
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        {/* Positioned context menu */}
        {contextMenu && (
          <div
            style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
            className="min-w-[140px] overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors"
              onClick={handleRenameClick}
            >
              Rename
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent transition-colors"
              onClick={handleDeleteClick}
            >
              Delete
            </button>
          </div>
        )}

        {/* Rename dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename note</DialogTitle>
              <DialogDescription>Enter a new name for this note</DialogDescription>
            </DialogHeader>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm()}
              placeholder="Note name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRenameConfirm}>Rename</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete note</DialogTitle>
              <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </ThemeProvider>
  );
}