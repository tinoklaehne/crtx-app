import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { addTrendToCycle, getTrendCycleItems, updateTrendCycleItem } from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ items: [] }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ items: [] }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ items: [] }, { status: 403 });

    const { cycleId } = await params;
    const items = await getTrendCycleItems(cycleId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error in /api/trend-cycles/[cycleId]/items GET:", error);
    return NextResponse.json({ items: [], error: true });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { cycleId } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body.trendId !== "string" || !body.trendId) {
      return NextResponse.json({ error: "Missing trendId" }, { status: 400 });
    }
    const created = await addTrendToCycle({
      cycleId,
      trendId: body.trendId,
      stage: typeof body.stage === "string" ? body.stage : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    if (!created) return NextResponse.json({ error: "Failed to add trend" }, { status: 500 });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/trend-cycles/[cycleId]/items POST:", error);
    return NextResponse.json({ error: "Failed to add trend" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Keep params awaited so Next can cache route segment correctly.
    await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body.itemId !== "string") {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }
    const updated = await updateTrendCycleItem(body.itemId, {
      stage: typeof body.stage === "string" ? body.stage : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    if (!updated) return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Error in /api/trend-cycles/items PATCH:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

