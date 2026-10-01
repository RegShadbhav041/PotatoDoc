export const COLORS = {
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  accent: "#8D6E63",
  cameraBrown: "#795548",
  galleryGreen: "#2E7D32",
  earlyBlight: "#C62828",
  lateBlight: "#E65100",
  healthy: "#2E7D32",
  unknownOrange: "#EF6C00",
  lowConfYellow: "#FFF9C4",
  lowConfBorder: "#F9A825",
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#212121",
  textLight: "#757575",
  divider: "#E0E0E0",

  page: "#FAFAF7",
  // Pale-green pages (History + News mockups)
  pageGreen: "#EDF5E6",
  bellBadge: "#E53935",
  greenDot: "#43A047",
  ink: "#1A1A1A",
  gray: "#6B7280",
  leafBg: "#E9EFE7",
  cardBorder: "#E5E7EB",
  navBorder: "#E5E7EB",
  scanSub: "rgba(255,255,255,0.85)",
  healthyBg: "#EAF1E8",
  healthyBorder: "#C7DEC6",
  healthyText: "#388E3C",
  earlyBg: "#F9EFE5",
  earlyBorder: "#F8D3B2",
  earlyText: "#F57F17",
  lateBg: "#F5E8E6",
  lateBorder: "#EAB8B6",
  lateText: "#C62828",

  // Dark Profile mockup (2026-10-01)
  darkPage: "#121412",
  darkCard: "#262A25",
  darkTile: "#31352F",
  darkLine: "#3A3F38",
  darkText: "#F3F5F1",
  darkMuted: "#9AA19A",
  danger: "#E53935",

  // Accent tokens shared by both themes (News screen chips/banners)
  deepGreen: "#023422",
  authAction: "#023422",
  updateTile: "#1B5E20",
  annTile: "#E3F2FD",
  annInk: "#1565C0",
  alertInk: "#F57F17",
  cardUnread: "#FDFEFC",

  // Auth screens only (the rest of the app keeps page: "#FAFAF7")
  authBg: "#E5F1DD",
  authBtn: "#023422",
  authPill: "#C0EEC9",
  authField: "#F6FAF4",
};

export const CLASS_COLORS = {
  "Early Blight": COLORS.earlyBlight,
  "Late Blight": COLORS.lateBlight,
  Healthy: COLORS.healthy,
  Unknown: COLORS.unknownOrange,
};

/** Same map, but from a theme palette (use with `const C = useColors()`). */
export function classColors(C = COLORS) {
  return {
    "Early Blight": C.earlyBlight,
    "Late Blight": C.lateBlight,
    Healthy: C.healthy,
    Unknown: C.unknownOrange,
  };
}
