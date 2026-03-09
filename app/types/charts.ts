export interface Chart {
  id: string;
  /** "Name" */
  title: string;
  /** "Chart" attachment or URL */
  imageUrl?: string;
  /** "Source" original source URL */
  sourceUrl?: string;
  /** "Chart Summarizer" AI-generated summary */
  aiSummary?: string;
  /** "Created" or "Created Time" */
  createdAt?: string;
  /** "REL area" linked record IDs (domains/sub-areas) */
  domainIds?: string[];
  /** "Txt Area" text metadata */
  textArea?: string;
  [key: string]: any;
}
