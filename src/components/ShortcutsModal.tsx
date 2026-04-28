import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const isMac = navigator.platform.toUpperCase().includes("MAC");
const mod = isMac ? "⌘" : "Ctrl";

const shortcuts = [
  { key: `${mod} N`, action: "New note" },
  { key: `${mod} S`, action: "Force save" },
  { key: `${mod} F`, action: "Focus search" },
  { key: `${mod} W`, action: "Deselect note" },
  { key: `${mod} /`, action: "Show shortcuts" },
  { key: "Esc", action: "Close menu / dialog" },
];

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{action}</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
