import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import "highlight.js/styles/github-dark.css";

interface PreviewProps {
  content: string;
  noteTitle?: string;
}

// Minimal print-ready HTML wrapper — auto-triggers print dialog on open
function buildPrintHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 13pt; line-height: 1.6; max-width: 800px; margin: 2cm auto; color: #111; }
  pre { background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto; }
  code { font-family: monospace; font-size: 0.9em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px 12px; }
  blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 1em; color: #555; }
  img { max-width: 100%; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
${bodyHtml}
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

export function Preview({ content, noteTitle }: PreviewProps) {
  const handleExportPdf = async () => {
    // Get the rendered HTML from the preview div
    const el = document.getElementById("print-preview");
    if (!el) return;
    const html = buildPrintHtml(noteTitle ?? "Note", el.innerHTML);

    // Write to a temp file via Rust, then open in default browser
    try {
      const tmpPath: string = await invoke("write_temp_html", { content: html });
      await invoke("open_in_browser", { path: tmpPath });
    } catch (e) {
      // Fallback: window.print() in case Rust commands aren't available yet
      window.print();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center justify-end border-b border-border px-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-xs text-muted-foreground"
          onClick={handleExportPdf}
          disabled={!content.trim()}
          title="Export as PDF"
        >
          <Download className="h-3 w-3" />
          PDF
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div
          id="print-preview"
          className="prose prose-sm dark:prose-invert max-w-none p-6"
          style={{ fontSize: "var(--editor-font-size, 14px)" }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {content || "*No content yet — start typing in the editor*"}
          </ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
}
