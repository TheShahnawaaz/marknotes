import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ScrollArea } from "@/components/ui/scroll-area";
import "highlight.js/styles/github-dark.css";

interface PreviewProps {
  content: string;
}

export function Preview({ content }: PreviewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="prose prose-sm dark:prose-invert max-w-none p-6" style={{ fontSize: "var(--editor-font-size, 14px)" }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content || "*No content yet — start typing in the editor*"}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
}
