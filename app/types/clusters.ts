import type { Domain } from "./domains";
import type { AirtableAttachment } from "./airtable";
import type { Trend } from "./trends";

export interface Cluster {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  image?: AirtableAttachment[];
  colorCode: string;
  domain: Domain;

  // Mark as optional for virtual clusters
  universe?: "General" | "Travel";
  trends?: Trend[];
  technologies?: Trend[];
}