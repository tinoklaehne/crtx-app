import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { createRadar } from "@/lib/airtable/radars";

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
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description : undefined;
    const trendIds = Array.isArray(body?.trendIds)
      ? body.trendIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.trim().length > 0
        )
      : [];

    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }
    if (trendIds.length === 0) {
      return NextResponse.json(
        { error: "At least one trend must be selected" },
        { status: 400 }
      );
    }

    const radar = await createRadar({
      name,
      description,
      trendIds,
      ownerIds: [user.id],
    });
    if (!radar) {
      return NextResponse.json(
        { error: "Failed to create radar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ radar }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/radars/create POST:", error);
    return NextResponse.json(
      { error: "Failed to create radar" },
      { status: 500 }
    );
  }
}
