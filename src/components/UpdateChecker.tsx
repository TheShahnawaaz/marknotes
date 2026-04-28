import { useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check for updates silently on startup, after a short delay
    const timer = setTimeout(async () => {
      try {
        const result = await check();
        if (result?.available) {
          setUpdate(result);
        }
      } catch {
        // Silently ignore — no internet, GitHub down, etc.
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  async function handleUpdate() {
    if (!update) return;
    setStatus("downloading");
    let downloaded = 0;
    let total = 0;

    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) {
            setProgress(Math.round((downloaded / total) * 100));
          }
        } else if (event.event === "Finished") {
          setStatus("done");
        }
      });
      await relaunch();
    } catch {
      setStatus("idle");
      setUpdate(null);
    }
  }

  function handleDismiss() {
    setUpdate(null);
  }

  if (!update) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
        background: "var(--background)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        minWidth: "260px",
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "13px" }}>
            Update available — v{update.version}
          </div>
          {update.body && (
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
              {update.body.slice(0, 80)}{update.body.length > 80 ? "…" : ""}
            </div>
          )}
        </div>
        {status === "idle" && (
          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              fontSize: "16px",
              lineHeight: 1,
              padding: "0 0 0 8px",
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {status === "idle" && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleUpdate}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            Update now
          </button>
          <button
            onClick={handleDismiss}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--foreground)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Later
          </button>
        </div>
      )}

      {status === "downloading" && (
        <div>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
            Downloading… {progress > 0 ? `${progress}%` : ""}
          </div>
          <div style={{ height: "4px", background: "var(--muted)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--primary)",
                borderRadius: "2px",
                transition: "width 0.2s",
              }}
            />
          </div>
        </div>
      )}

      {status === "done" && (
        <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
          Relaunching…
        </div>
      )}
    </div>
  );
}
