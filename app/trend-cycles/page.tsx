import { getAllTrends } from "@/lib/airtable/general";
import { getAllUsers } from "@/lib/airtable/users";
import {
  getAllTrendCycles,
  getTrendScoringMetrics,
} from "@/lib/airtable/trendCycles";
import { getAllRadars } from "@/lib/airtable/radars";
import { TrendCyclesPage } from "@/app/components/trendCycles/TrendCyclesPage";

export const revalidate = 60;

export default async function TrendCyclesRoute() {
  const [cycles, trends, users, metrics, radars] = await Promise.all([
    getAllTrendCycles().catch(() => []),
    getAllTrends().catch(() => []),
    getAllUsers().catch(() => []),
    getTrendScoringMetrics().catch(() => []),
    getAllRadars().catch(() => []),
  ]);

  return (
    <TrendCyclesPage
      initialCycles={cycles ?? []}
      allTrends={trends ?? []}
      allUsers={users ?? []}
      allMetrics={metrics ?? []}
      allRadars={radars ?? []}
    />
  );
}

