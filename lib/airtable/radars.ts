// Removed 'use server' directive for static export compatibility

import Airtable from 'airtable';
import { getBase, getField, fetchWithRetry, normalizeDomain } from './utils';
import type { Radar } from '@/app/types/radars';
import type { Trend } from '@/app/types/trends';
import type { Domain } from '@/app/types/domains';

const RADARS_TABLE = 'tbltJj6hqqNdbcJjT';
const TRENDS_TABLE = 'tblZ683rmMtm6BkyL'; // Same as general.ts – trends linked by REL_Trends
const DEFAULT_SELECT_KPI_VALUES = ["BRL", "TRL", "Trend Horizon", "Strategic Action"] as const;

function getRadarWriteFields(
  name: string,
  description: string | undefined,
  trendIds: string[],
  status?: string,
) {
  const cleanedStatus = (status || "Draft").trim() || "Draft";
  return {
    Name: name.trim(),
    Description: description?.trim() || "",
    REL_Trends: trendIds.filter(Boolean),
    "Radar Type": "Standalone",
    Status: cleanedStatus,
    Type: "Travel",
    Universe: "Travel",
    Level: "Micro",
    Cluster: "Domain",
    Select_Cluster: ["Domain"],
    Select_KPI: [...DEFAULT_SELECT_KPI_VALUES],
  } as Record<string, unknown>;
}

function isUnknownFieldError(error: unknown): boolean {
  const e = error as { error?: string; message?: string; originalError?: { error?: string; message?: string } };
  const errType = String(e?.error ?? e?.originalError?.error ?? "").toUpperCase();
  const message = String(e?.message ?? e?.originalError?.message ?? "").toUpperCase();
  return errType.includes("UNKNOWN_FIELD_NAME") || message.includes("UNKNOWN_FIELD_NAME");
}

export async function getRadar(id: string): Promise<Radar | null> {
  try {
    if (process.env.NODE_ENV === 'development') console.log(`Fetching radar with ID: ${id}`);
    const base = getBase();
    
    let record;
    try {
      record = await fetchWithRetry(() => base(RADARS_TABLE).find(id));
    } catch (airtableError: any) {
      if (airtableError.error === 'NOT_FOUND' || airtableError.statusCode === 404) {
        if (process.env.NODE_ENV === 'development') console.warn(`Radar record not found with ID: ${id}`);
        return null;
      }
      throw airtableError;
    }
    
    if (!record) {
      if (process.env.NODE_ENV === 'development') console.warn(`No radar found with ID: ${id}`);
      return null;
    }

    if (process.env.NODE_ENV === 'development') console.log(`Successfully fetched radar: ${getField(record, 'Name')}`);

    const rawLogo = getField<any>(record, 'Logo');
    const logoUrl =
      typeof rawLogo === 'string'
        ? rawLogo.trim() || undefined
        : Array.isArray(rawLogo) && rawLogo[0] && typeof (rawLogo[0] as any).url === 'string'
          ? ((rawLogo[0] as any).url as string).trim() || undefined
          : undefined;

    const owner = getField<string[]>(record, 'Owner') || [];

    return {
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || '',
      logoUrl,
      type: getField(record, 'Type') || 'General',
      level: getField(record, 'Level') || 'Micro',
      cluster: getField(record, 'Cluster') || 'Parent',
      totalTrends: getField(record, 'Total Trends') || 0,
      lastModified: getField(record, 'Last Modified') || new Date().toISOString(),
      trends: getField(record, 'REL_Trends') || [],
      radarType: getField(record, 'Radar Type') || undefined,
      status: getField(record, 'Status') || undefined,
      trendCycleIds: (getField<string[]>(record, 'Trend Cycles') ?? getField<string[]>(record, 'REL_TrendCycles') ?? undefined) || undefined,
      ownerIds: owner.filter(Boolean),
    };
  } catch (error) {
    console.error('Error fetching radar:', error);
    return null;
  }
}

