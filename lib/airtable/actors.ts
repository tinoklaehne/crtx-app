import { getBase, getField, fetchWithRetry } from './utils';
import type { Actor } from '@/app/types/actors';
import type { DomainContentItem } from '@/app/types/domainContent';
import type { AirtableAttachment } from '@/app/types/airtable';

// Icon AI: Airtable can store URL string or attachment(s). Return first URL.
function getIconAiUrl(record: any): string | undefined {
  const val = getField(record, 'Icon AI') ?? getField(record, 'IconAI');
  if (typeof val === 'string' && val.startsWith('http')) return val;
  if (Array.isArray(val) && val.length > 0) {
    const first = val[0] as { url?: string } | null;
    if (first?.url) return first.url;
  }
  if (val && typeof val === 'object' && 'url' in val && typeof (val as { url: string }).url === 'string') {
    return (val as { url: string }).url;
  }
  return undefined;
}

const ACTORS_TABLE = 'tblFiHksu7YbAFvQw';
const ACTORLISTS_TABLE = 'tblk1fsb6Gr5DoN9v';
const ACTIONS_TABLE = 'tblA0KRyRnM763cXy'; // Actions table (same as Signals/News)

export async function getAllActors(): Promise<Actor[]> {
  const base = getBase();
  const records = await fetchWithRetry(
    () =>
      base(ACTORS_TABLE)
        .select({ sort: [{ field: 'Name', direction: 'asc' }] })
        .all(),
    3,
    4000
  );
  return records.map((record) => ({
    id: record.id,
    name: getField<string>(record, 'Name') ?? '',
    description: getField<string>(record, 'Description') ?? undefined,
    typeMain: getField<string>(record, 'Type_Main') ?? undefined,
    geography: getField<string>(record, 'Geography') ?? undefined,
    actorListIds: (getField<string[]>(record, 'REL Actorslists') ?? []).filter(Boolean),
    hqCity: getField<string>(record, 'HQ City') ?? undefined,
    website: getField<string>(record, 'Website') ?? undefined,
    yearFounded: getField<string | number>(record, 'Year Founded') ?? undefined,
    keywords: getField<string | string[]>(record, 'Keywords') ?? undefined,
    competitors: getField<string | string[]>(record, 'Competitors') ?? undefined,
    actionIds: (getField<string[]>(record, '(REL) Actions') ?? []).filter(Boolean),
    logo: getField<string>(record, 'Logo') ?? getField<string>(record, 'logo') ?? undefined,
    iconAi: getIconAiUrl(record),
    iconUrl: getField<string>(record, 'IconUrl') ?? getField<string>(record, 'Icon URL') ?? undefined,
  }));
}

