import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/airtable/users";

export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ domainIds: [] });
    }
    return NextResponse.json({ domainIds: user.subscribedDomainIds });
  } catch (error) {
    console.error("Error in /api/user/subscribed-domains GET:", error);
    // Always return 200 with empty array on error so UI doesn't break
    return NextResponse.json({ domainIds: [], error: true });
  }
}

