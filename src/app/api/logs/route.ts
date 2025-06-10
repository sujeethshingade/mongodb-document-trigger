import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    const collection = url.searchParams.get('collection') || 'users'; // Default to users
    const operationType = url.searchParams.get('operationType');
    const changedFields = url.searchParams.get('changedFields');
    const updatedBy = url.searchParams.get('updatedBy');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const sortBy = url.searchParams.get('sortBy') || 'timestamp';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Determine which collection to query (new field-based logs or legacy logs)
    const useFieldLogs = url.searchParams.get('useFieldLogs') !== 'false'; // Default to true
    const logsCollectionName = useFieldLogs ? `${collection}_logs` : 'auditLogs';
    
    // Build filter
    const filter: Record<string, any> = {};
    
    if (documentId) {
      filter.documentId = documentId;
    }
    
    if (operationType) {
      filter.operationType = operationType;
    }
    
    if (useFieldLogs) {
      // For field-based logs
      if (changedFields) {
        filter.changedFields = new RegExp(changedFields, 'i'); // Case-insensitive search
      }
      
      if (updatedBy) {
        filter.updatedBy = new RegExp(updatedBy, 'i'); // Case-insensitive search
      }
    } else {
      // For legacy logs
      if (changedFields) {
        filter.changedFields = { $in: [changedFields] };
      }
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Get total count
    const total = await db.collection(logsCollectionName).countDocuments(filter);
    
    // Get logs
    const logs = await db
      .collection(logsCollectionName)
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      data: logs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit
      },
      collection: logsCollectionName,
      useFieldLogs
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}