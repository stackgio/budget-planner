"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("mf-theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };
  return (
    <button type="button" onClick={toggle} aria-label="Toggle dark mode" className={className ?? "inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"}>
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export const themeScript = `(function(){try{var t=localStorage.getItem('mf-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
