import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request, { params }: { params: { collection: string } }) {
  try {
    const { collection } = params;
    if (!COLLECTION_NAME_REGEX.test(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    const url = new URL(request.url);
    const sortField = url.searchParams.get('sortField') || '_id';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const db = (await clientPromise).db('test'); // Change the database name as needed
    const collections = await db.listCollections({ name: collection }).toArray();
    if (collections.length === 0) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const documents = await db.collection(collection).find({}).sort({ [sortField]: sortOrder }).toArray();

    return NextResponse.json({
      data: documents,
      collection
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { collection: string } }) {
  try {
    const { collection } = params;
    if (!COLLECTION_NAME_REGEX.test(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }
    
    const documentData = await request.json();
    const db = (await clientPromise).db('test'); // Change the database name as needed
    
    // Validate required fields for users collections
    if (collection === 'users') {
      if (!documentData.name || !documentData.email) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
      }
      if (!EMAIL_REGEX.test(documentData.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      const existingUser = await db.collection('users').findOne({ email: documentData.email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }
    
    const now = new Date();

    Object.keys(documentData).forEach(key => {
      if (documentData[key] === undefined || documentData[key] === null) {
        delete documentData[key];
      }
    });

    const result = await db.collection(collection).insertOne(documentData);
    return NextResponse.json({ _id: result.insertedId, ...documentData }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
