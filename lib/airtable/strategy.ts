import { getBase, getField, fetchWithRetry } from "./utils";
import type { StrategyTheme, StrategyQuestion, StrategyProblem, DomainStrategyData } from "@/app/types/strategy";

const TAXONOMY_TABLE = "tbld5CXEcljomMMQB";
const THEMES_TABLE = "tblZkiNSomAQHZ1iM";
const QUESTIONS_TABLE = "tblIJCIgH2rfz03ap";
const PROBLEMS_TABLE = "tblSL18nb0OOQrv5s";

async function fetchRecordsByIds(tableName: string, recordIds: string[]): Promise<any[]> {
  if (!recordIds?.length) return [];
  const base = getBase();
  const unique = Array.from(new Set(recordIds));
  const idToRecord = new Map<string, any>();
  const batchSize = 50;

  for (let i = 0; i < unique.length; i += batchSize) {
    if (i > 0) await new Promise((r) => setTimeout(r, 150));
    const batch = unique.slice(i, i + batchSize);
    const formula = batch.map((id) => `RECORD_ID()='${String(id).replace(/'/g, "\\'")}'`).join(",");
    try {
      const records = await fetchWithRetry(() =>
        base(tableName)
          .select({ filterByFormula: `OR(${formula})`, pageSize: batchSize })
          .all()
      );
      for (const rec of records) {
        idToRecord.set(rec.id, rec);
      }
    } catch {
      for (const id of batch) {
        try {
          const rec = await fetchWithRetry(() => base(tableName).find(id));
          if (rec) idToRecord.set(rec.id, rec);
        } catch {
          // skip
        }
      }
    }
  }
  return unique.map((id) => idToRecord.get(id)).filter(Boolean);
}

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === "string");
  if (typeof val === "string" && val.trim()) return [val.trim()];
  return [];
}

function mapThemeRecord(record: any): StrategyTheme {
  const questionIds = toArray(getField(record, "Domains_Questions") ?? getField(record, "Questions") ?? []);
  const problemIds = toArray(getField(record, "Domains_Problems") ?? getField(record, "Problems") ?? []);
  const valueLevers = toArray(getField(record, "Value Levers") ?? getField(record, "value_levers") ?? []);
  return {
    id: record.id,
    name: getField(record, "Name") ?? "",
    priority: (getField(record, "Priority") ?? "P2") as StrategyTheme["priority"],
    time_horizon: getField(record, "Time Horizon") ?? getField(record, "time_horizon") ?? "",
    one_liner: getField(record, "One Liner") ?? getField(record, "one_liner") ?? "",
    status: getField(record, "Status") ?? undefined,
    value_levers: valueLevers,
    strategic_intent: getField(record, "Strategic Intent") ?? getField(record, "strategic_intent") ?? "",
    scope_boundary: getField(record, "Scope Boundary") ?? getField(record, "scope_boundary") ?? "",
    questionIds,
    problemIds,
  };
}

function mapQuestionRecord(record: any): StrategyQuestion {
  const problemIds = toArray(getField(record, "Domains_Problems") ?? getField(record, "Problems") ?? getField(record, "problemIds") ?? []);
  return {
    id: record.id,
    question: getField(record, "Question") ?? getField(record, "Name") ?? "",
    themeId: toArray(getField(record, "Domains_Themes") ?? getField(record, "Theme") ?? getField(record, "Themes") ?? [])[0] ?? "",
    priority: String(getField(record, "Priority") ?? ""),
    question_type: getField(record, "Question Type") ?? getField(record, "question_type") ?? "",
    urgency: getField(record, "Urgency") ?? "",
    confidence: Number(getField(record, "Confidence")) || 0,
    answer_status: getField(record, "Answer Status") ?? getField(record, "answer_status") ?? "Open",
    problemIds,
  };
}

function mapProblemRecord(record: any): StrategyProblem {
  const themeIds = toArray(getField(record, "Domains_Themes") ?? getField(record, "Theme") ?? getField(record, "Themes") ?? []);
  return {
    id: record.id,
    summary: getField(record, "Summary") ?? getField(record, "Name") ?? "",
    themeId: themeIds[0] ?? "",
    severity: (getField(record, "Severity") ?? "Medium") as StrategyProblem["severity"],
    pain_type: getField(record, "Pain Type") ?? getField(record, "pain_type") ?? "",
    frequency: getField(record, "Frequency") ?? "",
    readiness: getField(record, "Readiness") ?? "idea",
    impact_estimate: getField(record, "Impact Estimate") ?? getField(record, "impact_estimate") ?? "",
    who_feels_pain: getField(record, "Who Feels Pain") ?? getField(record, "who_feels_pain") ?? "",
  };
}

/** Fetch themes, questions, and problems linked to a domain via Domains_Themes, Domains_Questions, Domains_Problems. */
export async function getDomainStrategy(domainId: string): Promise<DomainStrategyData> {
  try {
    const base = getBase();
    const domainRecord = await fetchWithRetry(() => base(TAXONOMY_TABLE).find(domainId));
    const themeIds = toArray(getField(domainRecord, "Domains_Themes") ?? getField(domainRecord, "Themes") ?? []);
    const questionIds = toArray(getField(domainRecord, "Domains_Questions") ?? getField(domainRecord, "Questions") ?? []);
    const problemIds = toArray(getField(domainRecord, "Domains_Problems") ?? getField(domainRecord, "Problems") ?? []);

    const [themeRecords, questionRecords, problemRecords] = await Promise.all([
      fetchRecordsByIds(THEMES_TABLE, themeIds),
      fetchRecordsByIds(QUESTIONS_TABLE, questionIds),
      fetchRecordsByIds(PROBLEMS_TABLE, problemIds),
    ]);

    const themes = themeRecords.map(mapThemeRecord);
    const questions = questionRecords.map(mapQuestionRecord);
    const problems = problemRecords.map(mapProblemRecord);

    return { themes, questions, problems };
  } catch (error) {
    console.error("Error fetching domain strategy:", error);
    return { themes: [], questions: [], problems: [] };
  }
}
