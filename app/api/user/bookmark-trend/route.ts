import { NextRequest, NextResponse } from "next/server";
import { getUser, bookmarkTrend, unbookmarkTrend } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const trendId = body.trendId as string | undefined;
    const bookmark = Boolean(body.bookmark);

    if (!trendId) {
      return NextResponse.json(
        { error: "trendId is required" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ trendIds: [], error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ trendIds: [], error: "User not found" }, { status: 404 });
    }

    const trendIds = bookmark
      ? await bookmarkTrend(user.id, trendId)
      : await unbookmarkTrend(user.id, trendId);

    return NextResponse.json({ trendIds });
  } catch (error) {
    console.error("Error in /api/user/bookmark-trend POST:", error);
    try {
      const session = await getSessionFromRequest(request);
      const fallbackUser = session ? await getUser(session.userId) : null;
      const trendIds = fallbackUser?.subscribedTrendIds ?? [];
      return NextResponse.json({ trendIds, error: true });
    } catch {
      return NextResponse.json({ trendIds: [], error: true });
    }
  }
}
