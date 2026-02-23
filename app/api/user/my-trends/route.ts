import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getAllTrends } from "@/lib/airtable/general";
import type { Trend } from "@/app/types/trends";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ trends: [] }, { status: 401 });

    const user = await getUser(session.userId);
    if (!user || user.subscribedTrendIds.length === 0) {
      return NextResponse.json({ trends: [] });
    }

    const trendIds = user.subscribedTrendIds;
    const allTrends = await getAllTrends();
    const bookmarkedTrends = allTrends.filter((t) => trendIds.includes(t.id));
    bookmarkedTrends.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({ trends: bookmarkedTrends });
  } catch (error) {
    console.error("Error in /api/user/my-trends GET:", error);
    return NextResponse.json({ trends: [], error: true });
  }
}
