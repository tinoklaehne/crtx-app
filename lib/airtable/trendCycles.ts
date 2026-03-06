// Removed 'use server' directive for static export compatibility

import { unstable_cache } from "next/cache";
import { getBase, getField, fetchWithRetry } from "./utils";
import type {
  TrendAssessment,
  TrendCycle,
  TrendCycleItem,
  TrendCycleItemStage,
  TrendCycleStatus,
  TrendScoringMetric,
} from "@/app/types/trendCycles";

// Table IDs (Airtable table IDs, not names).
// Prefer env vars so this can be configured per base without code changes.
const TREND_CYCLES_TABLE =
  process.env.AIRTABLE_TREND_CYCLES_TABLE ?? "tblTrendCycles";
const TREND_SCORING_METRICS_TABLE =
  process.env.AIRTABLE_TREND_SCORING_METRICS_TABLE ?? "tblTrendScoringMetrics";
const TREND_CYCLE_ITEMS_TABLE =
  process.env.AIRTABLE_TREND_CYCLE_ITEMS_TABLE ?? "tblTrendCycleItems";
const TREND_ASSESSMENTS_TABLE =
  process.env.AIRTABLE_TREND_ASSESSMENTS_TABLE ?? "tblTrendAssessments";

function asIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function safeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function mapRecordToTrendCycle(record: any): TrendCycle {
  const experts = (getField<string[]>(record, "Experts") ??
    getField<string[]>(record, "Participants / Experts") ??
    []) as string[];
  const metrics = (getField<string[]>(record, "Metrics") ??
    getField<string[]>(record, "Allowed Metrics") ??
    []) as string[];
  const radars = (getField<string[]>(record, "Radars") ??
    getField<string[]>(record, "Radars Using Results") ??
    []) as string[];

  return {
    id: record.id,
    name: (getField<string>(record, "Name") ?? "") as string,
    code: safeString(getField(record, "Code") ?? getField(record, "Slug") ?? undefined),
    ownerUserId: (getField<string[]>(record, "Owner")?.[0] ??
      getField<string>(record, "Owner") ??
      undefined) as string | undefined,
    expertUserIds: (experts ?? []).filter(Boolean),
    status: ((getField<string>(record, "Status") ?? "Draft") as TrendCycleStatus) ?? "Draft",
    startDate: asIso(getField(record, "Start Date") ?? undefined),
    endDate: asIso(getField(record, "End Date") ?? undefined),
    description: safeString(getField(record, "Description") ?? undefined),
    metricIds: (metrics ?? []).filter(Boolean),
    radarIds: (radars ?? []).filter(Boolean),
    createdAt: asIso(getField(record, "Created") ?? undefined),
    updatedAt: asIso(getField(record, "Last Modified") ?? getField(record, "Updated") ?? undefined),
  };
}

function mapRecordToMetric(record: any): TrendScoringMetric {
  return {
    id: record.id,
    name: (getField<string>(record, "Name") ?? "") as string,
    code: safeString(getField(record, "Code") ?? undefined),
    description: safeString(getField(record, "Description") ?? undefined),
    scaleType: safeString(getField(record, "Scale Type") ?? undefined),
    minValue: safeNumber(getField(record, "Min Value") ?? undefined),
    maxValue: safeNumber(getField(record, "Max Value") ?? undefined),
    step: safeNumber(getField(record, "Step") ?? undefined),
    isDefault: Boolean(getField<boolean>(record, "Is Default")),
  };
}

function mapRecordToCycleItem(record: any): TrendCycleItem {
  const cycleId = (getField<string[]>(record, "Cycle") ?? [])[0] as string | undefined;
  const trendId = (getField<string[]>(record, "Trend") ?? [])[0] as string | undefined;
  return {
    id: record.id,
    cycleId: cycleId ?? "",
    trendId: trendId ?? "",
    stage: ((getField<string>(record, "Stage") ?? "Long List") as TrendCycleItemStage) ?? "Long List",
    notes: safeString(getField(record, "Notes") ?? undefined),
    createdAt: asIso(getField(record, "Created") ?? undefined),
    updatedAt: asIso(getField(record, "Last Modified") ?? getField(record, "Updated") ?? undefined),
  };
}

