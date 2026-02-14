import type { AirtableAttachment } from "./airtable";

export interface BusinessDomain {
  id: string;
  name: string;
  description?: string;
  status?: "Hot" | "Cold" | string;
  /** From Airtable "Total Actions Month" */
  signalsMonth?: number;
  /** From Airtable "Total Actions" */
  signalsTotal?: number;
  /** From Airtable "Total Actions Quarter" */
  signalsQuarter?: number;
  icon?: string;
  iconUrl?: string;
  imageUrl?: string;
  image?: AirtableAttachment[];
  colorCode?: string;
  // Additional fields that may exist in Airtable
  [key: string]: any;
}

/** Momentum data for sparkline (e.g. last 12 months) */
export interface MomentumDataPoint {
  period: string;
  count: number;
}

export type DomainWithMomentum = BusinessDomain & {
  momentumData?: MomentumDataPoint[];
};
