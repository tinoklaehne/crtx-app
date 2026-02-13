import type { Domain } from "./domains";
import type { AirtableAttachment } from "./airtable";

export type TrendHorizon = "0-2" | "2-5" | "5-10" | "10-15" | "15+";

export interface Trend {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  image?: AirtableAttachment[];
  clusterId: string;
  taxonomyId?: string;
  domain: string;
  universe: "General" | "Travel";
  technologyReadinessLevel: number;
  businessReadinessLevel: number;
  trendHorizon: TrendHorizon;
  trendHorizonReasoning?: string;
  trlReasoning?: string;
  brlReasoning?: string;
  aliases?: string[];
}