export async function getAllRadars(): Promise<Radar[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() => 
      base(RADARS_TABLE)
        .select({
          maxRecords: 200,
          pageSize: 50
        })
        .all()
    );
    
    if (process.env.NODE_ENV === 'development') console.log(`Successfully fetched ${records.length} radars from Airtable`);
    
    return records.map(record => {
      const rawLogo = getField<any>(record, 'Logo');
      const logoUrl =
        typeof rawLogo === 'string'
          ? rawLogo.trim() || undefined
          : Array.isArray(rawLogo) && rawLogo[0] && typeof (rawLogo[0] as any).url === 'string'
            ? ((rawLogo[0] as any).url as string).trim() || undefined
            : undefined;

      const owner = getField<string[]>(record, 'Owner') || [];

      return {
        id: record.id,
        name: getField(record, 'Name') || '',
        description: getField(record, 'Description') || '',
        logoUrl,
        type: getField(record, 'Type') || 'General',
        level: getField(record, 'Level') || 'Micro',
        cluster: getField(record, 'Cluster') || 'Parent',
        totalTrends: getField(record, 'Total Trends') || 0,
        lastModified: getField(record, 'Last Modified') || new Date().toISOString(),
        trends: getField(record, 'REL_Trends') || [],
        radarType: getField(record, 'Radar Type') || undefined,
        status: getField(record, 'Status') || undefined,
        trendCycleIds: (getField<string[]>(record, 'Trend Cycles') ?? getField<string[]>(record, 'REL_TrendCycles') ?? undefined) || undefined,
        ownerIds: owner.filter(Boolean),
      };
    });
  } catch (error) {
    console.error('Error fetching radars:', error);
    // Return empty array instead of throwing to prevent build failures
    return [];
  }
}

interface CreateRadarInput {
  name: string;
  description?: string;
  trendIds: string[];
  ownerIds?: string[];
}

interface UpdateRadarInput {
  radarId: string;
  name: string;
  description?: string;
  trendIds: string[];
  status?: string;
  ownerIds?: string[];
}

export async function createRadar({
  name,
  description,
  trendIds,
  ownerIds,
}: CreateRadarInput): Promise<Radar | null> {
  if (!name.trim()) return null;
  try {
    const base = getBase();
    const table = base(RADARS_TABLE) as unknown as {
      create: (
        records: { fields: Record<string, unknown> }[]
      ) => Promise<readonly { id: string; fields?: Record<string, unknown>; get?: (field: string) => unknown }[]>;
    };

    const baseFields = {
      ...getRadarWriteFields(name, description, trendIds, "Draft"),
      ...(ownerIds && ownerIds.length ? { Owner: ownerIds } : {}),
    };
    const fallbackFieldDrops = [
      [] as string[],
      ["Select_KPI"],
      ["Select_Cluster"],
      ["Universe"],
      ["Select_KPI", "Select_Cluster"],
      ["Select_KPI", "Universe"],
      ["Select_Cluster", "Universe"],
      ["Select_KPI", "Select_Cluster", "Universe"],
    ];

    let created:
      | readonly { id: string; fields?: Record<string, unknown>; get?: (field: string) => unknown }[]
      | null = null;
    let lastError: unknown = null;
    for (const fieldsToDrop of fallbackFieldDrops) {
      const fields = { ...baseFields };
      fieldsToDrop.forEach((key) => delete fields[key]);
      try {
        created = await fetchWithRetry(() =>
          table.create([
            {
              fields,
            },
          ])
        );
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (!isUnknownFieldError(error)) throw error;
      }
    }
    if (!created) {
      if (lastError) throw lastError;
      return null;
    }
    const createdList = Array.from(created);
    const record = createdList.length > 0 ? createdList[0] : null;
    if (!record) return null;

    return {
      id: record.id,
      name: (getField<string>(record, "Name") ?? name).trim(),
      description: getField<string>(record, "Description") ?? description?.trim() ?? "",
      logoUrl: undefined,
      type: (getField<Radar["type"]>(record, "Type") ?? "Travel"),
      level: (getField<Radar["level"]>(record, "Level") ?? "Micro"),
      cluster: (getField<Radar["cluster"]>(record, "Cluster") ?? "Domain"),
      totalTrends: trendIds.length,
      lastModified: getField<string>(record, "Last Modified") ?? new Date().toISOString(),
      trends: getField<string[]>(record, "REL_Trends") ?? trendIds.filter(Boolean),
      radarType: getField<string>(record, "Radar Type") ?? "Standalone",
      status: getField<string>(record, "Status") ?? "Draft",
      trendCycleIds: undefined,
      ownerIds: ownerIds?.filter(Boolean),
    };
  } catch (error) {
    console.error("Error creating radar:", error);
    return null;
  }
}

