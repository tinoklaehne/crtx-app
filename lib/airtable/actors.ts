import { getBase, getField, fetchWithRetry } from './utils';
import type { Actor } from '@/app/types/actors';

const ACTORS_TABLE = 'tblFiHksu7YbAFvQw';

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
    };
  } catch (error) {
    console.error('Error fetching actor:', error);
    return null;
  }
}
