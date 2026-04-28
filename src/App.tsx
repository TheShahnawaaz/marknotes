import { useEffect, useRef, useState } from "react";
import { documentDir } from "@tauri-apps/api/path";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Menu } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Titlebar } from "@/components/titlebar/Titlebar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Editor } from "@/components/editor/Editor";
import { Preview } from "@/components/preview/Preview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function App() {
  const searchRef = useRef<HTMLInputElement>(null);
  const { setFolderPath, loadNotes, activeNoteId, setActiveNote } = useNotesStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuNote, setContextMenuNote] = useState<string | null>(null);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Init default notes folder on first launch
  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem("marknotes-folder");
      if (saved) {
        setFolderPath(saved);
        await tauriCommands.ensureNotesDir(saved);
        await loadNotes();
        return;
      }
      const docDir = await documentDir();
      const defaultFolder = path.join(docDir, "MarkNotes");
      await tauriCommands.ensureNotesDir(defaultFolder);
      localStorage.setItem("marknotes-folder", defaultFolder);
      setFolderPath(defaultFolder);
      await loadNotes();
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

      // Cmd/Ctrl+N — New note
      if (mod && e.key === "n") {
        e.preventDefault();
        handleNewNote();
      }

      // Cmd/Ctrl+S — Force save (already auto-saves, but good UX)
      if (mod && e.key === "s") {
        e.preventDefault();
        if (activeNoteId && content) {
          tauriCommands.writeNote(activeNoteId, content).then(() => {
            toast.success("Saved");
          });
        }
      }

      // Cmd/Ctrl+F — Focus search
      if (mod && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNoteId, content, folderPath]);

  // Load active note content
  useEffect(() => {
    if (!activeNoteId) {
      setContent("");
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const text = await tauriCommands.readNote(activeNoteId);
        setContent(text);
      } catch (err) {
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
      } catch (err) {
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
    setContextMenuNote(notePath);
    setContextMenuOpen(true);
  };

  const handleRenameClick = () => {
    if (!contextMenuNote) return;
    const currentName = path.basename(contextMenuNote).replace(/\.md$/, "");
    setRenameValue(currentName);
    setRenameDialogOpen(true);
    setContextMenuOpen(false);
  };

  const handleRenameConfirm = async () => {
    if (!contextMenuNote || !renameValue.trim()) return;
    const { folderPath, refreshNotes } = useNotesStore.getState();
    const newName = renameValue.trim().endsWith(".md") ? renameValue.trim() : `${renameValue.trim()}.md`;
    const newPath = path.join(folderPath, newName);

    try {
      await tauriCommands.renameNote(contextMenuNote, newPath);
      if (activeNoteId === contextMenuNote) setActiveNote(newPath);
      await refreshNotes();
      toast.success("Note renamed");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setRenameDialogOpen(false);
      setContextMenuNote(null);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setContextMenuOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!contextMenuNote) return;
    const { refreshNotes } = useNotesStore.getState();

    try {
      await tauriCommands.deleteNote(contextMenuNote);
      if (activeNoteId === contextMenuNote) setActiveNote(null);
      await refreshNotes();
      toast.success("Note deleted");
    } catch (err) {
      toast.error("Failed to delete note");
    } finally {
      setDeleteDialogOpen(false);
      setContextMenuNote(null);
    }
  };

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <Titlebar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
          <div className="flex flex-1 overflow-hidden">
            {/* Fixed sidebar */}
            {!sidebarCollapsed && (
              <div className="w-64 shrink-0">
                <Sidebar
                  onNewNote={handleNewNote}
                  onNoteContextMenu={handleNoteContextMenu}
                  searchRef={searchRef}
                />
              </div>
            )}

            {/* Resizable editor and preview */}
            {!activeNoteId ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {folderPath ? "Select a note to start editing" : "Open a folder to get started"}
                </p>
              </div>
            ) : (
              <PanelGroup orientation="horizontal" className="flex-1">
                {/* Editor panel */}
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

                {/* Preview panel */}
                <Panel defaultSize={50} minSize={30}>
                  <Preview content={content} />
                </Panel>
              </PanelGroup>
            )}
          </div>
        </div>
        <Toaster richColors position="bottom-right" />

        {/* Context menu */}
        <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleRenameClick}>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameConfirm}>Rename</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete note</DialogTitle>
              <DialogDescription>
                Are you sure? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </ThemeProvider>
  );
}
