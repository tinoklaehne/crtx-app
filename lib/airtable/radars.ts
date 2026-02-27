// Removed 'use server' directive for static export compatibility

import Airtable from 'airtable';
import { getBase, getField, fetchWithRetry, normalizeDomain } from './utils';
import type { Radar } from '@/app/types/radars';
import type { Trend } from '@/app/types/trends';
import type { Domain } from '@/app/types/domains';

const RADARS_TABLE = 'tbltJj6hqqNdbcJjT';
const TRENDS_TABLE = 'tblZ683rmMtm6BkyL'; // Same as general.ts – trends linked by REL_Trends

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
      };
    });
  } catch (error) {
    console.error('Error fetching radars:', error);
    // Return empty array instead of throwing to prevent build failures
    return [];
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