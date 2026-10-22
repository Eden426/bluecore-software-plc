import { useCallback, useEffect, useMemo, useState } from "react";
import { THEMES, THEME_STORAGE_KEY } from "../constants/theme";
import { ThemeContext } from "./themeContext";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return THEMES.DARK;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === THEMES.DARK || saved === THEMES.LIGHT) return saved;
    } catch {
      // Storage may be unavailable; dark remains the first-visit default.
    }
    return THEMES.DARK;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === THEMES.DARK);
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === THEMES.DARK ? "#09090b" : "#ffffff",
    );
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) !== theme) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch {
      // Theme still works when storage is blocked.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) =>
      current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK,
    );
  }, []);
  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
