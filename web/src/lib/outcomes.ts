import type { Outcome } from "@/lib/types";

/** Display order, shared by legends, filters, and tables. */
export const OUTCOME_ORDER: Outcome[] = [
  "Ball",
  "Called Strike",
  "Swinging Strike",
  "Foul",
  "Hit By Pitch",
  "In Play: Out",
  "In Play: Hit",
  "In Play: Other",
];

/**
 * Hex values mirroring the --outcome-* CSS custom properties in globals.css.
 * Kept as a JS map (rather than reading the CSS vars) because Recharts needs
 * literal color strings for fills/strokes.
 */
export const OUTCOME_COLORS: Record<Outcome, string> = {
  Ball: "#8ecae6",
  "Called Strike": "#219ebc",
  "Swinging Strike": "#023047",
  Foul: "#f5a623",
  "Hit By Pitch": "#c8102e",
  "In Play: Out": "#6c757d",
  "In Play: Hit": "#2a9d8f",
  "In Play: Other": "#adb5bd",
  Other: "#adb5bd",
};

export const OUTCOME_SHORT_LABEL: Record<Outcome, string> = {
  Ball: "Ball",
  "Called Strike": "Called K",
  "Swinging Strike": "Whiff",
  Foul: "Foul",
  "Hit By Pitch": "HBP",
  "In Play: Out": "Out",
  "In Play: Hit": "Hit",
  "In Play: Other": "In Play",
  Other: "Other",
};