export async function getActor(id: string): Promise<Actor | null> {
  try {
    const base = getBase();
    const record = await fetchWithRetry(() => base(ACTORS_TABLE).find(id));
    if (!record) return null;
    return {
      id: record.id,
      name: getField<string>(record, 'Name') ?? '',
      description: getField<string>(record, 'Description') ?? undefined,
      typeMain: getField<string>(record, 'Type_Main') ?? undefined,
      geography: getField<string>(record, 'Geography') ?? undefined,
      actorListIds: (getField<string[]>(record, 'REL Actorslists') ?? []).filter(Boolean),
      hqCity: getField<string>(record, 'HQ City') ?? undefined,
      website: getField<string>(record, 'Website') ?? undefined,
      yearFounded: getField<string | number>(record, 'Year Founded') ?? undefined,
      keywords: getField<string | string[]>(record, 'Keywords') ?? undefined,
      competitors: getField<string | string[]>(record, 'Competitors') ?? undefined,
      actionIds: (getField<string[]>(record, '(REL) Actions') ?? []).filter(Boolean),
      logo: getField<string>(record, 'Logo') ?? getField<string>(record, 'logo') ?? undefined,
      iconAi: getIconAiUrl(record),
      iconUrl: getField<string>(record, 'IconUrl') ?? getField<string>(record, 'Icon URL') ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching actor:', error);
    return null;
  }
}

/** Fetch records by ID in batches using OR(RECORD_ID()=...) to avoid N+1 API calls. */
async function fetchRecordsByIds(tableName: string, recordIds: string[], batchSize = 12): Promise<any[]> {
  if (!recordIds || recordIds.length === 0) return [];
  const base = getBase();
  const unique = Array.from(new Set(recordIds));
  const idToRecord = new Map<string, any>();

  for (let i = 0; i < unique.length; i += batchSize) {
    if (i > 0) await new Promise((r) => setTimeout(r, 150));
    const batch = unique.slice(i, i + batchSize);
    const formula = batch.map((id) => `RECORD_ID()='${id.replace(/'/g, "\\'")}'`).join(',');
    try {
      const records = await fetchWithRetry(() =>
        base(tableName)
          .select({ filterByFormula: `OR(${formula})`, pageSize: batchSize })
          .all()
      );
      for (const rec of records) {
        idToRecord.set(rec.id, rec);
      }
    } catch (err) {
      for (const id of batch) {
        try {
          const rec = await fetchWithRetry(() => base(tableName).find(id));
          if (rec) idToRecord.set(rec.id, rec);
        } catch {
          // skip failed single record
        }
      }
    }
  }

  return recordIds.map((id) => idToRecord.get(id)).filter(Boolean);
}

/** Maps Action/Signal/News records to DomainContentItem format. */
function mapActionToContentItem(record: any): DomainContentItem {
  const signalType =
    getField<string>(record, 'Action Type') ??
    getField<string>(record, 'action type') ??
    getField<string>(record, 'ACTION TYPE') ??
    getField<string>(record, 'Type') ??
    getField<string>(record, 'Signal Type') ??
    getField<string>(record, 'SignalType') ??
    undefined;

  const headline =
    getField<string>(record, 'Headline') ??
    getField<string>(record, 'headline') ??
    getField<string>(record, 'HEADLINE') ??
    getField<string>(record, 'Headline/Title') ??
    getField<string>(record, 'Title') ??
    getField<string>(record, 'Name') ??
    getField<string>(record, 'name') ??
    getField<string>(record, 'NAME') ??
    'Untitled';

  // Extract domain information - actions link to domains via "(REL) Sub-Area" field
  // Try multiple field name variations
  const domainField = 
    getField<string | string[]>(record, '(REL) Sub-Area') ??
    getField<string | string[]>(record, 'REL Sub-Area') ??
    getField<string | string[]>(record, 'Sub-Area') ??
    getField<string | string[]>(record, 'Domain') ??
    getField<string | string[]>(record, 'REL Domain') ??
    getField<string | string[]>(record, '(REL) Domain') ??
    getField<string | string[]>(record, 'REL_Domain') ??
    undefined;
  const domainId = Array.isArray(domainField) ? domainField[0] : domainField;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && !domainId && record.id) {
    const availableFields = Object.keys(record.fields || {});
    const subAreaFields = availableFields.filter(f => 
      f.toLowerCase().includes('sub-area') || 
      f.toLowerCase().includes('domain')
    );
    if (subAreaFields.length > 0) {
      console.log(`Action ${record.id}: Found potential domain fields:`, subAreaFields);
    }
  }

  return {
    id: record.id,
    type: signalType?.toLowerCase().includes('news') || signalType?.toLowerCase().includes('article') ? 'news' : 'insight',
    title: headline,
    description: getField(record, 'Description') ?? undefined,
    url: getField(record, 'URL') ?? getField(record, 'Url') ?? getField(record, 'Link') ?? undefined,
    date: getField(record, 'Date') ?? getField(record, 'Created Time') ?? getField(record, 'Created') ?? undefined,
    source: getField(record, 'Source') ?? undefined,
    signalType: signalType,
    metadata: {
      keywords: getField(record, 'Keywords') ?? undefined,
      iconAi: getField(record, 'Icon AI') ?? getField(record, 'IconAI') ?? undefined,
      domainId: domainId,
    },
  };
}

