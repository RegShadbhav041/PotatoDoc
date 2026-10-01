// Whole-app light/dark theming.
//
// Every screen builds its StyleSheet from the palette returned by useTheme()
// (see `makeStyles` pattern in each screen), so flipping `mode` re-renders the
// whole tree with the matching palette. Mode persists in AsyncStorage.
//
// LIGHT is the original palette (src/constants/colors.js) — unchanged.
// DARK maps every token 1:1 onto the designer's "profile dark mode" mockup
// (2026-10-01): near-black page, `#262A25` cards, `#3A3F38` hairlines,
// `#F3F5F1` / `#9AA19A` text.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "./constants/colors";

const MODE_KEY = "potatoDocThemeMode";

export const LIGHT = {
  ...COLORS,
  card: "#FFFFFF",
};

export const DARK = {
  ...COLORS,

  primary: "#43A047",
  primaryDark: "#81C784",
  accent: "#A1887F",

  earlyBlight: "#EF5350",
  lateBlight: "#FF7043",
  healthy: "#66BB6A",
  unknownOrange: "#FFA726",

  background: "#121412",
  card: "#262A25",
  text: "#F3F5F1",
  textLight: "#9AA19A",
  divider: "#3A3F38",

  page: "#121412",
  pageGreen: "#121412",
  ink: "#F3F5F1",
  gray: "#9AA19A",

  leafBg: "#23281F",
  cardBorder: "#3A3F38",
  navBorder: "#3A3F38",

  healthyBg: "#1B2A1A",
  healthyBorder: "#2E4A2E",
  healthyText: "#81C784",
  earlyBg: "#2A211A",
  earlyBorder: "#4A3A28",
  earlyText: "#FFB74D",
  lateBg: "#2A1C1B",
  lateBorder: "#4A2E2C",
  lateText: "#EF9A9A",

  greenDot: "#66BB6A",
  deepGreen: "#1B5E20",
  updateTile: "#2E7D32",
  annTile: "#16283A",
  annInk: "#64B5F6",
  alertInk: "#FFB74D",
  cardUnread: "#1E2A1D",
  lowConfYellow: "#3A3216",
  lowConfBorder: "#C9A227",

  // Profile tokens (dark mockup is the reference, LIGHT keeps its own values)
  darkPage: "#121412",
  darkCard: "#262A25",
  darkTile: "#31352F",
  darkLine: "#3A3F38",
  darkText: "#F3F5F1",
  darkMuted: "#9AA19A",

  // Auth screens on dark: deeper greens, same hue family.
  authBg: "#0E1A11",
  authBtn: "#C9E7CF",
  authAction: "#43A047",
  authPill: "#1E3A24",
  authField: "#16211A",
};

export const PALETTES = { light: LIGHT, dark: DARK };

const ThemeContext = createContext({
  mode: "light",
  colors: LIGHT,
  isDark: false,
  setMode: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("light");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(MODE_KEY)
      .then((v) => {
        if (alive && (v === "dark" || v === "light")) setModeState(v);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next) => {
    const value = next === "dark" ? "dark" : "light";
    setModeState(value);
    AsyncStorage.setItem(MODE_KEY, value).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const value = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(MODE_KEY, value).catch(() => {});
      return value;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: PALETTES[mode],
      isDark: mode === "dark",
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Shorthand for the palette only: `const C = useColors();` */
export function useColors() {
  return useContext(ThemeContext).colors;
}
