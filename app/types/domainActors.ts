export interface DomainActorInsight {
  id: string;
  name: string;
  type?: string;
  typeMain?: string;
  typeMainValues?: string[];
  geography?: string;
  logoUrl?: string;
  actionCount: number;
  firstSeenAt?: string;
  isStartup: boolean;
  isNewStartup: boolean;
}

export interface DomainActorInsightsData {
  actors: DomainActorInsight[];
  startups: DomainActorInsight[];
  newStartups: DomainActorInsight[];
}
