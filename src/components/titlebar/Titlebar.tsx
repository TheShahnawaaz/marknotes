import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const appWindow = getCurrentWindow();

interface TitlebarProps {
  className?: string;
  onToggleSidebar?: () => void;
}

export function Titlebar({ className, onToggleSidebar }: TitlebarProps) {
  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between select-none bg-background border-b border-border",
        className
      )}
      data-tauri-drag-region
    >
      {/* Left side - toggle and app name */}
      <div className="flex items-center gap-2 pl-2">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <span
          className="text-sm font-medium text-foreground"
          data-tauri-drag-region
        >
          MarkNotes
        </span>
      </div>

      {/* Window controls */}
      <div className="flex h-full">
        <WindowButton
          onClick={() => appWindow.minimize()}
          label="Minimize"
          className="hover:bg-muted"
        >
          <Minus className="h-3.5 w-3.5" />
        </WindowButton>
        <WindowButton
          onClick={() => appWindow.toggleMaximize()}
          label="Maximize"
          className="hover:bg-muted"
        >
          <Square className="h-3 w-3" />
        </WindowButton>
        <WindowButton
          onClick={() => appWindow.close()}
          label="Close"
          className="hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </WindowButton>
      </div>
    </div>
  );
}

function WindowButton({
  onClick,
  label,
  className,
  children,
}: {
  onClick: () => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-full w-11 items-center justify-center text-muted-foreground transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
