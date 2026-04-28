import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, Menu, Keyboard, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const appWindow = getCurrentWindow();

interface TitlebarProps {
  className?: string;
  onToggleSidebar?: () => void;
  onShowShortcuts?: () => void;
}

export function Titlebar({ className, onToggleSidebar, onShowShortcuts }: TitlebarProps) {
  const { theme, setTheme, increaseFontSize, decreaseFontSize } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between select-none bg-background border-b border-border",
        className
      )}
      data-tauri-drag-region
    >
      {/* Left side */}
      <div className="flex items-center gap-2 pl-2">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleSidebar}>
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <span className="text-sm font-medium text-foreground" data-tauri-drag-region>
          MarkNotes
        </span>
      </div>

      {/* Right side */}
      <div className="flex h-full items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground font-mono text-xs"
          onClick={decreaseFontSize}
          title="Decrease font size"
        >
          A-
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground font-mono text-sm"
          onClick={increaseFontSize}
          title="Increase font size"
        >
          A+
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 mr-1 text-muted-foreground"
          onClick={cycleTheme}
          title={`Theme: ${theme} (click to cycle)`}
        >
          <ThemeIcon className="h-3.5 w-3.5" />
        </Button>
        {onShowShortcuts && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 mr-1 text-muted-foreground"
            onClick={onShowShortcuts}
            title="Keyboard shortcuts (⌘/)"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </Button>
        )}
        <WindowButton onClick={() => appWindow.minimize()} label="Minimize" className="hover:bg-muted">
          <Minus className="h-3.5 w-3.5" />
        </WindowButton>
        <WindowButton onClick={() => appWindow.toggleMaximize()} label="Maximize" className="hover:bg-muted">
          <Square className="h-3 w-3" />
        </WindowButton>
        <WindowButton onClick={() => appWindow.close()} label="Close" className="hover:bg-destructive hover:text-destructive-foreground">
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
