import { getBase, getField, fetchWithRetry } from './utils';
import type { Actor } from '@/app/types/actors';

const ACTORS_TABLE = 'tblFiHksu7YbAFvQw';
const ACTORLISTS_TABLE = 'tblk1fsb6Gr5DoN9v';

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
    };
  } catch (error) {
    console.error('Error fetching actor:', error);
    return null;
  }
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