function mapRecordToAssessment(record: any): TrendAssessment {
  const cycleId = (getField<string[]>(record, "Cycle") ?? [])[0] as string | undefined;
  const itemId =
    (getField<string[]>(record, "Trend Cycle Item") ?? getField<string[]>(record, "Cycle Item") ?? [])[0] as
      | string
      | undefined;
  const trendId = (getField<string[]>(record, "Trend") ?? [])[0] as string | undefined;
  const expertId = (getField<string[]>(record, "Expert") ?? getField<string[]>(record, "User") ?? [])[0] as
    | string
    | undefined;
  const metricId = (getField<string[]>(record, "Metric") ?? [])[0] as string | undefined;

  return {
    id: record.id,
    cycleId: cycleId ?? "",
    cycleItemId: itemId ?? undefined,
    trendId: trendId ?? "",
    expertUserId: expertId ?? "",
    metricId: metricId ?? "",
    score: safeNumber(getField(record, "Score") ?? undefined),
    comment: safeString(getField(record, "Comment") ?? undefined),
    status: (safeString(getField(record, "Status") ?? undefined) as TrendAssessment["status"]) ?? undefined,
    submittedAt: asIso(
      getField(record, "Submitted At") ??
        // Allow alternate naming some bases might use
        getField(record, "Date_Submitted") ??
        undefined
    ),
    createdAt: asIso(getField(record, "Created") ?? undefined),
    updatedAt: asIso(getField(record, "Last Modified") ?? getField(record, "Updated") ?? undefined),
  };
}

export async function getAllTrendCycles(): Promise<TrendCycle[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() =>
      base(TREND_CYCLES_TABLE)
        .select({ sort: [{ field: "Name", direction: "asc" }], maxRecords: 200 })
        .all()
    );
    return records.map(mapRecordToTrendCycle);
  } catch (error) {
    console.error("Error fetching trend cycles:", error);
    return [];
  }
}

export async function getTrendCycle(id: string): Promise<TrendCycle | null> {
  try {
    const base = getBase();
    const record = await fetchWithRetry(() => base(TREND_CYCLES_TABLE).find(id));
    if (!record) return null;
    return mapRecordToTrendCycle(record);
  } catch (error) {
    console.error("Error fetching trend cycle:", error);
    return null;
  }
}

export async function getTrendCycleItems(cycleId: string): Promise<TrendCycleItem[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() =>
      base(TREND_CYCLE_ITEMS_TABLE)
        .select({ maxRecords: 1000 })
        .all()
    );
    return records
      .map(mapRecordToCycleItem)
      .filter((it) => it.cycleId === cycleId && it.trendId);
  } catch (error) {
    console.error("Error fetching trend cycle items:", error);
    return [];
  }
}

export async function getTrendScoringMetrics(): Promise<TrendScoringMetric[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() =>
      base(TREND_SCORING_METRICS_TABLE)
        .select({ sort: [{ field: "Name", direction: "asc" }], maxRecords: 200 })
        .all()
    );
    return records.map(mapRecordToMetric);
  } catch (error) {
    console.error("Error fetching trend scoring metrics:", error);
    return [];
  }
}

export async function getAssessmentsForExpert(cycleId: string, expertUserId: string): Promise<TrendAssessment[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() =>
      base(TREND_ASSESSMENTS_TABLE)
        .select({
          // Fetch a reasonable upper bound and filter in code,
          // because ARRAYJOIN() on linked fields returns names, not IDs.
          maxRecords: 2000,
        })
        .all()
    );
    return records
      .map(mapRecordToAssessment)
      .filter(
        (a) =>
          a.cycleId === cycleId &&
          a.expertUserId === expertUserId &&
          a.trendId &&
          a.metricId
      );
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return [];
  }
}