/** Fetches actions/signals for an actor from the "(REL) Actions" field. */
export async function getActorActions(actorId: string): Promise<DomainContentItem[]> {
  try {
    const base = getBase();
    const actorRecord = await fetchWithRetry(() => base(ACTORS_TABLE).find(actorId));
    if (!actorRecord) return [];

    const actionsField =
      getField<string[]>(actorRecord, '(REL) Actions') ??
      getField<string[]>(actorRecord, 'REL_Actions') ??
      getField<string[]>(actorRecord, 'Actions') ??
      getField<string[]>(actorRecord, 'REL Actions') ??
      [];

    if (!actionsField || !Array.isArray(actionsField) || actionsField.length === 0) {
      return [];
    }

    const actionRecords = await fetchRecordsByIds(ACTIONS_TABLE, actionsField);
    return actionRecords.map(mapActionToContentItem);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch actor actions:', error);
    }
    return [];
  }
}

/** Get unique domain IDs for multiple actors (for table display).
 * Fetches actions in batches to get domain information efficiently. */
export async function getActorsDomains(actorIds: string[]): Promise<Record<string, string[]>> {
  const actorToDomains: Record<string, string[]> = {};
  if (!actorIds || actorIds.length === 0) return actorToDomains;

  try {
    const base = getBase();
    // Fetch all actor records to get their action IDs
    const actorRecords = await fetchRecordsByIds(ACTORS_TABLE, actorIds);
    
    // Collect all action IDs
    const allActionIds = new Set<string>();
    const actorActionMap = new Map<string, string[]>();
    
    actorRecords.forEach(actorRecord => {
      const actionIds = (getField<string[]>(actorRecord, '(REL) Actions') ?? 
                        getField<string[]>(actorRecord, 'REL_Actions') ?? 
                        getField<string[]>(actorRecord, 'Actions') ?? 
                        getField<string[]>(actorRecord, 'REL Actions') ?? 
                        []).filter(Boolean);
      actorActionMap.set(actorRecord.id, actionIds);
      actionIds.forEach(id => allActionIds.add(id));
    });

    // Fetch all actions in batches
    const actionRecords = await fetchRecordsByIds(ACTIONS_TABLE, Array.from(allActionIds));
    
    // Build action ID to domain ID map
    const actionToDomain = new Map<string, string>();
    actionRecords.forEach(actionRecord => {
      const domainField = 
        getField<string | string[]>(actionRecord, '(REL) Sub-Area') ??
        getField<string | string[]>(actionRecord, 'REL Sub-Area') ??
        getField<string | string[]>(actionRecord, 'Sub-Area') ??
        undefined;
      const domainId = Array.isArray(domainField) ? domainField[0] : domainField;
      if (domainId) {
        actionToDomain.set(actionRecord.id, domainId);
      }
    });

    // Build actor to domains map
    actorActionMap.forEach((actionIds, actorId) => {
      const domainIds = new Set<string>();
      actionIds.forEach(actionId => {
        const domainId = actionToDomain.get(actionId);
        if (domainId) domainIds.add(domainId);
      });
      actorToDomains[actorId] = Array.from(domainIds);
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch actors domains:', error);
    }
  }

  return actorToDomains;
}

/** Actorlists table: column used for the watchlist label (must match Airtable exactly). */
const ACTORLIST_LIST_NAME_FIELD = 'List Name';

/** Fetches id → name for all Actorlists (watchlists). Uses the "List Name" column. */
export async function getActorlistNames(): Promise<Record<string, string>> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(
      () =>
        base(ACTORLISTS_TABLE)
          .select({ fields: [ACTORLIST_LIST_NAME_FIELD] })
          .all(),
      3,
      4000
    );
    const map: Record<string, string> = {};
    records.forEach((record) => {
      const name = getField<string>(record, ACTORLIST_LIST_NAME_FIELD);
      map[record.id] = name ?? record.id;
    });
    return map;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to fetch actorlist names:', error);
    }
    return {};
  }
}
