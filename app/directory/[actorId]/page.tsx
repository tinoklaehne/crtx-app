import { getActor, getAllActors, getActorlistNames } from "@/lib/airtable/actors";
import { Navbar } from "@/app/components/layout/Navbar";
import { ActorsSidepanel } from "@/app/components/directory/ActorsSidepanel";
import { ActorDetailPage } from "@/app/components/ActorDetailPage";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  if (process.env.VERCEL) return [];
  try {
    const actors = await getAllActors();
    return actors.map((actor) => ({ actorId: actor.id }));
  } catch (error) {
    console.error("Error generating static params for directory:", error);
    return [];
  }
}

export default async function ActorDetailRoute({
  params,
}: {
  params: Promise<{ actorId: string }>;
}) {
  const { actorId } = await params;

  const [actor, allActors, actorlistNames] = await Promise.all([
    getActor(actorId).catch(() => null),
    getAllActors().catch(() => []),
    getActorlistNames().catch(() => ({})),
  ]);

  if (!actor) notFound();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      <ActorsSidepanel actors={allActors} actorlistNames={actorlistNames} currentActorId={actorId} />
      <ActorDetailPage actor={actor} />
    </div>
  );
}
