import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { upsertTrendAssessments } from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!user.trendScoringAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.cycleId !== "string" ||
      typeof body.trendId !== "string" ||
      !Array.isArray(body.metricScores)
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await upsertTrendAssessments({
      cycleId: body.cycleId,
      cycleItemId: typeof body.cycleItemId === "string" ? body.cycleItemId : undefined,
      trendId: body.trendId,
      expertUserId: user.id,
      metricScores: body.metricScores
        .filter((m: any) => m && typeof m.metricId === "string")
        .map((m: any) => ({
          metricId: m.metricId,
          score: typeof m.score === "number" ? m.score : undefined,
          comment: typeof m.comment === "string" ? m.comment : undefined,
        })),
      status: typeof body.status === "string" ? body.status : "Submitted",
    });

    if (!result.ok) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/trend-scoring/assessments POST:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