export async function updateRadar({
  radarId,
  name,
  description,
  trendIds,
  status,
  ownerIds,
}: UpdateRadarInput): Promise<Radar | null> {
  if (!radarId.trim() || !name.trim()) return null;
  try {
    const base = getBase();
    const table = base(RADARS_TABLE) as unknown as {
      update: (
        records: { id: string; fields: Record<string, unknown> }[]
      ) => Promise<readonly { id: string; fields?: Record<string, unknown>; get?: (field: string) => unknown }[]>;
    };

    const baseFields = {
      ...getRadarWriteFields(name, description, trendIds, status),
      ...(ownerIds && ownerIds.length ? { Owner: ownerIds } : {}),
    };
    const fallbackFieldDrops = [
      [] as string[],
      ["Select_KPI"],
      ["Select_Cluster"],
      ["Universe"],
      ["Select_KPI", "Select_Cluster"],
      ["Select_KPI", "Universe"],
      ["Select_Cluster", "Universe"],
      ["Select_KPI", "Select_Cluster", "Universe"],
    ];

    let updated:
      | readonly { id: string; fields?: Record<string, unknown>; get?: (field: string) => unknown }[]
      | null = null;
    let lastError: unknown = null;
    for (const fieldsToDrop of fallbackFieldDrops) {
      const fields = { ...baseFields };
      fieldsToDrop.forEach((key) => delete fields[key]);
      try {
        updated = await fetchWithRetry(() =>
          table.update([
            {
              id: radarId,
              fields,
            },
          ])
        );
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (!isUnknownFieldError(error)) throw error;
      }
    }
    if (!updated) {
      if (lastError) throw lastError;
      return null;
    }

    const updatedList = Array.from(updated);
    const record = updatedList.length > 0 ? updatedList[0] : null;
    if (!record) return null;

    return {
      id: record.id,
      name: (getField<string>(record, "Name") ?? name).trim(),
      description: getField<string>(record, "Description") ?? description?.trim() ?? "",
      logoUrl: undefined,
      type: (getField<Radar["type"]>(record, "Type") ?? "Travel"),
      level: (getField<Radar["level"]>(record, "Level") ?? "Micro"),
      cluster: (getField<Radar["cluster"]>(record, "Cluster") ?? "Domain"),
      totalTrends: trendIds.length,
      lastModified: getField<string>(record, "Last Modified") ?? new Date().toISOString(),
      trends: getField<string[]>(record, "REL_Trends") ?? trendIds.filter(Boolean),
      radarType: getField<string>(record, "Radar Type") ?? "Standalone",
      status: getField<string>(record, "Status") ?? "Draft",
      trendCycleIds: undefined,
      ownerIds: ownerIds?.filter(Boolean),
    };
  } catch (error) {
    console.error("Error updating radar:", error);
    return null;
  }
}

export async function getRadarIds(): Promise<string[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(() => 
      base(RADARS_TABLE)
        .select({
          fields: [], // Only fetch the record ID, no other fields
          maxRecords: 200,
          pageSize: 50
        })
        .all()
    );
    
    if (process.env.NODE_ENV === 'development') console.log(`Successfully fetched ${records.length} radar IDs from Airtable`);
    
    return records.map(record => record.id);
  } catch (error) {
    console.error('Error fetching radar IDs:', error);
    // Return empty array instead of throwing to prevent build failures
    return [];
  }
}

const TREND_BATCH_SIZE = 12; // Airtable formula length limit; keep batches small

/** Map a single trend record to Trend; clusterId from REL_Trends (parent) or REL_Taxonomy. */
function recordToTrend(
  record: { id: string; get?: (f: string) => unknown; fields?: Record<string, unknown> },
  clusterType: 'parent' | 'taxonomy' | 'domain'
): Trend {
  const relTrendsField = getField<string[]>(record, 'REL_Trends');
  const taxonomyField = getField<string[]>(record, 'REL_Taxonomy');
  const clusterId =
    clusterType === 'taxonomy'
      ? (Array.isArray(taxonomyField) && taxonomyField.length > 0 ? taxonomyField[0] : '')
      : (Array.isArray(relTrendsField) && relTrendsField.length > 0 ? relTrendsField[0] : '');
  const aliasField = getField(record, 'Alias');
  let aliases: string[] = [];
  if (aliasField) {
    aliases = Array.isArray(aliasField)
      ? aliasField
      : typeof aliasField === 'string'
        ? aliasField.split(',').map((a) => a.trim()).filter(Boolean)
        : [];
  }
  return {
    id: record.id,
    name: getField(record, 'Name') || '',
    description: getField(record, 'Description') || '',
    imageUrl: getField(record, 'ImageUrl') || '',
    image: getField(record, 'Image') || [],
    clusterId,
    taxonomyId: Array.isArray(taxonomyField) && taxonomyField.length > 0 ? taxonomyField[0] : undefined,
    domain: normalizeDomain((getField(record, 'Domain') as string) ?? 'Technology') as Domain,
    universe: (getField(record, 'Universe') as Trend['universe']) || 'General',
    technologyReadinessLevel: parseInt(String(getField(record, 'TechnologyReadinessLevel') ?? '1'), 10) || 1,
    businessReadinessLevel: parseInt(String(getField(record, 'BusinessReadinessLevel') ?? '1'), 10) || 1,
    trendHorizon: (getField(record, 'TrendHorizon') as Trend['trendHorizon']) || '2-5',
    trendHorizonReasoning: getField(record, 'Trend Horizon Reasoning') || '',
    trlReasoning: getField(record, 'TRL Reasoning') || '',
    brlReasoning: getField(record, 'BRL Reasoning') || '',
    aliases,
  };
}

