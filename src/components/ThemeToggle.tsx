"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem("fleetflow-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fleetflow-theme");
    const initial: ThemeMode = stored === "dark" || stored === "light" ? stored : "light";
    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ready && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 bg-white/80 text-slate-700 shadow-lg backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-100"
    >
      {ready && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
