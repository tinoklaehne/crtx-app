export interface User {
  id: string;
  /** Display name of the user */
  name: string;
  email: string;
  /** ISO timestamp of the last successful login, from Airtable "Last Login" field */
  lastLogin?: string;
  organisation?: string;
  businessUnit?: string;

  /** App access flags from Airtable boolean fields */
  domainsAccess: boolean;
  directoryAccess: boolean;
  radarsAccess: boolean;
  trendsAccess: boolean;
  libraryAccess: boolean;

  /** Linked record IDs of subscribed domains from \"My_Domains\" column */
  subscribedDomainIds: string[];
  /** Linked record IDs of bookmarked reports from \"My_Reports\" column */
  subscribedReportIds: string[];
  /** Linked record IDs of bookmarked trends from \"My_Trends\" column */
  subscribedTrendIds: string[];
}

