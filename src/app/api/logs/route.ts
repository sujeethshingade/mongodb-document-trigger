import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    const collection = params.collection;
    const useFieldLogs = params.useFieldLogs !== 'false';
    const logsCollectionName = `${collection}_logs`;
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    
    const filter: any = {};
    if (params.documentId) filter.documentId = new RegExp(params.documentId, 'i');
    if (params.operationType) filter.operationType = params.operationType;
    if (params.changedFields) filter.changedFields = useFieldLogs ? new RegExp(params.changedFields, 'i') : { $in: [params.changedFields] };
    
    const db = (await clientPromise).db('test'); // Change the database name as needed
    const logs = await db.collection(logsCollectionName).find(filter).sort({ [params.sortBy || 'timestamp']: sortOrder }).toArray();;
        
    return NextResponse.json({
      data: logs,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}