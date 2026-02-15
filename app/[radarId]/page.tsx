import { RadarPage } from "./RadarPage";
import { getRadar, getAllRadars, getTrendsForRadar } from "@/lib/airtable/radars";
import { getClusters } from "@/lib/airtable/general";
import { notFound } from "next/navigation";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";
import type { Radar } from "@/app/types/radars";

export const revalidate = 3600;

// Return a single placeholder so static export (non-Vercel build) has at least one path; real radars use /radars?radar=<id>.
// On Vercel we don't use output: 'export', so [radarId] is rendered on-demand.
export async function generateStaticParams() {
  if (process.env.VERCEL) return [];
  return [{ radarId: "__placeholder__" }];
}

export default async function Page(props: any) {
  const { params, searchParams } = props as {
    params: Promise<{ radarId: string }>;
    searchParams: { [key: string]: string | string[] | undefined };
  };

  // Await params to fix Next.js 15 compatibility
  const { radarId } = await params;

  let initialRadar: Radar | null = null;
  let initialTechnologies: Trend[] = [];
  let initialClusters: Cluster[] = [];
  let allRadars: Radar[] = [];
  let isLoading: boolean = false;
  let error: string | null = null;

  try {
    if (process.env.NODE_ENV === 'development') console.log(`Attempting to fetch radar with ID: ${radarId}`);
    initialRadar = await getRadar(radarId);

    if (!initialRadar) {
      if (process.env.NODE_ENV === 'development') console.warn(`Radar not found for ID: ${radarId}`);
      return notFound();
    }

    if (process.env.NODE_ENV === 'development') console.log(`Successfully loaded radar: ${initialRadar.name}`);

    const clusterType = initialRadar.cluster.toLowerCase() as
      | "parent"
      | "taxonomy"
      | "domain";
    const universe = initialRadar.type === "Travel" ? "Travel" : "General";

    if (process.env.NODE_ENV === 'development') console.log(`Fetching clusters and trends (REL_Trends) for radar ${initialRadar.name}`);

    const [clustersData, technologiesData, radarsList] = await Promise.all([
      getClusters(clusterType, universe),
      getTrendsForRadar(initialRadar),
      getAllRadars().catch(() => []),
    ]);
    allRadars = radarsList.filter((r) => (r.radarType || "").trim() === "Standalone");

    if (process.env.NODE_ENV === 'development') console.log(`Found ${clustersData.length} clusters and ${technologiesData.length} trends for this radar`);

    if (!clustersData.length) {
      error = "No clusters found";
    } else {
      const activeClusters = clustersData.filter((cluster) =>
        technologiesData.some((tech) => tech.clusterId === cluster.id)
      );

      initialClusters = activeClusters;
      initialTechnologies = technologiesData;

      if (process.env.NODE_ENV === 'development') console.log(`Final result: ${initialClusters.length} clusters and ${initialTechnologies.length} technologies`);
    }
  } catch (fetchError) {
    console.error("Error loading radar:", fetchError);
    if (
      fetchError instanceof Error &&
      fetchError.message.includes("NOT_FOUND")
    ) {
      return notFound();
    }
    error = "Failed to load radar data. Please try again later.";
  }

  if (!initialRadar) {
    return notFound();
  }

  return (
    <RadarPage
      radarId={radarId}
      initialRadar={initialRadar}
      initialRadars={allRadars}
      initialTechnologies={initialTechnologies}
      initialClusters={initialClusters}
      isLoading={isLoading}
      error={error}
    />
  );
}