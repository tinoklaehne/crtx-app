import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ actorIds: [] }, { status: 401 });

    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ actorIds: [] }, { status: 401 });
    return NextResponse.json({ actorIds: user.subscribedActorIds });
  } catch (error) {
    console.error("Error in /api/user/subscribed-actors GET:", error);
    return NextResponse.json({ actorIds: [], error: true });
  }
}