/**
 * Fetch many trend records by ID in batches (fewer Airtable calls, less rate-limit risk).
 */
export async function fetchTrendRecordsByIds(ids: string[]): Promise<Map<string, { id: string; get?: (f: string) => unknown; fields?: Record<string, unknown> }>> {
  const map = new Map<string, { id: string; get?: (f: string) => unknown; fields?: Record<string, unknown> }>();
  if (!ids.length) return map;
  const unique = Array.from(new Set(ids));
  const base = getBase();
  for (let i = 0; i < unique.length; i += TREND_BATCH_SIZE) {
    if (i > 0) await new Promise((r) => setTimeout(r, 150)); // gentle rate limit between batches
    const batch = unique.slice(i, i + TREND_BATCH_SIZE);
    const formula = batch.map((id) => `RECORD_ID()='${id.replace(/'/g, "\\'")}'`).join(',');
    try {
      const records = await fetchWithRetry(() =>
        base(TRENDS_TABLE)
          .select({ filterByFormula: `OR(${formula})`, pageSize: TREND_BATCH_SIZE })
          .all()
      );
      for (const rec of records) {
        map.set(rec.id, rec);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.warn('Batch fetch trends failed, falling back to single fetches for batch:', batch.slice(0, 3), err);
      for (const id of batch) {
        try {
          const rec = await fetchWithRetry(() => base(TRENDS_TABLE).find(id));
          if (rec) map.set(rec.id, rec);
        } catch {
          // skip failed single record
        }
      }
    }
  }
  return map;
}

/**
 * Fetch trend records for a radar by its REL_Trends IDs (Trend Radars table column).
 * Uses batched requests to reduce load. Used only by the radar app; domains use getDomainTrends and are unchanged.
 */
export async function getTrendsForRadar(radar: Radar): Promise<Trend[]> {
  const trendIds = radar.trends;
  if (!trendIds || !Array.isArray(trendIds) || trendIds.length === 0) {
    return [];
  }
  try {
    const clusterType = radar.cluster.toLowerCase() as 'parent' | 'taxonomy' | 'domain';
    const recordsMap = await fetchTrendRecordsByIds(trendIds);
    const ordered = trendIds.map((id) => recordsMap.get(id)).filter(Boolean) as Parameters<typeof recordToTrend>[0][];
    return ordered.map((record) => recordToTrend(record, clusterType));
  } catch (error) {
    console.error('Error fetching trends for radar:', error);
    return [];
  }
}

/**
 * Pre-fetch all trend records needed for a list of radars in one batched pass, then build per-radar trends.
 * Use this on the radars list page to avoid N radars × M trends separate calls.
 */
export async function fetchAllTrendRecordsForRadars(radars: Radar[]): Promise<Map<string, { id: string; get?: (f: string) => unknown; fields?: Record<string, unknown> }>> {
  const allIds = new Set<string>();
  for (const r of radars) {
    if (Array.isArray(r.trends)) for (const id of r.trends) allIds.add(id);
  }
  return fetchTrendRecordsByIds(Array.from(allIds));
}

/** Build Trend[] for one radar from a pre-fetched map (no extra Airtable calls). */
export function getTrendsForRadarFromRecords(
  radar: Radar,
  recordsMap: Map<string, { id: string; get?: (f: string) => unknown; fields?: Record<string, unknown> }>
): Trend[] {
  const trendIds = radar.trends;
  if (!trendIds || !Array.isArray(trendIds) || trendIds.length === 0) return [];
  const clusterType = radar.cluster.toLowerCase() as 'parent' | 'taxonomy' | 'domain';
  const ordered = trendIds.map((id) => recordsMap.get(id)).filter(Boolean) as Parameters<typeof recordToTrend>[0][];
  return ordered.map((record) => recordToTrend(record, clusterType));
}