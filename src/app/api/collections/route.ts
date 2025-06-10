import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    // Filter out collections that end with '_logs' and system collections
    const filteredCollections = collections
      .filter(col => 
        !col.name.endsWith('_logs') && 
        !col.name.startsWith('system.') &&
        col.name !== 'auditLogs' // Also exclude the legacy audit logs collection
      )
      .map(col => ({
        value: col.name,
        label: col.name.charAt(0).toUpperCase() + col.name.slice(1), // Capitalize first letter
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

    return NextResponse.json({
      collections: filteredCollections
    });
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch collections',
      message: error instanceof Error ? error.message : 'Unknown error',
      collections: []
    }, { status: 500 });
  }
}
