export interface Report {
  id: string;
  name: string;
  source?: string;
  /** "Source Logo" – logo URL or attachment */
  sourceLogo?: string;
  /** "(REL) Sub-Area" – linked record IDs (domains) */
  subAreaIds?: string[];
  /** "File" – PDF attachment URL */
  fileUrl?: string;
  /** "-->AI/Summary" – executive summary text */
  summary?: string;
  /** "-->AI/Transcript" – report transcript text */
  transcript?: string;
  /** "Year" – report year */
  year?: string | number;
  /** "Created" – Airtable created time (ISO string) */
  createdAt?: string;
  /** Additional fields for Key Insights and Keywords (to be determined) */
  keyInsights?: string | string[];
  keywords?: string | string[];
  [key: string]: any;
}
