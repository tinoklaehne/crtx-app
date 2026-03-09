import { Suspense } from "react";
import { getAllRadars, fetchAllTrendRecordsForRadars, getTrendsForRadarFromRecords } from "@/lib/airtable/radars";
import { getAllTrends, getClusters } from "@/lib/airtable/general";
import { RadarsPage } from "../RadarsPage";
import type { Radar } from "@/app/types/radars";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";

export const revalidate = 3600;

// Preload radar details at build time so the client can show any radar from ?radar= without using searchParams (which breaks static export).
export type RadarDetail = {
  radar: Radar;
  clusters: Cluster[];
  technologies: Trend[];
};

export type RadarTrendOption = {
  id: string;
  name: string;
  scale: "Macro" | "Micro";
  meta?: string;
};

const STANDALONE_TREND_TYPE = "Standalone";

export default async function RadarsRoute() {
  const [allRadars, macroTrends, microTrends] = await Promise.all([
    getAllRadars().catch((err) => {
      console.error("Failed to fetch radars:", err);
      return [];
    }),
    getClusters("parent").catch((err) => {
      console.error("Failed to fetch macro trends:", err);
      return [];
    }),
    getAllTrends().catch((err) => {
      console.error("Failed to fetch micro trends:", err);
      return [];
    }),
  ]);
  const radars = (allRadars || []).filter(
    (r) => (r.radarType || "").trim() === STANDALONE_TREND_TYPE
  );

  const trendOptions: RadarTrendOption[] = [
    ...macroTrends.map((cluster) => ({
      id: cluster.id,
      name: cluster.name,
      scale: "Macro" as const,
      meta: cluster.domain,
    })),
    ...microTrends.map((trend) => ({
      id: trend.id,
      name: trend.name,
      scale: "Micro" as const,
      meta: trend.domain,
    })),
  ];

  const radarDetails: Record<string, RadarDetail> = {};
  const clusterCache = new Map<string, Cluster[]>();
  const trendRecordsMap = await fetchAllTrendRecordsForRadars(radars).catch(() => new Map());
  for (const radar of radars) {
    try {
      const clusterType = radar.cluster.toLowerCase() as "parent" | "taxonomy" | "domain";
      const universe = radar.type === "Travel" ? "Travel" : "General";
      const cacheKey = `${clusterType}:${universe}`;
      let clustersData = clusterCache.get(cacheKey);
      if (!clustersData) {
        clustersData = await getClusters(clusterType, universe);
        clusterCache.set(cacheKey, clustersData);
      }
      const technologies = getTrendsForRadarFromRecords(radar, trendRecordsMap);
      const filteredClusters = clustersData.filter((cluster) =>
        technologies.some((tech) => tech.clusterId === cluster.id)
      );
      radarDetails[radar.id] = {
        radar,
        clusters: filteredClusters,
        technologies,
      };
    } catch (e) {
      console.error(`Error preloading radar ${radar.id}:`, e);
    }
  }

  return (
    <Suspense fallback={<RadarsPageFallback />}>
      <RadarsPage
        initialRadars={radars}
        radarDetails={radarDetails}
        trendOptions={trendOptions}
      />
    </Suspense>
  );
}

function RadarsPageFallback() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <div className="max-w-md text-center text-muted-foreground">
          <p className="text-lg">Loading radars...</p>
        </div>
      </div>
    </div>
  );
}