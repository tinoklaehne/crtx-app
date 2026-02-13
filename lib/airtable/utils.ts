import Airtable from 'airtable';

// Centralized retry mechanism with exponential backoff
export async function fetchWithRetry<T>(operation: () => Promise<T>, retries = 10, baseDelay = 5000): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Airtable request failed (attempt ${attempt + 1}/${retries}), retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
  return record.get(field) || null;
}

export function normalizeDomain(domain: string): string {
  return domain || 'Technology';
}