import { NoteEntry } from "@/lib/tauri";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

function relativeTime(unixSecs: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSecs;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unixSecs * 1000).toLocaleDateString();
}

interface NoteItemProps {
  note: NoteEntry;
  isActive: boolean;
  searchQuery: string;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function NoteItem({ note, isActive, searchQuery, onClick, onContextMenu }: NoteItemProps) {
  const displayName = note.name.replace(/\.md$/, "");

  // Highlight matched substring
  const highlight = (text: string) => {
    if (!searchQuery) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-foreground rounded-sm">{text.slice(idx, idx + searchQuery.length)}</mark>
        {text.slice(idx + searchQuery.length)}
      </span>
    );
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "w-full flex items-start gap-2.5 rounded-md px-3 py-2.5 text-left transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-muted text-foreground"
      )}
    >
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{highlight(displayName)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(note.modified)}</p>
      </div>
    </button>
  );
}
