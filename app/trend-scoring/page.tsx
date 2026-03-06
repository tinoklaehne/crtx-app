import { getAllTrends } from "@/lib/airtable/general";
import { TrendScoringPage } from "@/app/components/trendScoring/TrendScoringPage";

export const revalidate = 60;

export default async function TrendScoringRoute() {
  const trends = await getAllTrends().catch(() => []);
  return <TrendScoringPage allTrends={trends ?? []} />;
}

