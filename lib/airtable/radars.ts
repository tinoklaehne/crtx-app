// Removed 'use server' directive for static export compatibility

import Airtable from 'airtable';
import { getBase, getField, fetchWithRetry } from './utils';
import type { Radar } from '@/app/types/radars';

const RADARS_TABLE = 'tbltJj6hqqNdbcJjT';

export async function getRadar(id: string): Promise<Radar | null> {
  try {
    console.log(`Fetching radar with ID: ${id}`);
    const base = getBase();
    
    let record;
    try {
      record = await fetchWithRetry(() => base(RADARS_TABLE).find(id));
    } catch (airtableError: any) {
      if (airtableError.error === 'NOT_FOUND' || airtableError.statusCode === 404) {
        console.warn(`Radar record not found with ID: ${id}`);
        return null;
      }
      throw airtableError;
    }
    
    if (!record) {
      console.warn(`No radar found with ID: ${id}`);
      return null;
    }

    console.log(`Successfully fetched radar: ${getField(record, 'Name')}`);
    return {
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || '',
      type: getField(record, 'Type') || 'General',
      level: getField(record, 'Level') || 'Micro',
      cluster: getField(record, 'Cluster') || 'Parent',
      totalTrends: getField(record, 'Total Trends') || 0,
      lastModified: getField(record, 'Last Modified') || new Date().toISOString(),
      trends: getField(record, 'REL_Trends') || [],
    };
  } catch (error) {
    console.error('Error fetching radar:', error);
    return null;
  }
}

export async function getAllRadars(): Promise<Radar[]> {
  try {
    // Check if we're in a build environment without proper credentials
    const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
    const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    
    if (!apiKey || !baseId) {
      console.warn('Airtable credentials not available, returning empty array');
      return [];
    }

    const base = getBase();
    const records = await fetchWithRetry(() => 
      base(RADARS_TABLE)
        .select({
          maxRecords: 200,
          pageSize: 50
        })
        .all()
    );
    
    console.log(`Successfully fetched ${records.length} radars from Airtable`);
    
    return records.map(record => ({
      id: record.id,
      name: getField(record, 'Name') || '',
      description: getField(record, 'Description') || '',
      type: getField(record, 'Type') || 'General',
      level: getField(record, 'Level') || 'Micro',
      cluster: getField(record, 'Cluster') || 'Parent',
      totalTrends: getField(record, 'Total Trends') || 0,
      lastModified: getField(record, 'Last Modified') || new Date().toISOString(),
      trends: getField(record, 'REL_Trends') || [],
    }));
  } catch (error) {
    console.error('Error fetching radars:', error);
    // Return empty array instead of throwing to prevent build failures
    return [];
  }
}

export async function getRadarIds(): Promise<string[]> {
  try {
    // Check if we're in a build environment without proper credentials
    const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
    const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    
    if (!apiKey || !baseId) {
      console.warn('Airtable credentials not available, returning empty array');
      return [];
    }

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
    
    console.log(`Successfully fetched ${records.length} radar IDs from Airtable`);
    
    return records.map(record => record.id);
  } catch (error) {
    console.error('Error fetching radar IDs:', error);
    // Return empty array instead of throwing to prevent build failures
    return [];
  }
}