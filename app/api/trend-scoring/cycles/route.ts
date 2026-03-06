import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { getAllTrendCycles } from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ cycles: [] }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ cycles: [] }, { status: 401 });
    if (!user.trendScoringAccess) return NextResponse.json({ cycles: [] }, { status: 403 });

    const cycles = await getAllTrendCycles();
    // Show all non-archived cycles where this user is on the expert panel.
    // Prefer Scoring/Open first, then Draft, then Closed.
    const invited = cycles
      .filter((c) => c.expertUserIds.includes(user.id) && c.status !== "Archived")
      .sort((a, b) => {
        const order = (status: string) => {
          switch (status) {
            case "Scoring":
              return 0;
            case "Open":
              return 1;
            case "Draft":
              return 2;
            case "Closed":
              return 3;
            default:
              return 4;
          }
        };
        return order(a.status) - order(b.status);
      });
    return NextResponse.json({ cycles: invited });
  } catch (error) {
    console.error("Error in /api/trend-scoring/cycles GET:", error);
    return NextResponse.json({ cycles: [], error: true });
  }
}

