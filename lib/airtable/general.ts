// Removed 'use server' directive for static export compatibility

import { unstable_cache } from 'next/cache';
import { getBase, getField, normalizeDomain, fetchWithRetry } from './utils';
import type { Cluster } from '@/app/types/clusters';
import type { Trend } from '@/app/types/trends';
import type { Domain } from '@/app/types/domains';

// Table names
const TRENDS_TABLE = 'tblZ683rmMtm6BkyL';
const TAXONOMY_TABLE = 'tbld5CXEcljomMMQB';

async function getClustersUncached(
  clusterType: "parent" | "taxonomy" | "domain" = "parent",
  universe?: "General" | "Travel"
): Promise<Cluster[]> {
  try {
    const base = getBase();
    const table = clusterType === "taxonomy" ? TAXONOMY_TABLE : TRENDS_TABLE;
    // For parent/domain clusters we query the Trends table and filter by Scale/Universe.
    // For taxonomy clusters we query the Taxonomy table, which may not have these fields,
    // so we skip filterByFormula entirely to avoid INVALID_FILTER_BY_FORMULA.
    let filterFormula = clusterType === "taxonomy" ? "" : "{Scale} = 'Macro'";
    if (universe && clusterType !== "taxonomy") {
      // Field is named 'Universe' (capital U) in Airtable (Trends table)
      const universeFilter = `{Universe} = '${universe}'`;
      filterFormula = filterFormula ? `AND(${filterFormula}, ${universeFilter})` : universeFilter;
    }
    const records = await fetchWithRetry(() =>
      base(table)
        .select(
          filterFormula
            ? {
                filterByFormula: filterFormula,
                sort: [{ field: "Name", direction: "asc" }],
              }
            : {
                sort: [{ field: "Name", direction: "asc" }],
              }
        )
        .all()
    );
    return records.map(record => ({
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || '',
      imageUrl: getField(record, 'ImageUrl') || '',
      image: getField(record, 'Image') || [],
      colorCode: getField(record, 'ColorCode') || '#00ff80',
      domain: normalizeDomain(getField(record, 'Domain') ?? 'Technology') as Domain,
      universe: getField(record, 'Universe') || 'General',
      trends: [],
      technologies: [],
    }));
  } catch (error) {
    console.error('Error fetching clusters:', error);
    return [];
  }
}

/** Get all clusters (Macro trends) with optional universe filter. Cached for 1 hour. */
export async function getClusters(
  clusterType: "parent" | "taxonomy" | "domain" = "parent",
  universe?: "General" | "Travel"
): Promise<Cluster[]> {
  const cacheKey = ['clusters', clusterType, universe ?? 'all'];
  return unstable_cache(
    () => getClustersUncached(clusterType, universe),
    cacheKey,
    { revalidate: 3600, tags: ['clusters'] }
  )();
}

