import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  subscribeToDomain,
  unsubscribeFromDomain,
} from "@/lib/airtable/users";

export const dynamic = "force-static";
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

    const user = await getCurrentUser();
    if (!user) {
      // Return empty array instead of error so UI doesn't break
      return NextResponse.json({ domainIds: [], error: "User not found" });
    }

    const domainIds = subscribe
      ? await subscribeToDomain(user.id, domainId)
      : await unsubscribeFromDomain(user.id, domainId);

    return NextResponse.json({ domainIds });
  } catch (error) {
    console.error("Error in /api/user/subscribe POST:", error);
    // Try to return current state on error
    try {
      const user = await getCurrentUser();
      const domainIds = user?.subscribedDomainIds ?? [];
      return NextResponse.json({ domainIds, error: true });
    } catch {
      return NextResponse.json({ domainIds: [], error: true });
    }
  }
}

