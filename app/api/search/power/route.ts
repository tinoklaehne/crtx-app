import { NextRequest, NextResponse } from "next/server";
import { getBase, getField } from "@/lib/airtable/utils";
import type {
  PowerSearchGroupedResults,
  PowerSearchItem,
} from "@/app/types/search";

const ACTIONS_TABLE = "tblA0KRyRnM763cXy";
const TAXONOMY_TABLE = "tbld5CXEcljomMMQB";
const TRENDS_TABLE = "tblZ683rmMtm6BkyL";
const REPORTS_TABLE = "tbldruSIrVtQiipCM";
const ACTORS_TABLE = "tblFiHksu7YbAFvQw";

const DEFAULT_RESULTS_PER_GROUP = 10;
const MAX_RESULTS_PER_GROUP = 100;
const PER_SOURCE_TIMEOUT_MS = 2800;

function normalize(text: unknown): string {
  if (text == null) return "";
  return String(text).toLowerCase().trim();
}

function safeText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>) &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    return (value as { value: string }).value;
  }
  if (
    typeof value === "object" &&
    "specialValue" in (value as Record<string, unknown>)
  ) {
    return String((value as { specialValue?: unknown }).specialValue ?? "");
  }
  return String(value);
}

function includesQuery(value: unknown, query: string): boolean {
  return normalize(safeText(value)).includes(query);
}

function escapeFormulaText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function formulaMatchAny(fields: string[], query: string): string {
  const escaped = escapeFormulaText(query);
  return `OR(${fields
    .map((field) => `FIND(LOWER('${escaped}'), LOWER({${field}} & '')) > 0`)
    .join(",")})`;
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RESULTS_PER_GROUP;
  return Math.min(parsed, MAX_RESULTS_PER_GROUP);
}

type SearchScope = keyof PowerSearchGroupedResults;

function parseScope(value: string | null): SearchScope | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "signals" ||
    normalized === "domains" ||
    normalized === "trends" ||
    normalized === "reports" ||
    normalized === "actors"
  ) {
    return normalized;
  }
  return null;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
  });
  const result = await Promise.race([promise, timeout]);
  if (timeoutId) clearTimeout(timeoutId);
  return result;
}

function emptyResults(): PowerSearchGroupedResults {
  return {
    signals: [],
    domains: [],
    trends: [],
    reports: [],
    actors: [],
  };
}

interface AirtableRecord {
  id: string;
  fields?: Record<string, unknown>;
  get?: (field: string) => unknown;
}

async function selectWithFallback(
  tableName: string,
  primaryOptions: Record<string, unknown>,
  fallbackMaxRecords = 80
): Promise<AirtableRecord[]> {
  const base = getBase();
  try {
    const records = await base(tableName).select(primaryOptions).all();
    return Array.from(records) as unknown as AirtableRecord[];
  } catch {
    try {
      const records = await base(tableName)
        .select({ maxRecords: fallbackMaxRecords, pageSize: 50 })
        .all();
      return Array.from(records) as unknown as AirtableRecord[];
    } catch {
      return [];
    }
  }
}

async function searchSignals(query: string, limit: number): Promise<PowerSearchItem[]> {
  const records = await selectWithFallback(
    ACTIONS_TABLE,
    {
      filterByFormula: `AND(OR({Status}='Auto', {Status}='Checked', {Status}=''), ${formulaMatchAny(
        ["Headline", "Title", "Name", "Description", "Source", "Action Type"],
        query
      )})`,
      maxRecords: 40,
      pageSize: 40,
    },
    120
  );

  const signals = records
    .map((record) => {
      const domainField =
        getField<string | string[]>(record, "(REL) Sub-Area") ??
        getField<string | string[]>(record, "REL Sub-Area") ??
        undefined;
      const domainId = Array.isArray(domainField) ? domainField[0] : domainField;
      const url = safeText(
        getField(record, "URL") ?? getField(record, "Url") ?? getField(record, "Link")
      );
      const external = url.startsWith("http");

      return {
        id: record.id,
        type: "signal" as const,
        title: safeText(
          getField(record, "Headline") ??
            getField(record, "Title") ??
            getField(record, "Name") ??
            "Untitled signal"
        ),
        description: safeText(getField(record, "Description")),
        source: safeText(getField(record, "Source")),
        meta: safeText(getField(record, "Action Type")),
        href: external ? url : domainId ? `/domains/${domainId}` : "/domains",
        external,
      };
    })
    .filter((signal) => includesQuery(signal.title, query) || includesQuery(signal.description, query));

  return signals.slice(0, limit);
}

async function searchDomains(query: string, limit: number): Promise<PowerSearchItem[]> {
  const records = await selectWithFallback(
    TAXONOMY_TABLE,
    {
      filterByFormula: formulaMatchAny(["Name", "Description"], query),
      maxRecords: 25,
      pageSize: 25,
    },
    80
  );

  return records
    .map((record) => ({
      id: record.id,
      type: "domain" as const,
      title: safeText(getField(record, "Name") ?? "Untitled domain"),
      subtitle: safeText(getField(record, "Description")),
      href: `/domains/${record.id}`,
    }))
    .filter((item) => includesQuery(item.title, query) || includesQuery(item.subtitle, query))
    .slice(0, limit);
}

