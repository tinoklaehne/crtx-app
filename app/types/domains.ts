export type Domain = "Technology" | "Industry" | "Humanity";

export const DOMAINS: Domain[] = ["Technology", "Industry", "Humanity"];

export const DOMAIN_COLORS = {
  "Technology": "#00B4D8", // Bright blue
  "Industry": "#FF9F1C",   // Orange
  "Humanity": "#2EC4B6"    // Teal
} as const;

export const DOMAIN_ICONS = {
  "Technology": "Cpu",
  "Industry": "Factory", 
  "Humanity": "Users"
} as const;