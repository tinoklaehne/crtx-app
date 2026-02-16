import { getAllActors, getActorlistNames, getActorsDomains } from "@/lib/airtable/actors";
import { getAllDomains } from "@/lib/airtable/domains";
import { DirectoryListPage } from "@/app/components/DirectoryListPage";

export const revalidate = 3600;

export default async function DirectoryRoute() {
  let actors: Awaited<ReturnType<typeof getAllActors>> = [];
  let actorlistNames: Awaited<ReturnType<typeof getActorlistNames>> = {};
  let domainNames: Record<string, string> = {};
  let actorsDomains: Record<string, string[]> = {};
  let loadError = false;
  try {
    const [actorsData, actorlistNamesData, allDomains] = await Promise.all([
      getAllActors(),
      getActorlistNames(),
      getAllDomains().catch(() => []),
    ]);
    actors = actorsData;
    actorlistNames = actorlistNamesData;
    // Build domain names map
    domainNames = Object.fromEntries(
      (allDomains || []).map((d) => [d.id, d.name ?? ""])
    );
    // Fetch domains for all actors
    if (actors.length > 0) {
      actorsDomains = await getActorsDomains(actors.map(a => a.id)).catch(() => ({}));
    }
  } catch (err) {
    console.error("Failed to fetch directory data:", err);
    loadError = true;
  }

  return (
    <DirectoryListPage
      initialActors={actors ?? []}
      actorlistNames={actorlistNames}
      domainNames={domainNames}
      actorsDomains={actorsDomains}
      loadError={loadError}
    />
  );
}
