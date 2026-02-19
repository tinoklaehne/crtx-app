import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  bookmarkReport,
  unbookmarkReport,
} from "@/lib/airtable/users";

export const dynamic = "force-static";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reportId = body.reportId as string | undefined;
    const bookmark = Boolean(body.bookmark);

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      // Return empty array instead of error so UI doesn't break
      return NextResponse.json({ reportIds: [], error: "User not found" });
    }

    const reportIds = bookmark
      ? await bookmarkReport(user.id, reportId)
      : await unbookmarkReport(user.id, reportId);

    return NextResponse.json({ reportIds });
  } catch (error) {
    console.error("Error in /api/user/bookmark-report POST:", error);
    // Try to return current state on error
    try {
      const user = await getCurrentUser();
      const reportIds = user?.subscribedReportIds ?? [];
      return NextResponse.json({ reportIds, error: true });
    } catch {
      return NextResponse.json({ reportIds: [], error: true });
    }
  }
}
