import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  bookmarkTrend,
  unbookmarkTrend,
} from "@/lib/airtable/users";

export const dynamic = "force-static";
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

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ trendIds: [], error: "User not found" });
    }

    const trendIds = bookmark
      ? await bookmarkTrend(user.id, trendId)
      : await unbookmarkTrend(user.id, trendId);

    return NextResponse.json({ trendIds });
  } catch (error) {
    console.error("Error in /api/user/bookmark-trend POST:", error);
    try {
      const user = await getCurrentUser();
      const trendIds = user?.subscribedTrendIds ?? [];
      return NextResponse.json({ trendIds, error: true });
    } catch {
      return NextResponse.json({ trendIds: [], error: true });
    }
  }
}
