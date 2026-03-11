import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getUser } from "@/lib/airtable/users";
import { createFeedback } from "@/lib/airtable/feedback";
import type { FeedbackType } from "@/app/types/feedback";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface FeedbackBody {
  title?: string;
  description?: string;
  type?: FeedbackType;
  area?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  stepsToReproduce?: string;
  environment?: string;
  screenshotUrl?: string;
}

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

    const body = (await request.json().catch(() => null)) as FeedbackBody | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const title = (body.title ?? "").trim();
    const description = (body.description ?? "").trim();
    const type = body.type;

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: "title, description, and type are required." },
        { status: 400 }
      );
    }

    if (type !== "Bug" && type !== "Idea") {
      return NextResponse.json(
        { error: "Invalid feedback type." },
        { status: 400 }
      );
    }

    const record = await createFeedback({
      title,
      description,
      type,
      area: body.area,
      severity: body.severity,
      stepsToReproduce: body.stepsToReproduce,
      environment: body.environment,
      screenshotUrl: body.screenshotUrl,
      userId: user.id,
    });

    return NextResponse.json({ ok: true, feedback: record });
  } catch (error: any) {
    console.error("Error in /api/feedback POST:", error);
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Failed to submit feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

