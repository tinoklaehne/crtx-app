import { RadarPage } from "./RadarPage";
import { getRadarIds, getRadar } from "@/lib/airtable/radars";
import { getClusters, getTechnologies } from "@/lib/airtable/general";
import { notFound } from "next/navigation";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";
import type { Radar } from "@/app/types/radars";

// Use dynamic rendering to avoid build-time data fetching issues
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const radarIds = await getRadarIds();
    
    if (radarIds.length > 0) {
      console.log(`Generated static params for ${radarIds.length} radars`);
      return radarIds.map((id) => ({ radarId: id }));
    }
    
    console.warn("No radar IDs found from Airtable API");
    return [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
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
  let isLoading: boolean = false;
  let error: string | null = null;

  try {
    console.log(`Attempting to fetch radar with ID: ${radarId}`);
    initialRadar = await getRadar(radarId);

    if (!initialRadar) {
      console.warn(`Radar not found for ID: ${radarId}`);
      return notFound();
    }

    console.log(`Successfully loaded radar: ${initialRadar.name}`);

    const clusterType = initialRadar.cluster.toLowerCase() as
      | "parent"
      | "taxonomy"
      | "domain";
    const universe = initialRadar.type === "Travel" ? "Travel" : "General";

    console.log(`Fetching clusters and technologies for ${clusterType} cluster in ${universe} universe`);

    const [clustersData, technologiesData] = await Promise.all([
      getClusters(clusterType, universe),
      getTechnologies(clusterType, universe),
    ]);

    console.log(`Found ${clustersData.length} clusters and ${technologiesData.length} technologies`);

    if (!clustersData.length) {
      error = "No clusters found";
    } else {
      const filteredTechnologies = technologiesData.filter((tech) =>
        initialRadar!.trends.includes(tech.id)
      );

      console.log(`Filtered to ${filteredTechnologies.length} technologies for this radar`);

      const activeClusters = clustersData.filter((cluster) =>
        filteredTechnologies.some((tech) => tech.clusterId === cluster.id)
      );

      initialClusters = activeClusters;
      initialTechnologies = filteredTechnologies;

      console.log(`Final result: ${initialClusters.length} clusters and ${initialTechnologies.length} technologies`);
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
      initialTechnologies={initialTechnologies}
      initialClusters={initialClusters}
      isLoading={isLoading}
      error={error}
    />
  );
}