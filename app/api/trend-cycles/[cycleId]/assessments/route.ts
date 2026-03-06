import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { getAssessmentsForCycle } from "@/lib/airtable/trendCycles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ assessments: [] }, { status: 401 });
    const user = await getUser(session.userId);
    if (!user) return NextResponse.json({ assessments: [] }, { status: 401 });
    if (!user.trendCyclesAccess) return NextResponse.json({ assessments: [] }, { status: 403 });

    const { cycleId } = await params;
    const assessments = await getAssessmentsForCycle(cycleId);
    return NextResponse.json({ assessments });
  } catch (error) {
    console.error("Error in /api/trend-cycles/[cycleId]/assessments GET:", error);
    return NextResponse.json({ assessments: [], error: true });
  }
}