// Get all technologies (trends) with optional universe filter.
// Only returns records where Scale = 'Micro'. No explicit fields list.
export async function getTechnologies(
  clusterType: "parent" | "taxonomy" | "domain" = "parent",
  universe?: "General" | "Travel"
): Promise<Trend[]> {
  try {
    const base = getBase();
    let filterFormula = "{Scale} = 'Micro'";
    if (universe) {
      // Match Airtable 'Universe' field name
      filterFormula = `AND(${filterFormula}, {Universe} = '${universe}')`;
    }
    const params: { sort: { field: string; direction: 'asc' }[]; filterByFormula: string } = {
      sort: [{ field: 'Name', direction: 'asc' }],
      filterByFormula: filterFormula,
    };

    const records = await fetchWithRetry(() =>
      base(TRENDS_TABLE)
        .select(params)
        .all()
    );
    
    return records.map(record => {
      // Get the relationship ID based on clustering type
      const parentField = getField(record, 'REL_Parent');
      const taxonomyField = getField(record, 'REL_Taxonomy');
      
      const clusterId = clusterType === "taxonomy" 
        ? (Array.isArray(taxonomyField) && taxonomyField.length > 0 ? taxonomyField[0] : '')
        : (Array.isArray(parentField) && parentField.length > 0 ? parentField[0] : '');

      // Handle aliases field
      const aliasField = getField(record, 'Alias');
      let aliases: string[] = [];
      
      if (aliasField) {
        if (Array.isArray(aliasField)) {
          aliases = aliasField;
        } else if (typeof aliasField === 'string') {
          // Split comma-separated string and trim whitespace
          aliases = aliasField.split(',').map(alias => alias.trim()).filter(alias => alias.length > 0);
        }
      }
      const iconField = getField(record, 'Icon');
      const iconUrl = typeof iconField === 'string' ? iconField : (Array.isArray(iconField) && iconField[0]?.url) ? (iconField[0] as { url?: string }).url : undefined;
      return {
        id: record.id,
        name: getField(record, 'Name') || '',
        description: getField(record, 'Description') || '',
        imageUrl: getField(record, 'ImageUrl') || '',
        iconUrl: iconUrl || getField(record, 'ImageUrl') || undefined,
        image: getField(record, 'Image') || [],
        clusterId,
        taxonomyId: Array.isArray(taxonomyField) && taxonomyField.length > 0 ? taxonomyField[0] : undefined,
        domain: normalizeDomain(getField(record, 'Domain') ?? 'Technology') as Domain,
        universe: getField(record, 'Universe') || 'General',
        technologyReadinessLevel: parseInt(getField(record, 'TechnologyReadinessLevel') ?? '1') || 1,
        businessReadinessLevel: parseInt(getField(record, 'BusinessReadinessLevel') ?? '1') || 1,
        trendHorizon: getField(record, 'TrendHorizon') || "2-5",
        trendHorizonReasoning: getField(record, 'Trend Horizon Reasoning') || '',
        trlReasoning: getField(record, 'TRL Reasoning') || '',
        brlReasoning: getField(record, 'BRL Reasoning') || '',
        aliases,
      };
    });
  } catch (error) {
    console.error('Error fetching technologies:', error);
    return [];
  }
}

/** Get all trends (Micro scale) sorted by Name – for Trends app list. */
export async function getAllTrends(): Promise<Trend[]> {
  return getTechnologies("parent");
}

/** Get a single trend by ID – for Trends app detail page. */
export async function getTrend(id: string): Promise<Trend | null> {
  try {
    const base = getBase();
    const record = await fetchWithRetry(() => base(TRENDS_TABLE).find(id));
    if (!record) return null;
    const parentField = getField(record, 'REL_Parent');
    const taxonomyField = getField(record, 'REL_Taxonomy');
    const clusterId = Array.isArray(parentField) && parentField.length > 0 ? parentField[0] : '';
    const aliasField = getField(record, 'Alias');
    let aliases: string[] = [];
    if (aliasField) {
      aliases = Array.isArray(aliasField)
        ? aliasField
        : typeof aliasField === 'string'
          ? aliasField.split(',').map((a) => a.trim()).filter(Boolean)
          : [];
    }
    const iconField = getField(record, 'Icon');
    const iconUrl = typeof iconField === 'string' ? iconField : (Array.isArray(iconField) && iconField[0]?.url) ? (iconField[0] as { url?: string }).url : undefined;
    return {
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || '',
      imageUrl: getField(record, 'ImageUrl') || '',
      iconUrl: iconUrl || getField(record, 'ImageUrl') || undefined,
      image: getField(record, 'Image') || [],
      clusterId,
      taxonomyId: Array.isArray(taxonomyField) && taxonomyField.length > 0 ? taxonomyField[0] : undefined,
      domain: normalizeDomain(getField(record, 'Domain') ?? 'Technology') as Domain,
      universe: (getField(record, 'Universe') as Trend['universe']) || 'General',
      technologyReadinessLevel: parseInt(String(getField(record, 'TechnologyReadinessLevel') ?? '1'), 10) || 1,
      businessReadinessLevel: parseInt(String(getField(record, 'BusinessReadinessLevel') ?? '1'), 10) || 1,
      trendHorizon: (getField(record, 'TrendHorizon') as Trend['trendHorizon']) || '2-5',
      trendHorizonReasoning: getField(record, 'Trend Horizon Reasoning') || '',
      trlReasoning: getField(record, 'TRL Reasoning') || '',
      brlReasoning: getField(record, 'BRL Reasoning') || '',
      aliases,
    };
  } catch (error) {
    console.error('Error fetching trend:', error);
    return null;
  }
}