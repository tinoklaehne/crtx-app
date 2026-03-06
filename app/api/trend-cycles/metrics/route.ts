import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { getTrendScoringMetrics } from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ metrics: [] }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ metrics: [] }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ metrics: [] }, { status: 403 });

    const metrics = await getTrendScoringMetrics();
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error in /api/trend-cycles/metrics GET:", error);
    return NextResponse.json({ metrics: [], error: true });
  }
}

