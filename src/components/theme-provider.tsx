import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];
const DEFAULT_FONT_SIZE = 14;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => null,
  fontSize: DEFAULT_FONT_SIZE,
  increaseFontSize: () => null,
  decreaseFontSize: () => null,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("marknotes-theme") as Theme) ?? "system";
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(localStorage.getItem("marknotes-fontsize")) || DEFAULT_FONT_SIZE;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--editor-font-size", `${fontSize}px`);
    localStorage.setItem("marknotes-fontsize", String(fontSize));
  }, [fontSize]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("marknotes-theme", newTheme);
    setThemeState(newTheme);
  };

  const increaseFontSize = () => {
    setFontSize(prev => {
      const idx = FONT_SIZES.indexOf(prev);
      return idx < FONT_SIZES.length - 1 ? FONT_SIZES[idx + 1] : prev;
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      const idx = FONT_SIZES.indexOf(prev);
      return idx > 0 ? FONT_SIZES[idx - 1] : prev;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
