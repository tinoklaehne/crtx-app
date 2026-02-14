"use client";

// Re-export types from other modules
export type { Cluster } from "./clusters";
export type { Trend } from "./trends";
export type { Domain } from "./domains";
export type { Radar } from "./radars";
export type { AirtableAttachment } from "./airtable";
export type { BusinessDomain } from "./businessDomains";
export type { DomainContentItem, DomainTabContent, DomainTab, DomainContentType } from "./domainContent";

// Local types
export type TrendHorizon = "0-2" | "2-5" | "5-10" | "10-15" | "15+";
export type NodePositioning = "trl" | "brl" | "horizon";

export interface HomeSettings {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  clusterIds?: string[];
  technologyIds?: string[];
}