async function searchTrends(query: string, limit: number): Promise<PowerSearchItem[]> {
  const records = await selectWithFallback(
    TRENDS_TABLE,
    {
      filterByFormula: formulaMatchAny(["Name", "Description", "Alias", "Domain"], query),
      maxRecords: 25,
      pageSize: 25,
    },
    80
  );

  return records
    .map((record) => ({
      id: record.id,
      type: "trend" as const,
      title: safeText(getField(record, "Name")),
      subtitle: safeText(getField(record, "Description")),
      meta: safeText(getField(record, "Domain")),
      href: `/trends/${record.id}`,
    }))
    .filter(
      (item) =>
        includesQuery(item.title, query) ||
        includesQuery(item.subtitle, query) ||
        includesQuery(item.meta, query)
    )
    .slice(0, limit);
}

async function searchReports(query: string, limit: number): Promise<PowerSearchItem[]> {
  const records = await selectWithFallback(
    REPORTS_TABLE,
    {
      filterByFormula: formulaMatchAny(["Name", "Source", "-->AI/Summary"], query),
      maxRecords: 25,
      pageSize: 25,
    },
    80
  );

  return records
    .map((record) => ({
      id: record.id,
      type: "report" as const,
      title: safeText(getField(record, "Name")),
      subtitle: safeText(getField(record, "-->AI/Summary")),
      meta: safeText(getField(record, "Source")),
      href: `/library/${record.id}`,
    }))
    .filter(
      (item) =>
        includesQuery(item.title, query) ||
        includesQuery(item.subtitle, query) ||
        includesQuery(item.meta, query)
    )
    .slice(0, limit);
}

async function searchActors(query: string, limit: number): Promise<PowerSearchItem[]> {
  const records = await selectWithFallback(
    ACTORS_TABLE,
    {
      filterByFormula: formulaMatchAny(["Name", "Description", "Type_Main", "Geography"], query),
      maxRecords: 25,
      pageSize: 25,
    },
    80
  );

  return records
    .map((record) => ({
      id: record.id,
      type: "actor" as const,
      title: safeText(getField(record, "Name")),
      subtitle: safeText(getField(record, "Description")),
      meta: safeText(getField(record, "Type_Main") ?? getField(record, "Geography")),
      href: `/directory/${record.id}`,
    }))
    .filter(
      (item) =>
        includesQuery(item.title, query) ||
        includesQuery(item.subtitle, query) ||
        includesQuery(item.meta, query)
    )
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  try {
    const q = normalize(request.nextUrl.searchParams.get("q"));
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const scope = parseScope(request.nextUrl.searchParams.get("scope"));
    if (q.length < 2) {
      return NextResponse.json({ query: q, results: emptyResults() });
    }

    if (scope) {
      const scopedResults = emptyResults();
      if (scope === "signals") {
        scopedResults.signals = await withTimeout(
          searchSignals(q, limit),
          PER_SOURCE_TIMEOUT_MS,
          []
        );
      } else if (scope === "domains") {
        scopedResults.domains = await withTimeout(
          searchDomains(q, limit),
          PER_SOURCE_TIMEOUT_MS,
          []
        );
      } else if (scope === "trends") {
        scopedResults.trends = await withTimeout(
          searchTrends(q, limit),
          PER_SOURCE_TIMEOUT_MS,
          []
        );
      } else if (scope === "reports") {
        scopedResults.reports = await withTimeout(
          searchReports(q, limit),
          PER_SOURCE_TIMEOUT_MS,
          []
        );
      } else if (scope === "actors") {
        scopedResults.actors = await withTimeout(
          searchActors(q, limit),
          PER_SOURCE_TIMEOUT_MS,
          []
        );
      }

      return NextResponse.json({
        query: q,
        scope,
        limit,
        results: scopedResults,
      });
    }

    const [signals, matchedDomains, matchedTrends, matchedReports, matchedActors] =
      await Promise.all([
        withTimeout(searchSignals(q, limit), PER_SOURCE_TIMEOUT_MS, []),
        withTimeout(searchDomains(q, limit), PER_SOURCE_TIMEOUT_MS, []),
        withTimeout(searchTrends(q, limit), PER_SOURCE_TIMEOUT_MS, []),
        withTimeout(searchReports(q, limit), PER_SOURCE_TIMEOUT_MS, []),
        withTimeout(searchActors(q, limit), PER_SOURCE_TIMEOUT_MS, []),
      ]);

    return NextResponse.json({
      query: q,
      results: {
        signals,
        domains: matchedDomains,
        trends: matchedTrends,
        reports: matchedReports,
        actors: matchedActors,
      },
    });
  } catch (error) {
    console.error("Error in /api/search/power GET:", error);
    return NextResponse.json(
      { query: "", results: emptyResults(), error: true },
      { status: 500 }
    );
  }
}
