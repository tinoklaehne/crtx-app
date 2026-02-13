import { getClusters, getTechnologies } from "@/lib/airtable/general";
import { GeneralPage } from "./GeneralPage";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function Page() {
  let initialTechnologies: Trend[] = [];
  let initialClusters: Cluster[] = [];
  let isLoading = false;
  let error: string | null = null;

  try {
    const [clustersData, technologiesData] = await Promise.all([
      getClusters("parent", "General"),
      getTechnologies("parent", "General"),
    ]);

    if (!clustersData.length) {
      error = "No clusters found for General";
    } else {
      initialTechnologies = technologiesData;
      initialClusters = clustersData;
    }
  } catch (fetchError) {
    console.error("Error fetching data:", fetchError);
    error = "Failed to load radar data. Please check your Airtable configuration.";
  }

  return (
    <GeneralPage
      initialTechnologies={initialTechnologies}
      initialClusters={initialClusters}
      isLoading={isLoading}
      error={error}
    />
  );
}