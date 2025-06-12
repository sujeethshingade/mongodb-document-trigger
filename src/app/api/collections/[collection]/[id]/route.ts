import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request, { params }: { params: { collection: string; id: string } }) {
  try {
    const { collection, id } = params; // Extract collection and id from params
    
    // Validate collection name and document ID from test database
    if (!COLLECTION_NAME_REGEX.test(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = (await clientPromise).db('test'); // Change the database name as needed
    const document = await db.collection(collection).findOne({ _id: new ObjectId(id) }); // Fetch document by ID
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ data: document, collection });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { collection: string; id: string } }) {
  try {
    const { collection, id } = params;
    const updateData = await request.json(); // Parse the request body for update data

    // Validate collection name and document ID from test database
    if (!COLLECTION_NAME_REGEX.test(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = (await clientPromise).db('test'); // Change the database name as needed

    // Validate required fields for users collections
    if (collection === 'users') {
      const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (!updateData.name || !updateData.email) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
      }
      if (!EMAIL_REGEX.test(updateData.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      const duplicateEmail = await db.collection('users').findOne({
        _id: { $ne: new ObjectId(id) },
        email: updateData.email
      });
      if (duplicateEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }

    delete updateData._id; // Prevent updating the _id field
    updateData.updatedAt = new Date();

    // Clean up undefined or null fields from updateData
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Update the document in the specified collection
    const result = await db.collection(collection).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result, collection });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { collection: string; id: string } }) {
  try {
    const { collection, id } = params; // Extract collection and id from params

    // Validate collection name and document ID from test database
    if (!COLLECTION_NAME_REGEX.test(collection)) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const db = (await clientPromise).db('test'); // Change the database name as needed
    const result = await db.collection(collection).findOneAndDelete({ _id: new ObjectId(id) }); // Delete document by ID

    if (!result) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Document deleted successfully', data: result, collection });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
