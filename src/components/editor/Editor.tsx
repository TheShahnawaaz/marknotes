import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { useTheme } from "@/components/theme-provider";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setEditorTheme(isDark ? "dark" : "light");
    } else {
      setEditorTheme(theme);
    }
  }, [theme]);

  return (
    <div className="h-full overflow-auto" style={{ fontSize: "var(--editor-font-size, 14px)" }}>
      <CodeMirror
        value={content}
        onChange={onChange}
        theme={editorTheme}
        extensions={[markdown()]}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightSelectionMatches: true,
        }}
      />
    </div>
  );
}
