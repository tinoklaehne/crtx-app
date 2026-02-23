import { NextRequest, NextResponse } from "next/server";
import { getUser, subscribeToDomain, unsubscribeFromDomain } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const domainId = body.domainId as string | undefined;
    const subscribe = Boolean(body.subscribe);

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ domainIds: [], error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ domainIds: [], error: "User not found" }, { status: 404 });
    }

    const domainIds = subscribe
      ? await subscribeToDomain(user.id, domainId)
      : await unsubscribeFromDomain(user.id, domainId);

    return NextResponse.json({ domainIds });
  } catch (error) {
    console.error("Error in /api/user/subscribe POST:", error);
    // Try to return current state on error
    try {
      const session = await getSessionFromRequest(request);
      const fallbackUser = session ? await getUser(session.userId) : null;
      const domainIds = fallbackUser?.subscribedDomainIds ?? [];
      return NextResponse.json({ domainIds, error: true });
    } catch {
      return NextResponse.json({ domainIds: [], error: true });
    }
  }
}

