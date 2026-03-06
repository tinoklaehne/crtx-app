export interface Radar {
  id: string;
  name: string;
  description: string;
  /** Optional logo/icon URL for the radar (Airtable 'Logo' field) */
  logoUrl?: string;
  type: "General" | "Travel";
  level: "Micro" | "Macro" | "Mega";
  cluster: "Parent" | "Taxonomy" | "Domain";
  totalTrends: number;
  lastModified: string;
  trends: string[];
  /** From Airtable "Radar Type" – e.g. "Standalone" for sidepanel filter */
  radarType?: string;
  /** Optional: linked trend cycle(s) that supplied this radar’s long/short list */
  trendCycleIds?: string[];
}