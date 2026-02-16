export interface Actor {
  id: string;
  name: string;
  description?: string;
  /** "Type_Main" column */
  typeMain?: string;
  /** "Geography" column */
  geography?: string;
  /** "REL Actorslists" – linked record IDs (watchlists) */
  actorListIds?: string[];
  /** "(REL) Actions" – linked record IDs (signals/news) */
  actionIds?: string[];
  // General Info fields
  hqCity?: string;
  website?: string;
  yearFounded?: string | number;
  keywords?: string | string[];
  competitors?: string | string[];
  // Additional fields for other tabs (to be populated)
  [key: string]: any;
}
