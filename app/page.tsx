import { getAllRadars } from "@/lib/airtable/radars";
import { getClusters, getTechnologies } from "@/lib/airtable/general";
import { RadarsPage } from "./RadarsPage";

export const revalidate = 3600;

export default async function Page() {
  // Fetch data on the server side
  const [radars, clusters, trends] = await Promise.all([
    getAllRadars().catch(err => {
      console.error("Failed to fetch radars:", err);
      return [];
    }),
    getClusters().catch(err => {
      console.error("Failed to fetch clusters:", err);
      return [];
    }),
    getTechnologies().catch(err => {
      console.error("Failed to fetch technologies:", err);
      return [];
    })
  ]);

  return (
    <RadarsPage 
      initialRadars={radars || []}
      initialClusters={clusters || []}
      initialTrends={trends || []}
    />
  );
}