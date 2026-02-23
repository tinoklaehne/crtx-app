import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getAllReports } from "@/lib/airtable/reports";
import type { Report } from "@/app/types/reports";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ reports: [] }, { status: 401 });

    const user = await getUser(session.userId);
    if (!user || user.subscribedReportIds.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    const reportIds = user.subscribedReportIds;
    const allReports = await getAllReports();
    
    // Filter to only bookmarked reports
    const bookmarkedReports = allReports.filter((report) =>
      reportIds.includes(report.id)
    );

    // Sort by year (newest first), then by name
    bookmarkedReports.sort((a, b) => {
      const aYear = a.year ? (typeof a.year === 'number' ? a.year : parseInt(String(a.year)) || 0) : 0;
      const bYear = b.year ? (typeof b.year === 'number' ? b.year : parseInt(String(b.year)) || 0) : 0;
      if (bYear !== aYear) return bYear - aYear;
      return (a.name || "").localeCompare(b.name || "");
    });

    return NextResponse.json({ reports: bookmarkedReports });
  } catch (error) {
    console.error("Error in /api/user/my-reports GET:", error);
    // Always return 200 with empty data on error so UI doesn't break
    return NextResponse.json({ reports: [], error: true });
  }
}
