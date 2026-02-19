import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateUser } from "@/lib/airtable/users";

export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Fallback mock user when Airtable record is missing
      const fallbackUser = {
        id: "mock-user",
        name: "Tino Klaehne",
        email: "",
        organisation: "",
        businessUnit: "",
        domainsAccess: true,
        directoryAccess: true,
        radarsAccess: true,
        libraryAccess: true,
        subscribedDomainIds: [] as string[],
      };
      return NextResponse.json({ user: fallbackUser, isMock: true });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in /api/user/profile GET:", error);
    // Even on error, return fallback user so UI doesn't break
    const fallbackUser = {
      id: "mock-user",
      name: "Tino Klaehne",
      email: "",
      organisation: "",
      businessUnit: "",
      domainsAccess: true,
      directoryAccess: true,
      radarsAccess: true,
      libraryAccess: true,
      subscribedDomainIds: [] as string[],
    };
    return NextResponse.json({ user: fallbackUser, isMock: true, error: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await updateUser(user.id, {
      name: body.name,
      email: body.email,
      organisation: body.organisation,
      businessUnit: body.businessUnit,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Error in /api/user/profile POST:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

