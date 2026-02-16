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
}
