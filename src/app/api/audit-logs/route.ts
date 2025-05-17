import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    
    const filter: Record<string, any> = {};
    if (documentId) {
      filter.documentId = documentId;
    }
    
    const query = db.collection('auditLogs').find(filter);
    const total = await db.collection('auditLogs').countDocuments(filter);
    
    const auditLogs = await query
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const response = NextResponse.json({
      data: auditLogs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit
      }
    });
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}