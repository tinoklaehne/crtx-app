import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateLastLogin } from "@/lib/airtable/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

const SHARED_PASSWORD = process.env.LOGIN_PASSWORD || "crtx";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== SHARED_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await updateLastLogin(user.id);
    const token = await createSessionToken({ userId: user.id });
    const res = NextResponse.json({ user });
    setSessionCookie(res, token);
    return res;
  } catch (error) {
    console.error("Error in /api/auth/login POST:", error);
    return NextResponse.json(
      { error: "Failed to log in" },
      { status: 500 }
    );
  }
}

