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

// Get Source Logo URL from Source Logo field (can be URL string or attachment)
function getSourceLogoUrl(record: any): string | undefined {
  const val = getField<AirtableAttachment[] | string>(record, 'Source Logo');
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
          .select({ sort: [{ field: "Name", direction: "asc" }] })
          .all(),
      3,
      4000
    );
    return records.map((record) => {
      const created = getField<string | Date>(record, "Created") ?? undefined;
      const createdAt =
        created instanceof Date
          ? created.toISOString()
          : typeof created === "string"
          ? created
          : undefined;

      return {
        id: record.id,
        name: getField<string>(record, "Name") ?? "",
        source: getField<string>(record, "Source") ?? undefined,
        sourceLogo: getSourceLogoUrl(record),
        subAreaIds:
          (getField<string[]>(record, "(REL) Sub-Area") ?? []).filter(Boolean),
        fileUrl: getFileUrl(record),
        summary: getField<string>(record, "-->AI/Summary") ?? undefined,
        transcript: getField<string>(record, "-->AI/Transcript") ?? undefined,
        year: getField<string | number>(record, "Year") ?? undefined,
        createdAt,
        keyInsights:
          getField<string | string[]>(record, "Key Insights") ?? undefined,
        keywords:
          getField<string | string[]>(record, "Keywords") ?? undefined,
      };
    });
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
    const created = getField<string | Date>(record, "Created") ?? undefined;
    const createdAt =
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
        ? created
        : undefined;

    return {
      id: record.id,
      name: getField<string>(record, "Name") ?? "",
      source: getField<string>(record, "Source") ?? undefined,
      sourceLogo: getSourceLogoUrl(record),
      subAreaIds:
        (getField<string[]>(record, "(REL) Sub-Area") ?? []).filter(Boolean),
      fileUrl: getFileUrl(record),
      summary: getField<string>(record, "-->AI/Summary") ?? undefined,
      transcript: getField<string>(record, "-->AI/Transcript") ?? undefined,
      year: getField<string | number>(record, "Year") ?? undefined,
      createdAt,
      keyInsights:
        getField<string | string[]>(record, "Key Insights") ?? undefined,
      keywords:
        getField<string | string[]>(record, "Keywords") ?? undefined,
    };
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

/** Get reports linked to a specific domain via (REL) Sub-Area field */
export async function getReportsByDomain(domainId: string): Promise<Report[]> {
  try {
    const base = getBase();
    // Fetch all reports and filter by domainId in JavaScript
    // This is more reliable than Airtable formula for linked records
    const records = await fetchWithRetry(
      () =>
        base(REPORTS_TABLE)
          .select({
            sort: [{ field: 'Year', direction: 'desc' }, { field: 'Name', direction: 'asc' }],
          })
          .all(),
      3,
      4000
    );
    
    const allReports = records.map((record) => ({
      id: record.id,
      name: getField<string>(record, 'Name') ?? '',
      source: getField<string>(record, 'Source') ?? undefined,
      sourceLogo: getSourceLogoUrl(record),
      subAreaIds: (getField<string[]>(record, '(REL) Sub-Area') ?? []).filter(Boolean),
      fileUrl: getFileUrl(record),
      summary: getField<string>(record, '-->AI/Summary') ?? undefined,
      transcript: getField<string>(record, '-->AI/Transcript') ?? undefined,
      year: getField<string | number>(record, 'Year') ?? undefined,
      keyInsights: getField<string | string[]>(record, 'Key Insights') ?? undefined,
      keywords: getField<string | string[]>(record, 'Keywords') ?? undefined,
    }));

    // Filter reports where subAreaIds includes the domainId
    return allReports.filter(report => 
      (report.subAreaIds ?? []).includes(domainId)
    );
  } catch (error) {
    console.error('Error fetching reports by domain:', error);
    return [];
  }
}
