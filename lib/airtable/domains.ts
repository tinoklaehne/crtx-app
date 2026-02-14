// Removed 'use server' directive for static export compatibility

import { getBase, getField, fetchWithRetry, normalizeDomain } from './utils';
import type { BusinessDomain, DomainWithMomentum, MomentumDataPoint } from '@/app/types/businessDomains';
import type { DomainTabContent, DomainContentItem } from '@/app/types/domainContent';
import type { Trend } from '@/app/types/trends';
import type { Domain } from '@/app/types/domains';

// Table names
const TAXONOMY_TABLE = 'tbld5CXEcljomMMQB';
const ACTIONS_TABLE = 'tblA0KRyRnM763cXy'; // Actions table (same as Signals/News)
const TRENDS_TABLE = 'tblZ683rmMtm6BkyL'; // Trends table

// Helper function to safely get numeric field
function getNumericField(record: any, fieldName: string): number | undefined {
  const value = getField<number | string>(record, fieldName);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

// Icon AI: Airtable can store URL string or attachment(s). Return first URL.
function getIconAiUrl(record: any): string | undefined {
  const val = getField(record, 'Icon AI') ?? getField(record, 'IconAI');
  if (typeof val === 'string' && val.startsWith('http')) return val;
  if (Array.isArray(val) && val.length > 0 && val[0]?.url) return val[0].url;
  if (val && typeof val === 'object' && val.url) return val.url;
  return undefined;
}

// Fetch all business domains from taxonomy table
export async function getAllDomains(): Promise<BusinessDomain[]> {
  try {
    const base = getBase();
    
    const records = await fetchWithRetry(() => 
      base(TAXONOMY_TABLE)
        .select({
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all()
    );
    
    return records.map(record => ({
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || undefined,
      status: getField(record, 'Status') || undefined,
      signalsMonth: getNumericField(record, 'Total Actions Month') ?? getNumericField(record, 'Signals (Month)') ?? getNumericField(record, 'SIGNALS (MONTH)') ?? undefined,
      signalsTotal: getNumericField(record, 'Total Actions') ?? getNumericField(record, 'Signals (Total)') ?? getNumericField(record, 'SIGNALS (TOTAL)') ?? undefined,
      signalsQuarter: getNumericField(record, 'Total Actions Quarter') ?? undefined,
      icon: getField(record, 'Icon') || undefined,
      iconUrl: getField(record, 'IconUrl') || undefined,
      iconAi: getIconAiUrl(record),
      imageUrl: getField(record, 'ImageUrl') || undefined,
      image: getField(record, 'Image') || undefined,
      colorCode: getField(record, 'ColorCode') || undefined,
      hierarchy: getField(record, 'Hierarchy') || undefined,
      keywords: getField(record, 'Keywords') || undefined,
    }));
  } catch (error) {
    console.error('Error fetching domains:', error);
    return [];
  }
}

// Fetch a single domain by ID
export async function getDomain(id: string): Promise<BusinessDomain | null> {
  try {
    const base = getBase();
    
    const record = await fetchWithRetry(() => base(TAXONOMY_TABLE).find(id));
    
    if (!record) {
      return null;
    }
    
    return {
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || undefined,
      status: getField(record, 'Status') || undefined,
      signalsMonth: getNumericField(record, 'Total Actions Month') ?? getNumericField(record, 'Signals (Month)') ?? getNumericField(record, 'SIGNALS (MONTH)') ?? undefined,
      signalsTotal: getNumericField(record, 'Total Actions') ?? getNumericField(record, 'Signals (Total)') ?? getNumericField(record, 'SIGNALS (TOTAL)') ?? undefined,
      signalsQuarter: getNumericField(record, 'Total Actions Quarter') ?? undefined,
      icon: getField(record, 'Icon') || undefined,
      iconUrl: getField(record, 'IconUrl') || undefined,
      iconAi: getIconAiUrl(record),
      imageUrl: getField(record, 'ImageUrl') || undefined,
      image: getField(record, 'Image') || undefined,
      colorCode: getField(record, 'ColorCode') || undefined,
      hierarchy: getField(record, 'Hierarchy') || undefined,
      keywords: getField(record, 'Keywords') || undefined,
    };
  } catch (error: any) {
    if (error.error === 'NOT_FOUND' || error.statusCode === 404) {
      console.warn(`Domain not found with ID: ${id}`);
      return null;
    }
    console.error('Error fetching domain:', error);
    return null;
  }
}

/** Build momentum sparkline from domain table columns: Total Actions Month, Total Actions Quarter, Total Actions */
function buildMomentumFromDomainFields(domain: BusinessDomain): MomentumDataPoint[] {
  const month = domain.signalsMonth ?? 0;
  const quarter = domain.signalsQuarter ?? 0;
  const total = domain.signalsTotal ?? 0;
  if (month === 0 && quarter === 0 && total === 0) return [];
  return [
    { period: "Month", count: month },
    { period: "Quarter", count: quarter },
    { period: "Total", count: total },
  ];
}

/** Fetch all domains with momentum; only returns Hierarchy === "Sub-Area" for list/sidepanel. */
export async function getDomainsWithMomentum(): Promise<DomainWithMomentum[]> {
  const domains = await getAllDomains();
  const subAreaOnly = domains.filter(d => (d.hierarchy || '').trim() === 'Sub-Area');
  return subAreaOnly.map(domain => ({
    ...domain,
    momentumData: buildMomentumFromDomainFields(domain),
  }));
}

// Get all domain IDs for static generation
export async function getDomainIds(): Promise<string[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
    const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    
    if (!apiKey || !baseId) {
      console.warn('Airtable credentials not available, returning empty array');
      return [];
    }

    const base = getBase();
    const records = await fetchWithRetry(() => 
      base(TAXONOMY_TABLE)
        .select({
          fields: [], // Only fetch the record ID, no other fields
          maxRecords: 200,
          pageSize: 50
        })
        .all()
    );
    
    console.log(`Successfully fetched ${records.length} domain IDs from Airtable`);
    
    return records.map(record => record.id);
  } catch (error) {
    console.error('Error fetching domain IDs:', error);
    return [];
  }
}

// Helper function to fetch linked records by IDs
async function fetchLinkedRecords(tableName: string, recordIds: string[]): Promise<any[]> {
  if (!recordIds || recordIds.length === 0) return [];
  
  try {
    const base = getBase();
    console.log(`Fetching ${recordIds.length} linked records from table ${tableName}`);
    
    const records = await Promise.all(
      recordIds.map((id, index) => 
        fetchWithRetry(() => base(tableName).find(id))
          .catch((error) => {
            console.error(`Failed to fetch record ${id} (${index + 1}/${recordIds.length}) from ${tableName}:`, error);
            return null;
          })
      )
    );
    
    const successfulRecords = records.filter(record => record !== null);
    console.log(`Successfully fetched ${successfulRecords.length} of ${recordIds.length} records from ${tableName}`);
    
    return successfulRecords;
  } catch (error: any) {
    console.error(`Error fetching linked records from ${tableName}:`, {
      error: error?.message || error?.toString() || error,
      tableName,
      recordCount: recordIds.length,
      firstFewIds: recordIds.slice(0, 5)
    });
    return [];
  }
}

// Helper function to map Action/Signal/News records to DomainContentItem
function mapActionToContentItem(record: any): DomainContentItem {
  // Determine content type based on record fields or default to "insight"
  let contentType: DomainContentItem["type"] = "insight";
  
  // Get signal type - column is called "Action Type"
  const signalType = getField<string>(record, 'Action Type') ||
                    getField<string>(record, 'action type') ||
                    getField<string>(record, 'ACTION TYPE') ||
                    getField<string>(record, 'Type') || 
                    getField<string>(record, 'Signal Type') ||
                    getField<string>(record, 'SignalType') ||
                    undefined;
  
  // Check if it's news (might have a Type field or be in News table)
  if (signalType && (signalType.toLowerCase().includes('news') || signalType.toLowerCase().includes('article'))) {
    contentType = "news";
  }
  
  // Try multiple variations of Headline field name
  const headline = getField<string>(record, 'Headline') || 
                   getField<string>(record, 'headline') ||
                   getField<string>(record, 'HEADLINE') ||
                   getField<string>(record, 'Headline/Title') ||
                   getField<string>(record, 'Title') ||
                   getField<string>(record, 'Name') ||
                   getField<string>(record, 'name') ||
                   getField<string>(record, 'NAME') ||
                   'Untitled';

  // Log if we're still getting Untitled to help debug
  if (headline === 'Untitled') {
    console.log('No headline found for record:', record.id, 'Available fields:', Object.keys(record.fields || {}));
  }

  return {
    id: record.id,
    type: contentType,
    title: headline,
    description: getField(record, 'Description') || undefined,
    url: getField(record, 'URL') || getField(record, 'Url') || getField(record, 'Link') || undefined,
    date: getField(record, 'Date') || getField(record, 'Created Time') || getField(record, 'Created') || undefined,
    source: getField(record, 'Source') || undefined,
    signalType: signalType,
    metadata: {
      keywords: getField(record, 'Keywords') || undefined,
      iconAi: getField(record, 'Icon AI') || getField(record, 'IconAI') || undefined,
    },
  };
}

// Fetch domain content organized by Now/New/Next
// For "Now" section: fetches Actions from (REL) Actions field, which contain linked Signals/News
export async function getDomainContent(domainId: string): Promise<DomainTabContent> {
  try {
    const base = getBase();
    
    // Get the domain record to access its (REL) Actions field
    const domainRecord = await fetchWithRetry(() => base(TAXONOMY_TABLE).find(domainId));
    
    // Get the (REL) Actions field - try different possible field names
    const actionsField = getField<string[]>(domainRecord, '(REL) Actions') || 
                        getField<string[]>(domainRecord, 'REL_Actions') ||
                        getField<string[]>(domainRecord, 'Actions') ||
                        getField<string[]>(domainRecord, 'REL Actions') ||
                        [];
    
    if (!actionsField || !Array.isArray(actionsField) || actionsField.length === 0) {
      console.log(`No Actions found for domain ${domainId}`);
      return {
        now: [],
        new: [],
        next: [],
      };
    }
    
    // Fetch Actions records - Actions table IS the Signals/News table
    const actionRecords = await fetchLinkedRecords(ACTIONS_TABLE, actionsField);
    
    if (actionRecords.length === 0) {
      console.log(`No Actions found for domain ${domainId} in table ${ACTIONS_TABLE}`);
      return {
        now: [],
        new: [],
        next: [],
      };
    }
    
    console.log(`Found ${actionRecords.length} actions/signals/news for domain ${domainId}`);
    
    // Log available fields from first record for debugging
    if (actionRecords.length > 0) {
      const firstRecord = actionRecords[0];
      const availableFields = firstRecord.fields ? Object.keys(firstRecord.fields) : 
                             (typeof firstRecord.get === 'function' ? 'Using record.get()' : 'Unknown structure');
      console.log('Sample record fields available:', availableFields);
      if (firstRecord.fields) {
        console.log('First record sample:', {
          id: firstRecord.id,
          fields: Object.keys(firstRecord.fields),
          headlineAttempt: getField<string>(firstRecord, 'Headline'),
          nameAttempt: getField<string>(firstRecord, 'Name'),
        });
      }
    }
    
    // Map Actions directly to content items (Actions = Signals/News)
    const nowContent: DomainContentItem[] = actionRecords.map(record => 
      mapActionToContentItem(record)
    );
    
    return {
      now: nowContent,
      new: [],
      next: [],
    };
  } catch (error: any) {
    console.error('Error fetching domain content:', error);
    // Log more details for debugging
    if (error.error) {
      console.error('Airtable error details:', error.error);
    }
    return {
      now: [],
      new: [],
      next: [],
    };
  }
}

// Fetch linked trends for a domain
// Returns both trends and all parent cluster IDs found in REL_Trends fields
export async function getDomainTrends(domainId: string): Promise<{ trends: Trend[]; parentClusterIds: string[] }> {
  try {
    const base = getBase();
    
    // Get the domain record to access its linked trends field
    const domainRecord = await fetchWithRetry(() => base(TAXONOMY_TABLE).find(domainId));
    if (!domainRecord) {
      return { trends: [], parentClusterIds: [] };
    }

    // Log available fields for debugging
    if (domainRecord.fields) {
      const availableFields = Object.keys(domainRecord.fields);
      console.log(`Available fields on domain ${domainId}:`, availableFields);
      console.log(`Looking for 'Trends' field. Available:`, availableFields.includes('Trends'));
      
      // Look for fields containing "Trend" (case insensitive)
      const trendFields = availableFields.filter(field => 
        field.toLowerCase().includes('trend')
      );
      console.log(`Fields containing 'trend':`, trendFields);
      
      // Log all field names that might be related
      trendFields.forEach(field => {
        console.log(`Field '${field}' value:`, domainRecord.fields[field]);
      });
      
      // Try direct access to see what we get
      if (domainRecord.fields['Trends']) {
        console.log(`Direct access to Trends field:`, domainRecord.fields['Trends']);
      }
    }
    
    // Get the linked trends field - the field is called "Trends/Trends"
    let trendsField: string[] = [];
    
    // Try the exact field name first: "Trends/Trends"
    trendsField = getField<string[]>(domainRecord, 'Trends/Trends') || [];
    
    // Fallback to other possible field names
    if (!trendsField || trendsField.length === 0) {
      trendsField = getField<string[]>(domainRecord, 'Trends') || [];
    }
    if (!trendsField || trendsField.length === 0) {
      trendsField = getField<string[]>(domainRecord, '(REL) Trends') || [];
    }
    if (!trendsField || trendsField.length === 0) {
      trendsField = getField<string[]>(domainRecord, 'REL_Trends') || [];
    }
    
    console.log(`Trends field value for domain ${domainId}:`, trendsField, `(count: ${trendsField?.length || 0})`);
    
    if (!trendsField || !Array.isArray(trendsField) || trendsField.length === 0) {
      console.log(`No Trends found for domain ${domainId}. Field value:`, trendsField);
      return { trends: [], parentClusterIds: [] };
    }
    
    // Fetch trend records
    console.log(`Fetching ${trendsField.length} trend records from table ${TRENDS_TABLE}`);
    const trendRecords = await fetchLinkedRecords(TRENDS_TABLE, trendsField);
    
    console.log(`Fetched ${trendRecords.length} trend records`);
    
    if (trendRecords.length === 0) {
      console.log(`No Trends found for domain ${domainId} in table ${TRENDS_TABLE}. Trend IDs were:`, trendsField);
      return { trends: [], parentClusterIds: [] };
    }
    
    console.log(`Successfully found ${trendRecords.length} trends for domain ${domainId}`);
    
    // Collect all unique parent cluster IDs from all trends' REL_Trends arrays
    const allParentClusterIds = new Set<string>();
    
    // Map trend records to Trend objects
    const trends = trendRecords.map(record => {
      const relTrendsField = getField<string[]>(record, 'REL_Trends');
      const taxonomyField = getField(record, 'REL_Taxonomy');
      
      // Collect ALL parent cluster IDs from REL_Trends (not just the first one)
      if (Array.isArray(relTrendsField)) {
        relTrendsField.forEach(clusterId => {
          if (clusterId && clusterId.trim() !== '') {
            allParentClusterIds.add(clusterId);
          }
        });
      }
      
      // Use REL_Trends for parent cluster relationship
      // REL_Trends is a linked record field pointing to parent clusters
      const clusterId = Array.isArray(relTrendsField) && relTrendsField.length > 0 ? relTrendsField[0] : '';
      const taxonomyId = Array.isArray(taxonomyField) && taxonomyField.length > 0 ? taxonomyField[0] : undefined;
      
      // Log for debugging
      if (!clusterId && relTrendsField) {
        console.log(`Trend ${record.id} has REL_Trends but no valid clusterId:`, relTrendsField);
      }
      if (clusterId) {
        console.log(`Trend ${record.id} (${getField(record, 'Name')}) -> Parent cluster: ${clusterId}`);
      }

      // Handle aliases field
      const aliasField = getField(record, 'Alias');
      let aliases: string[] = [];
      
      if (aliasField) {
        if (Array.isArray(aliasField)) {
          aliases = aliasField;
        } else if (typeof aliasField === 'string') {
          aliases = aliasField.split(',').map(alias => alias.trim()).filter(alias => alias.length > 0);
        }
      }

      return {
        id: record.id,
        name: String(getField(record, 'Name') ?? ''),
        description: String(getField(record, 'Description') ?? ''),
        imageUrl: String(getField(record, 'ImageUrl') ?? ''),
        image: (getField(record, 'Image') as Trend['image']) ?? [],
        clusterId,
        taxonomyId,
        domain: String(normalizeDomain(getField(record, 'Domain') ?? 'Technology')),
        universe: (String(getField(record, 'Universe') ?? 'General') as Trend['universe']),
        technologyReadinessLevel: parseInt(String(getField(record, 'TechnologyReadinessLevel') ?? '1'), 10) || 1,
        businessReadinessLevel: parseInt(String(getField(record, 'BusinessReadinessLevel') ?? '1'), 10) || 1,
        trendHorizon: (getField(record, 'TrendHorizon') || "2-5") as Trend['trendHorizon'],
        trendHorizonReasoning: String(getField(record, 'Trend Horizon Reasoning') ?? ''),
        trlReasoning: String(getField(record, 'TRL Reasoning') ?? ''),
        brlReasoning: String(getField(record, 'BRL Reasoning') ?? ''),
        aliases,
      };
    });
    
    console.log(`Collected ${allParentClusterIds.size} unique parent cluster IDs from ${trends.length} trends`);
    
    return {
      trends,
      parentClusterIds: Array.from(allParentClusterIds)
    };
  } catch (error: any) {
    console.error('Error fetching domain trends:', error);
    if (error.error) {
      console.error('Airtable error details:', error.error);
    }
    return { trends: [], parentClusterIds: [] };
  }
}
