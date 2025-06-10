import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { collection: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const { collection } = params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const sortField = url.searchParams.get('sortField') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Validate collection name to prevent injection
    if (!/^[a-zA-Z0-9_]+$/.test(collection)) {
      return NextResponse.json({ 
        error: 'Invalid collection name',
        message: 'Collection name can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }

    // Check if collection exists
    const collections = await db.listCollections({ name: collection }).toArray();
    if (collections.length === 0) {
      return NextResponse.json({ 
        error: 'Collection not found',
        message: `Collection '${collection}' does not exist`
      }, { status: 404 });
    }

    const total = await db.collection(collection).countDocuments({});
    
    const documents = await db
      .collection(collection)
      .find({})
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data: documents,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit
      },
      collection
    });
  } catch (error) {
    console.error(`Failed to fetch documents from collection ${params.collection}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { collection: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const { collection } = params;
    const documentData = await request.json();
    
    // Validate collection name
    if (!/^[a-zA-Z0-9_]+$/.test(collection)) {
      return NextResponse.json({ 
        error: 'Invalid collection name',
        message: 'Collection name can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }
    
    // Collection-specific validation
    if (collection === 'users') {
      // Validate required fields for users
      if (!documentData.name || !documentData.email) {
        return NextResponse.json({ 
          error: 'Validation error',
          message: 'Name and email are required fields' 
        }, { status: 400 });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(documentData.email)) {
        return NextResponse.json({ 
          error: 'Validation error',
          message: 'Invalid email format' 
        }, { status: 400 });
      }
      
      // Check for duplicate email
      const existingUser = await db.collection('users').findOne({ email: documentData.email });
      if (existingUser) {
        return NextResponse.json({ 
          error: 'Validation error',
          message: 'A user with this email already exists' 
        }, { status: 409 });
      }
    }
    
    // Add timestamps if they don't exist
    const now = new Date();
    if (!documentData.createdAt) {
      documentData.createdAt = now;
    }
    if (!documentData.updatedAt) {
      documentData.updatedAt = now;
    }

    // Remove undefined/null fields to avoid unnecessary audit logs
    Object.keys(documentData).forEach(key => {
      if (documentData[key] === undefined || documentData[key] === null) {
        delete documentData[key];
      }
    });

    const result = await db.collection(collection).insertOne(documentData);

    return NextResponse.json(
      { _id: result.insertedId, ...documentData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error(`Failed to create document in collection ${params.collection}:`, error);
    return NextResponse.json({ 
      error: 'Failed to create document',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
