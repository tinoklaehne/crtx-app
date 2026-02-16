import { getDomainsWithMomentum, getAllDomains } from "@/lib/airtable/domains";
import { DomainsListPage } from "../components/DomainsListPage";

export const revalidate = 3600;

export default async function DomainsRoute() {
  const [domains, allDomains] = await Promise.all([
    getDomainsWithMomentum().catch((err) => {
      console.error("Failed to fetch domains with momentum:", err);
      return [];
    }),
    getAllDomains().catch(() => []),
  ]);
  const arenaNames = Object.fromEntries(
    (allDomains || []).map((d) => [d.id, d.name ?? ""])
  );

  return (
    <DomainsListPage initialDomains={domains || []} arenaNames={arenaNames} />
  );
}
