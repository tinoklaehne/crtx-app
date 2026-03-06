import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import {
  getAssessmentsForExpert,
  getTrendCycle,
  getTrendCycleItems,
  getTrendScoringMetrics,
} from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!user.trendScoringAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { cycleId } = await params;
    const cycle = await getTrendCycle(cycleId);
    if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    if (!cycle.expertUserIds.includes(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [items, metrics, assessments] = await Promise.all([
      getTrendCycleItems(cycleId),
      getTrendScoringMetrics(),
      getAssessmentsForExpert(cycleId, user.id),
    ]);

    return NextResponse.json({ cycle, items, metrics, assessments });
  } catch (error) {
    console.error("Error in /api/trend-scoring/cycles/[cycleId] GET:", error);
    return NextResponse.json({ error: "Failed to load cycle" }, { status: 500 });
  }
}

