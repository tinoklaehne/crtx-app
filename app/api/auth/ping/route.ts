import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser, updateLastLogin } from "@/lib/airtable/users";

export const dynamic = "force-dynamic";

// Update Last Login based on an existing session.
// Throttled to once per 24h per user to avoid excessive Airtable writes.
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = Date.now();
    let shouldUpdate = true;

    if (user.lastLogin) {
      const last = Date.parse(user.lastLogin);
      if (!Number.isNaN(last)) {
        const diffMs = now - last;
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (diffMs < oneDayMs) {
          shouldUpdate = false;
        }
      }
    }

    if (shouldUpdate) {
      await updateLastLogin(user.id);
    }

    return NextResponse.json({
      ok: true,
      updated: shouldUpdate,
      lastLogin: shouldUpdate ? new Date(now).toISOString() : user.lastLogin ?? null,
    });
  } catch (error) {
    console.error("Error in /api/auth/ping POST:", error);
    return NextResponse.json(
      { error: "Failed to update last login" },
      { status: 500 }
    );
  }
}

