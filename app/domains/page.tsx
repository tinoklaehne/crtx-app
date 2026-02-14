import { getDomainsWithMomentum } from "@/lib/airtable/domains";
import { DomainsListPage } from "../components/DomainsListPage";

export const revalidate = 3600;

export default async function DomainsRoute() {
  const domains = await getDomainsWithMomentum().catch(err => {
    console.error("Failed to fetch domains with momentum:", err);
    return [];
  });

  return <DomainsListPage initialDomains={domains || []} />;
}
