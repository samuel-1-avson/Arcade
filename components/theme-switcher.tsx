"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    { id: "system", name: "System" },
    { id: "dark", name: "Cyberpunk" }, // Default dark maps to Cyberpunk
    { id: "neon-pink", name: "Neon Pink" },
    { id: "retro-80s", name: "Retro 80s" },
    { id: "matrix", name: "Matrix" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
        aria-label="Toggle theme"
      >
        <Palette className="w-5 h-5 text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent-dim)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl shadow-black/50 z-50 animate-fade-in backdrop-blur-md">
          <div className="px-3 pb-2 pt-1 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1 border-b border-[var(--border)]">
            Select Theme
          </div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--elevated)] hover:text-[var(--accent)] flex items-center gap-2 ${
                theme === t.id ? "text-[var(--accent)] bg-[var(--accent-dim)]" : "text-[var(--muted-foreground)]"
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full border border-white/20" 
                style={{
                  background: t.id === 'system' ? 'linear-gradient(135deg, #000 50%, #fff 50%)' :
                             t.id === 'dark' ? '#00e5ff' :
                             t.id === 'neon-pink' ? '#ff007f' :
                             t.id === 'retro-80s' ? '#ff4d00' :
                             t.id === 'matrix' ? '#00ff00' : 'transparent'
                }}
              />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
