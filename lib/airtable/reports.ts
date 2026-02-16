import { getBase, getField, fetchWithRetry } from './utils';
import type { Report } from '@/app/types/reports';
import type { AirtableAttachment } from '@/app/types/airtable';

const REPORTS_TABLE = 'tbldruSIrVtQiipCM';

// Get PDF file URL from File attachment field
function getFileUrl(record: any): string | undefined {
  const val = getField<AirtableAttachment[] | string>(record, 'File');
  if (typeof val === 'string' && val.startsWith('http')) return val;
  if (Array.isArray(val) && val.length > 0) {
    const first = val[0] as AirtableAttachment | null;
    if (first?.url) return first.url;
  }
  if (val && typeof val === 'object' && 'url' in val && typeof (val as { url: string }).url === 'string') {
    return (val as { url: string }).url;
  }
  return undefined;
}

export async function getAllReports(): Promise<Report[]> {
  try {
    const base = getBase();
    const records = await fetchWithRetry(
      () =>
        base(REPORTS_TABLE)
          .select({ sort: [{ field: 'Name', direction: 'asc' }] })
          .all(),
      3,
      4000
    );
    return records.map((record) => ({
      id: record.id,
      name: getField<string>(record, 'Name') ?? '',
      source: getField<string>(record, 'Source') ?? undefined,
      subAreaIds: (getField<string[]>(record, '(REL) Sub-Area') ?? []).filter(Boolean),
      fileUrl: getFileUrl(record),
      summary: getField<string>(record, '-->AI/Summary') ?? undefined,
      keyInsights: getField<string | string[]>(record, 'Key Insights') ?? undefined,
      keywords: getField<string | string[]>(record, 'Keywords') ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function getReport(id: string): Promise<Report | null> {
  try {
    const base = getBase();
    const record = await fetchWithRetry(() => base(REPORTS_TABLE).find(id));
    if (!record) return null;
    return {
      id: record.id,
      name: getField<string>(record, 'Name') ?? '',
      source: getField<string>(record, 'Source') ?? undefined,
      subAreaIds: (getField<string[]>(record, '(REL) Sub-Area') ?? []).filter(Boolean),
      fileUrl: getFileUrl(record),
      summary: getField<string>(record, '-->AI/Summary') ?? undefined,
      keyInsights: getField<string | string[]>(record, 'Key Insights') ?? undefined,
      keywords: getField<string | string[]>(record, 'Keywords') ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}
