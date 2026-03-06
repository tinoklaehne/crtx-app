import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { getTrendCycle, updateTrendCycle } from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ cycle: null }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ cycle: null }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ cycle: null }, { status: 403 });

    const { cycleId } = await params;
    const cycle = await getTrendCycle(cycleId);
    return NextResponse.json({ cycle });
  } catch (error) {
    console.error("Error in /api/trend-cycles/[cycleId] GET:", error);
    return NextResponse.json({ cycle: null, error: true });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { cycleId } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const updated = await updateTrendCycle(cycleId, {
      name: typeof body.name === "string" ? body.name : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      expertUserIds: Array.isArray(body.expertUserIds) ? body.expertUserIds.filter(Boolean) : undefined,
      metricIds: Array.isArray(body.metricIds) ? body.metricIds.filter(Boolean) : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      endDate: typeof body.endDate === "string" ? body.endDate : undefined,
      radarIds: Array.isArray(body.radarIds) ? body.radarIds.filter(Boolean) : undefined,
    });
    if (!updated) return NextResponse.json({ error: "Failed to update cycle" }, { status: 500 });
    return NextResponse.json({ cycle: updated });
  } catch (error) {
    console.error("Error in /api/trend-cycles/[cycleId] PATCH:", error);
    return NextResponse.json({ error: "Failed to update cycle" }, { status: 500 });
  }
}

