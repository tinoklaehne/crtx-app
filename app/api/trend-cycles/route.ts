import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import {
  createTrendCycle,
  getAllTrendCycles,
} from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ cycles: [] }, { status: 401 });

    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ cycles: [] }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ cycles: [] }, { status: 403 });

    const cycles = await getAllTrendCycles();
    return NextResponse.json({ cycles });
  } catch (error) {
    console.error("Error in /api/trend-cycles GET:", error);
    return NextResponse.json({ cycles: [], error: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    const created = await createTrendCycle({
      name: body.name.trim(),
      code: typeof body.code === "string" ? body.code.trim() : undefined,
      ownerUserId: user.id,
      expertUserIds: Array.isArray(body.expertUserIds) ? body.expertUserIds.filter(Boolean) : [],
      metricIds: Array.isArray(body.metricIds) ? body.metricIds.filter(Boolean) : [],
      description: typeof body.description === "string" ? body.description : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      endDate: typeof body.endDate === "string" ? body.endDate : undefined,
    });
    if (!created) return NextResponse.json({ error: "Failed to create cycle" }, { status: 500 });

    return NextResponse.json({ cycle: created }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/trend-cycles POST:", error);
    return NextResponse.json({ error: "Failed to create cycle" }, { status: 500 });
  }
}

