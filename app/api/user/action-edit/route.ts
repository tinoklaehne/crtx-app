import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { getAllActors } from "@/lib/airtable/actors";
import { updateActionEditableFields } from "@/lib/airtable/actions";
import { fetchWithRetry, getBase, getField } from "@/lib/airtable/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const ACTIONS_TABLE = "tblA0KRyRnM763cXy";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [actors, actionRecords] = await Promise.all([
      getAllActors(),
      fetchWithRetry(() =>
        getBase()(ACTIONS_TABLE)
          .select({
            fields: ["Action Type"],
            maxRecords: 400,
            pageSize: 100,
          })
          .all()
      ),
    ]);
    const signalTypes = Array.from(
      new Set(
        actionRecords
          .map((record) => (getField<string>(record, "Action Type") ?? "").trim())
          .filter((value) => value.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      actors: actors.map((actor) => ({ id: actor.id, name: actor.name })),
      signalTypes,
    });
  } catch (error) {
    console.error("Error in /api/user/action-edit GET:", error);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const actionId = body.actionId as string | undefined;
    const signalType = body.signalType as string | undefined;
    const actorIds = body.actorIds as string[] | undefined;

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }
    if (
      signalType !== undefined &&
      (typeof signalType !== "string" || signalType.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "signalType must be a non-empty string when provided" },
        { status: 400 }
      );
    }
    if (
      actorIds !== undefined &&
      (!Array.isArray(actorIds) || actorIds.some((id) => typeof id !== "string"))
    ) {
      return NextResponse.json(
        { error: "actorIds must be an array of string ids when provided" },
        { status: 400 }
      );
    }

    const ok = await updateActionEditableFields({ actionId, signalType, actorIds });
    if (!ok) {
      return NextResponse.json({ error: "Failed to update action fields" }, { status: 500 });
    }

    return NextResponse.json({ actionId, signalType, actorIds: actorIds ?? [] });
  } catch (error) {
    console.error("Error in /api/user/action-edit POST:", error);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
