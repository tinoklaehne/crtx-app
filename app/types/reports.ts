export interface Report {
  id: string;
  name: string;
  source?: string;
  /** "(REL) Sub-Area" – linked record IDs (domains) */
  subAreaIds?: string[];
  /** "File" – PDF attachment URL */
  fileUrl?: string;
  /** "-->AI/Summary" – executive summary text */
  summary?: string;
  /** Additional fields for Key Insights and Keywords (to be determined) */
  keyInsights?: string | string[];
  keywords?: string | string[];
  [key: string]: any;
}
