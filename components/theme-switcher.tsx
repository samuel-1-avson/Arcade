"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";

interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  /** [background, surface, accent] */
  swatchColors: [string, string, string];
}

const THEMES: ThemeEntry[] = [
  {
    id: "dark",
    name: "Cyberpunk",
    description: "Electric cyan on pure black",
    swatchColors: ["#000000", "#0a0a0a", "#00e5ff"],
  },
  {
    id: "neon-pink",
    name: "Neon Pink",
    description: "Hot pink on deep violet",
    swatchColors: ["#0d0221", "#140330", "#ff007f"],
  },
  {
    id: "retro-80s",
    name: "Retro 80s",
    description: "Neon orange on dark purple",
    swatchColors: ["#11001c", "#1f0033", "#ff4d00"],
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Terminal green on void black",
    swatchColors: ["#000a00", "#001400", "#00ff41"],
  },
  {
    id: "synthwave",
    name: "Synthwave",
    description: "Electric violet on indigo night",
    swatchColors: ["#08001a", "#0f0028", "#e040fb"],
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Soft purple on dark navy",
    swatchColors: ["#0d0d1a", "#16162a", "#bd93f9"],
  },
  {
    id: "ocean",
    name: "Ocean Deep",
    description: "Teal blue on midnight navy",
    swatchColors: ["#000a1a", "#00111f", "#00b4d8"],
  },
  {
    id: "blood-moon",
    name: "Blood Moon",
    description: "Crimson red on obsidian black",
    swatchColors: ["#0a0000", "#130000", "#ff1744"],
  },
  {
    id: "solar-gold",
    name: "Solar Gold",
    description: "Amber gold on warm black",
    swatchColors: ["#0a0700", "#120e00", "#ffc107"],
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Ice blue on frozen midnight",
    swatchColors: ["#010a12", "#051525", "#80deea"],
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!mounted) return null;

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Switch theme"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-[var(--accent-border)] hover:bg-[var(--accent-dim)] group"
      >
        {/* Mini swatch of active theme */}
        <div className="flex gap-0.5 items-center">
          {active.swatchColors.map((c, i) => (
            <div
              key={i}
              className="rounded-full border border-white/10"
              style={{
                width: i === 2 ? 10 : 7,
                height: i === 2 ? 10 : 7,
                background: c,
                boxShadow: i === 2 ? `0 0 6px ${c}` : undefined,
              }}
            />
          ))}
        </div>
        <Palette className="w-4 h-4 text-[var(--accent)]" />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/70 z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
              Choose Theme
            </span>
          </div>

          {/* Theme list */}
          <div className="py-1.5 max-h-[420px] overflow-y-auto">
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all group ${
                    isActive
                      ? "bg-[var(--accent-dim)]"
                      : "hover:bg-[var(--elevated)]"
                  }`}
                >
                  {/* Color swatch card */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex flex-col"
                    style={{ boxShadow: isActive ? `0 0 10px ${t.swatchColors[2]}55` : undefined }}
                  >
                    {/* Top half: bg + surface split */}
                    <div className="flex flex-1">
                      <div style={{ background: t.swatchColors[0] }} className="flex-1" />
                      <div style={{ background: t.swatchColors[1] }} className="flex-1" />
                    </div>
                    {/* Bottom strip: accent */}
                    <div
                      style={{
                        background: t.swatchColors[2],
                        height: "35%",
                        boxShadow: `0 0 8px ${t.swatchColors[2]}`,
                      }}
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-semibold leading-tight ${
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-white/80 group-hover:text-white"
                      }`}
                    >
                      {t.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5 truncate">
                      {t.description}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--muted)] text-center">
            {THEMES.length} themes available
          </div>
        </div>
      )}
    </div>
  );
}
