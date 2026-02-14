import { getAllRadars, fetchAllTrendRecordsForRadars, getTrendsForRadarFromRecords } from "@/lib/airtable/radars";
import { getClusters } from "@/lib/airtable/general";
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

export default async function RadarsRoute() {
  const radars = await getAllRadars().catch((err) => {
    console.error("Failed to fetch radars:", err);
    return [];
  });

  const radarDetails: Record<string, RadarDetail> = {};
  const clusterCache = new Map<string, Cluster[]>();

  // One batched fetch for all trend IDs across all radars (much fewer Airtable calls)
  const trendRecordsMap = await fetchAllTrendRecordsForRadars(radars || []).catch(() => new Map());

  for (const radar of radars || []) {
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
    <RadarsPage
      initialRadars={radars || []}
      radarDetails={radarDetails}
    />
  );
}