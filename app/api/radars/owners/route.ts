import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getAllUsers } from "@/lib/airtable/users";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    const session = await getSessionFromRequest(_request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const users = await getAllUsers();
    const owners = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));

    return NextResponse.json({ owners }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/radars/owners GET:", error);
    return NextResponse.json(
      { error: "Failed to load owners" },
      { status: 500 }
    );
  }
}

