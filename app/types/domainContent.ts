import type { Trend } from "./trends";

export type DomainContentType = "trend" | "news" | "profile" | "insight";

export interface DomainContentItem {
  id: string;
  type: DomainContentType;
  title: string;
  description?: string;
  url?: string;
  date?: string;
  source?: string;
  signalType?: string; // Signal type from Actions table
  // For trends
  trend?: Trend;
  // For profiles
  profileName?: string;
  profileRole?: string;
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface DomainTabContent {
  now: DomainContentItem[];
  new: DomainContentItem[];
  next: DomainContentItem[];
}

export type DomainTab = "now" | "new" | "next";
