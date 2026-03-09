import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getAllActors } from "@/lib/airtable/actors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ actors: [] }, { status: 401 });

    const user = await getUser(session.userId);
    if (!user || user.subscribedActorIds.length === 0) {
      return NextResponse.json({ actors: [] });
    }

    const actorIds = user.subscribedActorIds;
    const allActors = await getAllActors();
    const subscribedActors = allActors.filter((actor) => actorIds.includes(actor.id));
    subscribedActors.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({ actors: subscribedActors });
  } catch (error) {
    console.error("Error in /api/user/my-actors GET:", error);
    return NextResponse.json({ actors: [], error: true });
  }
}
