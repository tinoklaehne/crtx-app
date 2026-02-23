/** Strategy theme linked to a domain (Themes table). */
export interface StrategyTheme {
  id: string;
  name: string;
  priority: "P0" | "P1" | "P2";
  time_horizon: string;
  one_liner: string;
  status?: string;
  value_levers: string[];
  strategic_intent: string;
  scope_boundary: string;
  questionIds: string[];
  problemIds: string[];
}

/** Strategic question (Questions table). */
export interface StrategyQuestion {
  id: string;
  question: string;
  themeId: string;
  priority: string;
  question_type: string;
  urgency: string;
  confidence: number;
  answer_status: string;
  problemIds: string[];
}

/** Problem (Problems table). */
export interface StrategyProblem {
  id: string;
  summary: string;
  themeId: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  pain_type: string;
  frequency: string;
  readiness: string;
  impact_estimate: string;
  who_feels_pain: string;
}

export interface DomainStrategyData {
  themes: StrategyTheme[];
  questions: StrategyQuestion[];
  problems: StrategyProblem[];
}
