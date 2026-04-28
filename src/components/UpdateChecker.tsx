import { useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = await check();
        if (result?.available) setUpdate(result);
      } catch {
        // Silently ignore — no internet, server down, etc.
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleDownload() {
    if (!update) return;
    setStatus("downloading");
    let downloaded = 0;
    let total = 0;

    try {
      // Download only — don't install yet
      await update.download((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) setProgress(Math.round((downloaded / total) * 100));
        } else if (event.event === "Finished") {
          setStatus("ready");
        }
      });
    } catch (e) {
      setError("Download failed. Please try again.");
      setStatus("error");
    }
  }

  async function handleInstall() {
    if (!update) return;
    try {
      // Install the already-downloaded update, then relaunch
      await update.install();
      await relaunch();
    } catch (e) {
      setError("Install failed. Please restart manually.");
      setStatus("error");
    }
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "13px" }}>
            {status === "ready" ? "Ready to install" : `Update available — v${update.version}`}
          </div>
          {update.body && status === "idle" && (
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
              {update.body.slice(0, 80)}{update.body.length > 80 ? "…" : ""}
            </div>
          )}
        </div>
        {status === "idle" && (
          <button
            onClick={() => setUpdate(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: "16px", lineHeight: 1, padding: "0 0 0 8px" }}
            aria-label="Dismiss"
          >×</button>
        )}
      </div>

      {/* Idle — show buttons */}
      {status === "idle" && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleDownload}
            style={{ flex: 1, padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--primary)", color: "var(--primary-foreground)", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
          >
            Update now
          </button>
          <button
            onClick={() => setUpdate(null)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--foreground)", cursor: "pointer", fontSize: "12px" }}
          >
            Later
          </button>
        </div>
      )}

      {/* Downloading — show progress */}
      {status === "downloading" && (
        <div>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
            Downloading… {progress > 0 ? `${progress}%` : ""}
          </div>
          <div style={{ height: "4px", background: "var(--muted)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--primary)", borderRadius: "2px", transition: "width 0.2s" }} />
          </div>
        </div>
      )}

      {/* Ready — prompt to restart */}
      {status === "ready" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
            Download complete. Restart to apply the update.
          </div>
          <button
            onClick={handleInstall}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--primary)", color: "var(--primary-foreground)", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
          >
            Restart now
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{ fontSize: "12px", color: "var(--destructive)" }}>{error}</div>
      )}
    </div>
  );
}
