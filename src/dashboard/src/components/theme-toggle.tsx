"use client";

import { useState } from "react";
import { Moon } from "lucide-react";

type Theme = "light" | "dark";

function resolveTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    // Ignore storage access errors and fall back to current DOM class.
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("theme", next);
  } catch {
    // localStorage may be unavailable (private mode, cookies disabled).
    // Ignore and keep the in-memory state.
  }
}

function resolveAndApplyInitialTheme(): Theme {
  const initial = resolveTheme();
  if (typeof window !== "undefined") {
    applyTheme(initial);
  }
  return initial;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(resolveAndApplyInitialTheme);

  function toggle() {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      suppressHydrationWarning
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
    >
      <Moon className="h-4 w-4" />
      <span suppressHydrationWarning>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
