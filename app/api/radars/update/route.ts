import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { updateRadar } from "@/lib/airtable/radars";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const radarId = typeof body?.radarId === "string" ? body.radarId.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description : undefined;
    const trendIds = Array.isArray(body?.trendIds)
      ? body.trendIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.trim().length > 0
        )
      : [];
    const rawStatus =
      typeof body?.status === "string" ? body.status.trim() : "";
    const status =
      rawStatus && ["draft", "published"].includes(rawStatus.toLowerCase())
        ? rawStatus[0].toUpperCase() + rawStatus.slice(1).toLowerCase()
        : undefined;
    const ownerIds = Array.isArray(body?.ownerIds)
      ? body.ownerIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.trim().length > 0
        )
      : undefined;

    if (!radarId) {
      return NextResponse.json({ error: "Missing radarId" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    if (trendIds.length === 0) {
      return NextResponse.json(
        { error: "At least one trend must be selected" },
        { status: 400 }
      );
    }

    const radar = await updateRadar({
      radarId,
      name,
      description,
      trendIds,
      status,
      ownerIds,
    });
    if (!radar) {
      return NextResponse.json(
        { error: "Failed to update radar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ radar }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/radars/update POST:", error);
    return NextResponse.json(
      { error: "Failed to update radar" },
      { status: 500 }
    );
  }
}
