import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = (await clientPromise).db('test'); // Change the database name as needed
    const collections = await db.listCollections().toArray();
    
    const filteredCollections = collections
      .filter(col => !col.name.endsWith('_logs') && !col.name.startsWith('system.'))
      .map(col => ({
        value: col.name,
        label: col.name.charAt(0).toUpperCase() + col.name.slice(1),
      }));

    return NextResponse.json({ collections: filteredCollections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch collections', collections: [] }, { status: 500 });
  }
}
