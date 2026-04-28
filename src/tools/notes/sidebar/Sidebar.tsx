import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NoteItem } from "./NoteItem";
import { useNotesStore } from "@/store/notes";
import { tauriCommands } from "@/lib/tauri";
import path from "@/lib/path";

interface SidebarProps {
  onNewNote: () => void;
  onNoteContextMenu: (e: React.MouseEvent, notePath: string) => void;
  searchRef: React.RefObject<HTMLInputElement>;
}

export function Sidebar({ onNewNote, onNoteContextMenu, searchRef }: SidebarProps) {
  const [search, setSearch] = useState("");
  const { folderPath, notes, activeNoteId, setFolderPath, loadNotes, setActiveNote } = useNotesStore();

  const filteredNotes = search
    ? notes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    : notes;

  const handleOpenFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected || typeof selected !== "string") return;
      await tauriCommands.ensureNotesDir(selected);
      setFolderPath(selected);
      await loadNotes();
    } catch (err) {
      toast.error("Failed to open folder");
    }
  };

  return (
    <div className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-background">
      {/* Toolbar */}
      <div className="flex h-10 items-center gap-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenFolder}>
              <FolderOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open folder</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onNewNote}
              disabled={!folderPath}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New note (⌘N)</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          {folderPath ? path.basename(folderPath) : "No folder"}
        </span>
      </div>

      <Separator />

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Note list */}
      <ScrollArea className="flex-1 px-1">
        {!folderPath ? (
          <EmptyState message="Open a folder to get started" />
        ) : filteredNotes.length === 0 ? (
          <EmptyState message={search ? "No notes match your search" : "No notes yet — create one"} />
        ) : (
          <div className="space-y-0.5 pb-2">
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.path}
                note={note}
                isActive={activeNoteId === note.path}
                searchQuery={search}
                onClick={() => setActiveNote(note.path)}
                onContextMenu={(e) => onNoteContextMenu(e, note.path)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center px-4">
      <p className="text-center text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
