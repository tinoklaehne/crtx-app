import { getAllActors, getActorlistNames } from "@/lib/airtable/actors";
import { DirectoryListPage } from "@/app/components/DirectoryListPage";

export const revalidate = 3600;

export default async function DirectoryRoute() {
  let actors: Awaited<ReturnType<typeof getAllActors>> = [];
  let actorlistNames: Awaited<ReturnType<typeof getActorlistNames>> = {};
  let loadError = false;
  try {
    [actors, actorlistNames] = await Promise.all([
      getAllActors(),
      getActorlistNames(),
    ]);
  } catch (err) {
    console.error("Failed to fetch directory data:", err);
    loadError = true;
  }

  return (
    <DirectoryListPage
      initialActors={actors ?? []}
      actorlistNames={actorlistNames}
      loadError={loadError}
    />
  );
}
