import { NextRequest, NextResponse } from "next/server";
import {
  getUser,
  subscribeToActor,
  unsubscribeFromActor,
} from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const actorId = body.actorId as string | undefined;
    const subscribe = Boolean(body.subscribe);

    if (!actorId) {
      return NextResponse.json({ error: "actorId is required" }, { status: 400 });
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { actorIds: [], error: "User not authenticated" },
        { status: 401 }
      );
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json(
        { actorIds: [], error: "User not found" },
        { status: 404 }
      );
    }

    const actorIds = subscribe
      ? await subscribeToActor(user.id, actorId)
      : await unsubscribeFromActor(user.id, actorId);

    return NextResponse.json({ actorIds });
  } catch (error) {
    console.error("Error in /api/user/subscribe-actor POST:", error);
    try {
      const session = await getSessionFromRequest(request);
      const fallbackUser = session ? await getUser(session.userId) : null;
      const actorIds = fallbackUser?.subscribedActorIds ?? [];
      return NextResponse.json({ actorIds, error: true });
    } catch {
      return NextResponse.json({ actorIds: [], error: true });
    }
  }
}
