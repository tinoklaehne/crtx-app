export type PowerSearchEntityType =
  | "signal"
  | "domain"
  | "trend"
  | "report"
  | "actor";

export interface PowerSearchItem {
  id: string;
  type: PowerSearchEntityType;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
  external?: boolean;
}

export interface PowerSearchGroupedResults {
  signals: PowerSearchItem[];
  domains: PowerSearchItem[];
  trends: PowerSearchItem[];
  reports: PowerSearchItem[];
  actors: PowerSearchItem[];
}
