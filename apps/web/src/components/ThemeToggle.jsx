import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/useTheme";
import { trackThemeToggle } from "../lib/analytics";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    toggleTheme();
    trackThemeToggle(nextTheme);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={handleToggle}
      className="relative h-11 w-16 shrink-0 cursor-pointer rounded-full"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-1 h-9 rounded-full border p-1 transition-colors duration-200 ${
          isDark ? "border-white/12 bg-[#2A2420]" : "border-[#DCE5EF] bg-[#EDF3FA]"
        }`}
      >
        <span
          className={`absolute left-1 top-1 grid size-7 place-items-center rounded-full shadow-sm transition-transform duration-200 ease-out ${
            isDark
              ? "translate-x-7 bg-[#151515] text-[#F4D7B2]"
              : "translate-x-0 bg-white text-[#103759]"
          }`}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </span>
      </span>
    </button>
  );
}
