import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('test'); 
    const auditLogs = await db
      .collection('auditLogs')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();
    
    const response = NextResponse.json(auditLogs);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ message: 'Failed to fetch audit logs' }, { status: 500 });
  }
}