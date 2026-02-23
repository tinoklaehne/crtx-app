import { NextRequest, NextResponse } from "next/server";
import { getUser, bookmarkReport, unbookmarkReport } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
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

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ reportIds: [], error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ reportIds: [], error: "User not found" }, { status: 404 });
    }

    const reportIds = bookmark
      ? await bookmarkReport(user.id, reportId)
      : await unbookmarkReport(user.id, reportId);

    return NextResponse.json({ reportIds });
  } catch (error) {
    console.error("Error in /api/user/bookmark-report POST:", error);
    // Try to return current state on error
    try {
      const session = await getSessionFromRequest(request);
      const fallbackUser = session ? await getUser(session.userId) : null;
      const reportIds = fallbackUser?.subscribedReportIds ?? [];
      return NextResponse.json({ reportIds, error: true });
    } catch {
      return NextResponse.json({ reportIds: [], error: true });
    }
  }
}
