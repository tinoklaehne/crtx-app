import { getAllActors } from "@/lib/airtable/actors";
import { DirectoryListPage } from "@/app/components/DirectoryListPage";

export const revalidate = 3600;

export default async function DirectoryRoute() {
  let actors: Awaited<ReturnType<typeof getAllActors>> = [];
  let loadError = false;
  try {
    actors = await getAllActors();
  } catch (err) {
    console.error("Failed to fetch actors:", err);
    loadError = true;
  }

  return (
    <DirectoryListPage
      initialActors={actors ?? []}
      loadError={loadError}
    />
  );
}
