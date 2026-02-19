import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/airtable/users";

export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ trendIds: [] });
    }
    return NextResponse.json({ trendIds: user.subscribedTrendIds });
  } catch (error) {
    console.error("Error in /api/user/subscribed-trends GET:", error);
    return NextResponse.json({ trendIds: [], error: true });
  }
}
