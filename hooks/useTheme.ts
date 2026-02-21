"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export type Theme =
  | "system"
  | "dark"
  | "neon-pink"
  | "retro-80s"
  | "matrix"
  | "synthwave"
  | "dracula"
  | "ocean"
  | "blood-moon"
  | "solar-gold"
  | "arctic";

export interface ThemeColors {
  background: string;
  surface: string;
  elevated: string;
  accent: string;
  accentDim: string;
  success: string;
  warning: string;
  danger: string;
}

const themeColors: Record<string, ThemeColors> = {
  dark: {
    background: "#000000",
    surface: "#0a0a0a",
    elevated: "#111111",
    accent: "#00e5ff",
    accentDim: "rgba(0, 229, 255, 0.12)",
    success: "#39d98a",
    warning: "#f5a623",
    danger: "#e85555",
  },
  "neon-pink": {
    background: "#0d0221",
    surface: "#140330",
    elevated: "#1c0542",
    accent: "#ff007f",
    accentDim: "rgba(255, 0, 127, 0.14)",
    success: "#00ffcc",
    warning: "#ffb703",
    danger: "#ff0055",
  },
  "retro-80s": {
    background: "#11001c",
    surface: "#1f0033",
    elevated: "#2d004d",
    accent: "#ff4d00",
    accentDim: "rgba(255, 77, 0, 0.14)",
    success: "#0aff99",
    warning: "#ffee32",
    danger: "#ff206e",
  },
  matrix: {
    background: "#000a00",
    surface: "#001400",
    elevated: "#001f00",
    accent: "#00ff41",
    accentDim: "rgba(0, 255, 65, 0.12)",
    success: "#00cc33",
    warning: "#cccc00",
    danger: "#cc0000",
  },
  synthwave: {
    background: "#08001a",
    surface: "#0f0028",
    elevated: "#18003f",
    accent: "#e040fb",
    accentDim: "rgba(224, 64, 251, 0.14)",
    success: "#00e5ff",
    warning: "#ffec00",
    danger: "#ff1744",
  },
  dracula: {
    background: "#0d0d1a",
    surface: "#16162a",
    elevated: "#1e1e3a",
    accent: "#bd93f9",
    accentDim: "rgba(189, 147, 249, 0.14)",
    success: "#50fa7b",
    warning: "#f1fa8c",
    danger: "#ff5555",
  },
  ocean: {
    background: "#000a1a",
    surface: "#00111f",
    elevated: "#001833",
    accent: "#00b4d8",
    accentDim: "rgba(0, 180, 216, 0.14)",
    success: "#00e676",
    warning: "#ffd740",
    danger: "#ff5252",
  },
  "blood-moon": {
    background: "#0a0000",
    surface: "#130000",
    elevated: "#1e0000",
    accent: "#ff1744",
    accentDim: "rgba(255, 23, 68, 0.14)",
    success: "#ff9100",
    warning: "#ff6d00",
    danger: "#d50000",
  },
  "solar-gold": {
    background: "#0a0700",
    surface: "#120e00",
    elevated: "#1c1500",
    accent: "#ffc107",
    accentDim: "rgba(255, 193, 7, 0.14)",
    success: "#69f0ae",
    warning: "#ff9800",
    danger: "#f44336",
  },
  arctic: {
    background: "#010a12",
    surface: "#051525",
    elevated: "#0a2040",
    accent: "#80deea",
    accentDim: "rgba(128, 222, 234, 0.14)",
    success: "#a5d6a7",
    warning: "#fff176",
    danger: "#ef9a9a",
  },
};

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = (resolvedTheme as Theme) || "dark";
  const colors = themeColors[activeTheme] || themeColors.dark;

  return {
    theme: theme as Theme,
    setTheme: (t: Theme) => setTheme(t),
    resolvedTheme: resolvedTheme as Theme,
    systemTheme: systemTheme as Theme,
    activeTheme,
    colors,
    mounted,
    isCyberpunk: activeTheme === "dark",
    isNeonPink: activeTheme === "neon-pink",
    isRetro80s: activeTheme === "retro-80s",
    isMatrix: activeTheme === "matrix",
    isSynthwave: activeTheme === "synthwave",
    isDracula: activeTheme === "dracula",
    isOcean: activeTheme === "ocean",
    isBloodMoon: activeTheme === "blood-moon",
    isSolarGold: activeTheme === "solar-gold",
    isArctic: activeTheme === "arctic",
  };
}

export { themeColors };
