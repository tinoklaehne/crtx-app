export type TrendCycleStatus =
  | "Draft"
  | "Open"
  | "Scoring"
  | "Closed"
  | "Archived";

export type TrendCycleItemStage = "Long List" | "Shortlisted" | "Excluded";

export interface TrendScoringMetric {
  id: string;
  name: string;
  code?: string;
  description?: string;
  scaleType?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isDefault?: boolean;
}

export interface TrendCycle {
  id: string;
  name: string;
  code?: string;
  ownerUserId?: string;
  expertUserIds: string[];
  status: TrendCycleStatus;
  startDate?: string;
  endDate?: string;
  description?: string;
  metricIds: string[];
  radarIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TrendCycleItem {
  id: string;
  cycleId: string;
  trendId: string;
  stage: TrendCycleItemStage;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrendAssessment {
  id: string;
  cycleId: string;
  cycleItemId?: string;
  trendId: string;
  expertUserId: string;
  metricId: string;
  score?: number;
  comment?: string;
  status?: "Pending" | "Draft" | "Submitted";
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

