export interface Analysis {
  id: string;
  /** "Analyst Name" or fallback title fields */
  title: string;
  /** "Short Description" */
  shortDescription?: string;
  /** "Website" source URL */
  sourceUrl?: string;
  /** "Last Modified" timestamp */
  lastModified?: string;
  /** Linked domain/sub-area IDs */
  domainIds?: string[];
  [key: string]: any;
}
