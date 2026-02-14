import Airtable from 'airtable';

// Centralized retry mechanism with exponential backoff
export async function fetchWithRetry<T>(operation: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // Robust error extraction (Airtable can throw null or odd shapes)
      let errorMessage =
        (typeof error?.error === 'string' && error.error) ||
        (typeof error?.message === 'string' && error.message) ||
        (typeof error?.toString === 'function' && error.toString()) ||
        (error != null && typeof error === 'object' && JSON.stringify(error)) ||
        '';
      if (errorMessage === 'null' || errorMessage === '{}' || !errorMessage) {
        errorMessage = 'Airtable request failed (network or server error)';
      }
      const statusCode = error?.statusCode ?? error?.status ?? 'unknown';
      const errorType = error?.error ?? error?.type ?? 'unknown';

      // Log full error details for debugging (avoid logging huge payloads)
      console.error(`Airtable request failed (attempt ${attempt + 1}/${retries}):`, errorMessage, {
        statusCode,
        errorType,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
      });
      
      if (attempt === retries - 1) {
        const finalError = new Error(`Airtable request failed after ${retries} attempts: ${errorMessage}`);
        (finalError as any).originalError = error;
        (finalError as any).statusCode = statusCode;
        throw finalError;
      }

      // Exponential backoff with jitter; longer base for rate limits
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('All retries failed');
}

// Mock Airtable base for when credentials are missing
function createMockBase() {
  const mockTable = (tableName: string) => ({
    select: () => ({
      all: () => {
        console.warn(`Mock Airtable: select().all() called on table ${tableName}`);
        return Promise.resolve([]);
      }
    }),
    find: (id: string) => {
      console.warn(`Mock Airtable: find(${id}) called on table ${tableName}`);
      return Promise.resolve(null);
    },
    create: (fields: any) => {
      console.warn(`Mock Airtable: create() called on table ${tableName}`);
      return Promise.resolve(null);
    },
    update: (id: string, fields: any) => {
      console.warn(`Mock Airtable: update(${id}) called on table ${tableName}`);
      return Promise.resolve(null);
    },
    destroy: (id: string) => {
      console.warn(`Mock Airtable: destroy(${id}) called on table ${tableName}`);
      return Promise.resolve(null);
    }
  });

  return mockTable;
}

export function getBase() {
  const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
  const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
  
  if (!apiKey || !baseId) {
    console.error('Airtable configuration missing:', { 
      hasApiKey: !!apiKey, 
      hasBaseId: !!baseId,
      nodeEnv: process.env.NODE_ENV
    });
    console.error('Returning mock Airtable base. Please configure NEXT_PUBLIC_AIRTABLE_API_KEY and NEXT_PUBLIC_AIRTABLE_BASE_ID environment variables.');
    return createMockBase();
  }

  console.log('Initializing Airtable base with configuration');
  return new Airtable({ 
    apiKey,
    requestTimeout: 60000,
    endpointUrl: 'https://api.airtable.com'
  }).base(baseId);
}

export function getField<T>(record: any, field: string): T | null {
  try {
    // Try record.get() first (standard Airtable API)
    if (typeof record.get === 'function') {
      const value = record.get(field);
      if (value !== undefined && value !== null) {
        return value as T;
      }
    }
    // Fallback to direct field access
    if (record.fields && record.fields[field] !== undefined) {
      return record.fields[field] as T;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function normalizeDomain(domain: string): string {
  return domain || 'Technology';
}
