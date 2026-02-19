import { getAllTrends } from "@/lib/airtable/general";
import { TrendsListPage } from "@/app/components/TrendsListPage";

export const revalidate = 3600;

export default async function TrendsRoute() {
  let trends: Awaited<ReturnType<typeof getAllTrends>> = [];
  let loadError = false;
  try {
    trends = await getAllTrends();
  } catch (err) {
    console.error("Failed to fetch trends:", err);
    loadError = true;
  }
  return (
    <TrendsListPage
      initialTrends={trends ?? []}
      loadError={loadError}
    />
  );
}
