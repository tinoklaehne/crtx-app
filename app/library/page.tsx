import { getAllReports } from "@/lib/airtable/reports";
import { getAllDomains } from "@/lib/airtable/domains";
import { LibraryListPage } from "@/app/components/LibraryListPage";

export const revalidate = 3600;

export default async function LibraryRoute() {
  let reports: Awaited<ReturnType<typeof getAllReports>> = [];
  let allDomains: Awaited<ReturnType<typeof getAllDomains>> = [];
  let loadError = false;
  try {
    [reports, allDomains] = await Promise.all([
      getAllReports(),
      getAllDomains(),
    ]);
  } catch (err) {
    console.error("Failed to fetch library data:", err);
    loadError = true;
  }

  // Build domain names map for Sub-Area resolution
  const domainNames = Object.fromEntries(
    (allDomains || []).map((d) => [d.id, d.name ?? ""])
  );

  return (
    <LibraryListPage
      initialReports={reports ?? []}
      domainNames={domainNames}
      loadError={loadError}
    />
  );
}
