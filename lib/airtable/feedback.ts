import { getBase, fetchWithRetry } from "./utils";
import type { FeedbackInput, FeedbackRecord, FeedbackType } from "@/app/types/feedback";

const FEEDBACK_TABLE_ID = "tbl6QDXkZUwFX3VBS";

type AirtableFeedbackFields = {
  Title: string;
  Description: string;
  Type: FeedbackType;
  Status?: string;
  Severity?: string;
  Area?: string;
  StepsToReproduce?: string;
  Environment?: string;
  Screenshot?: { url: string }[];
  User?: string[];
  "Submitted At"?: string;
};

export async function createFeedback(
  input: FeedbackInput & { userId: string }
): Promise<FeedbackRecord> {
  const base = getBase();
  const table = base(FEEDBACK_TABLE_ID) as {
    create: (
      records: { fields: AirtableFeedbackFields }[]
    ) => Promise<any>;
  };

  const fields: AirtableFeedbackFields = {
    Title: input.title.trim(),
    Description: input.description.trim(),
    Type: input.type,
    Status: "New",
  };

  if (input.area?.trim()) {
    fields.Area = input.area.trim();
  }
  if (input.severity) {
    fields.Severity = input.severity;
  }
  if (input.stepsToReproduce?.trim()) {
    fields.StepsToReproduce = input.stepsToReproduce.trim();
  }
  if (input.environment?.trim()) {
    fields.Environment = input.environment.trim();
  }
  if (input.screenshotUrl?.trim()) {
    fields.Screenshot = [{ url: input.screenshotUrl.trim() }];
  }
  if (input.userId) {
    fields.User = [input.userId];
  }
  fields["Submitted At"] = new Date().toISOString();

  let result: any;
  try {
    result = await fetchWithRetry(() =>
      table.create([
        {
          fields,
        },
      ])
    );
  } catch (error: any) {
    const message: string =
      (typeof error?.message === "string" && error.message) || "";

    // If Airtable rejects some select options (e.g. Severity/Area not configured),
    // retry with a minimal, safe field set.
    if (message.includes("INVALID_MULTIPLE_CHOICE_OPTIONS")) {
      const fallbackFields: AirtableFeedbackFields = {
        Title: fields.Title,
        Description: fields.Description,
        Type: fields.Type,
        Status: fields.Status,
        Environment: fields.Environment,
        StepsToReproduce: fields.StepsToReproduce,
        Screenshot: fields.Screenshot,
        User: fields.User,
        "Submitted At": fields["Submitted At"],
      };

      result = await fetchWithRetry(() =>
        table.create([
          {
            fields: fallbackFields,
          },
        ])
      );
    } else {
      throw error;
    }
  }

  const record = Array.isArray(result) ? result[0] : result;
  const id: string = record?.id;

  const { userId, ...rest } = input;

  return {
    id,
    userId,
    submittedAt: fields["Submitted At"]!,
    status: "New",
    ...rest,
  };
}

