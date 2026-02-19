import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/airtable/users";
import { getAllTrends } from "@/lib/airtable/general";
import type { Trend } from "@/app/types/trends";

export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
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