export async function upsertTrendAssessments(
  params: {
    cycleId: string;
    cycleItemId?: string;
    trendId: string;
    expertUserId: string;
    metricScores: Array<{ metricId: string; score?: number; comment?: string }>;
    status?: TrendAssessment["status"];
  }
): Promise<{ ok: boolean }> {
  try {
    const base = getBase();
    const table = base(TREND_ASSESSMENTS_TABLE) as any;

    const nowIso = new Date().toISOString();
    const baseRecordsToCreate = params.metricScores.map((ms) => ({
      fields: {
        Cycle: [params.cycleId],
        ...(params.cycleItemId ? { "Trend Cycle Item": [params.cycleItemId] } : {}),
        Trend: [params.trendId],
        Expert: [params.expertUserId],
        Metric: [ms.metricId],
        ...(ms.score !== undefined ? { Score: ms.score } : {}),
        ...(ms.comment !== undefined ? { Comment: ms.comment } : {}),
        Status: params.status ?? "Submitted",
      },
    }));

    const fullRecordsToCreate = baseRecordsToCreate.map((r) => ({
      fields: {
        ...r.fields,
        "Submitted At": nowIso,
      },
    }));

    try {
      await fetchWithRetry(() => table.create(fullRecordsToCreate));
      return { ok: true };
    } catch (error: any) {
      const message =
        (typeof error?.message === "string" && error.message) || "";

      // If "Submitted At" doesn't exist in the Airtable schema yet,
      // retry without that field so writes still succeed.
      if (message.includes("UNKNOWN_FIELD_NAME")) {
        try {
          await fetchWithRetry(() => table.create(baseRecordsToCreate));
          return { ok: true };
        } catch (inner) {
          console.error("Error upserting trend assessments (fallback):", inner);
          return { ok: false };
        }
      }

      console.error("Error upserting trend assessments:", error);
      return { ok: false };
    }
  } catch (outer) {
    console.error("Error preparing trend assessments:", outer);
    return { ok: false };
  }
}

export async function getAssessmentsForCycle(cycleId: string): Promise<TrendAssessment[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() =>
      base(TREND_ASSESSMENTS_TABLE)
        .select({
          // Fetch a reasonable upper bound and filter in code for the same
          // reason as getAssessmentsForExpert (linked fields vs IDs).
          maxRecords: 5000,
        })
        .all()
    );
    return records
      .map(mapRecordToAssessment)
      .filter(
        (a) =>
          a.cycleId === cycleId &&
          a.trendId &&
          a.expertUserId &&
          a.metricId
      );
  } catch (error) {
    console.error("Error fetching cycle assessments:", error);
    return [];
  }
}

