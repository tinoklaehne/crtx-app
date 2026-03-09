import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/airtable/users";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  isAllowedActionStatus,
  updateActionStatus,
} from "@/lib/airtable/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const actionId = body.actionId as string | undefined;
    const status = body.status as string | undefined;

    if (!actionId) {
      return NextResponse.json(
        { error: "actionId is required" },
        { status: 400 }
      );
    }
    if (!status || !isAllowedActionStatus(status)) {
      return NextResponse.json(
        { error: "status must be one of Auto, Checked, Noise, Delete" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedStatus = await updateActionStatus(actionId, status);
    if (!updatedStatus) {
      return NextResponse.json({ error: "Failed to update action status" }, { status: 500 });
    }

    return NextResponse.json({ actionId, status: updatedStatus });
  } catch (error) {
    console.error("Error in /api/user/action-status POST:", error);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
