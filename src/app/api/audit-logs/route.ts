import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('test'); 
    const auditLogs = await db
      .collection('auditLogs')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();
    
    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ message: 'Failed to fetch audit logs' }, { status: 500 });
  }
}