export async function createTrendCycle(input: {
  name: string;
  code?: string;
  ownerUserId: string;
  expertUserIds: string[];
  metricIds: string[];
  description?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TrendCycle | null> {
  const base = getBase();
  const table = base(TREND_CYCLES_TABLE) as any;

  // Minimal, always-safe fields
  const baseFields: Record<string, unknown> = {
    Name: input.name,
    Status: "Draft",
  };
  if (input.description) baseFields["Description"] = input.description;

  // Full field set – will be attempted first
  const fullFields: Record<string, unknown> = {
    ...baseFields,
    ...(input.code ? { Code: input.code } : {}),
    ...(input.ownerUserId ? { Owner: [input.ownerUserId] } : {}),
    ...(input.expertUserIds?.length ? { Experts: input.expertUserIds } : {}),
    ...(input.metricIds?.length ? { Metrics: input.metricIds } : {}),
    ...(input.startDate ? { "Start Date": input.startDate } : {}),
    ...(input.endDate ? { "End Date": input.endDate } : {}),
  };

  try {
    const created = await fetchWithRetry(() => table.create(fullFields));
    if (!created) return null;
    return mapRecordToTrendCycle(created);
  } catch (error: any) {
    const message =
      (typeof error?.message === "string" && error.message) || "";

    // If some optional field name doesn't exist in Airtable yet,
    // retry with the minimal set so cycle creation still succeeds.
    if (message.includes("UNKNOWN_FIELD_NAME")) {
      try {
        const fallback = await fetchWithRetry(() => table.create(baseFields));
        if (!fallback) return null;
        return mapRecordToTrendCycle(fallback);
      } catch (inner) {
        console.error("Error creating trend cycle (fallback):", inner);
        return null;
      }
    }

    console.error("Error creating trend cycle:", error);
    return null;
  }
}

export async function addTrendToCycle(input: {
  cycleId: string;
  trendId: string;
  stage?: TrendCycleItemStage;
  notes?: string;
}): Promise<TrendCycleItem | null> {
  const base = getBase();
  const table = base(TREND_CYCLE_ITEMS_TABLE) as any;

  // Minimal fields that must exist
  const baseFields: Record<string, unknown> = {
    Cycle: [input.cycleId],
    Trend: [input.trendId],
  };

  const fullFields: Record<string, unknown> = {
    ...baseFields,
    Stage: input.stage ?? "Long List",
    ...(input.notes ? { Notes: input.notes } : {}),
  };

  try {
    const created = await fetchWithRetry(() => table.create(fullFields));
    if (!created) return null;
    return mapRecordToCycleItem(created);
  } catch (error: any) {
    const message =
      (typeof error?.message === "string" && error.message) || "";

    if (message.includes("UNKNOWN_FIELD_NAME")) {
      try {
        const fallback = await fetchWithRetry(() => table.create(baseFields));
        if (!fallback) return null;
        return mapRecordToCycleItem(fallback);
      } catch (inner) {
        console.error("Error adding trend to cycle (fallback):", inner);
        return null;
      }
    }

    console.error("Error adding trend to cycle:", error);
    return null;
  }
}

export async function updateTrendCycle(
  cycleId: string,
  updates: Partial<Pick<TrendCycle, "name" | "code" | "status" | "expertUserIds" | "metricIds" | "description" | "startDate" | "endDate" | "radarIds">>
): Promise<TrendCycle | null> {
  try {
    const base = getBase();
    const table = base(TREND_CYCLES_TABLE) as any;
    const fields: Record<string, unknown> = {};
    if (updates.name !== undefined) fields["Name"] = updates.name;
    if (updates.code !== undefined) fields["Code"] = updates.code;
    if (updates.status !== undefined) fields["Status"] = updates.status;
    if (updates.expertUserIds !== undefined) fields["Experts"] = updates.expertUserIds;
    if (updates.metricIds !== undefined) fields["Metrics"] = updates.metricIds;
    if (updates.description !== undefined) fields["Description"] = updates.description;
    if (updates.startDate !== undefined) fields["Start Date"] = updates.startDate;
    if (updates.endDate !== undefined) fields["End Date"] = updates.endDate;
    if (updates.radarIds !== undefined) fields["Radars"] = updates.radarIds;
    const updated = await fetchWithRetry(() => table.update(cycleId, fields));
    if (!updated) return null;
    return mapRecordToTrendCycle(updated);
  } catch (error) {
    console.error("Error updating trend cycle:", error);
    return null;
  }
}

export async function updateTrendCycleItem(
  itemId: string,
  updates: Partial<Pick<TrendCycleItem, "stage" | "notes">>
): Promise<TrendCycleItem | null> {
  try {
    const base = getBase();
    const table = base(TREND_CYCLE_ITEMS_TABLE) as any;
    const fields: Record<string, unknown> = {};
    if (updates.stage !== undefined) fields["Stage"] = updates.stage;
    if (updates.notes !== undefined) fields["Notes"] = updates.notes;
    const updated = await fetchWithRetry(() => table.update(itemId, fields));
    if (!updated) return null;
    return mapRecordToCycleItem(updated);
  } catch (error) {
    console.error("Error updating trend cycle item:", error);
    return null;
  }
}

// Cached helper: cycles list for left sidepanels.
export const getAllTrendCyclesCached = unstable_cache(
  () => getAllTrendCycles(),
  ["trendCycles"],
  { revalidate: 60, tags: ["trend-cycles"] }
);

