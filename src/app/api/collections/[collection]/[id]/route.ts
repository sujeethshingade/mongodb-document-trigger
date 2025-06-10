import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { collection: string; id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const { collection, id } = params;

    // Validate collection name
    if (!/^[a-zA-Z0-9_]+$/.test(collection)) {
      return NextResponse.json({ 
        error: 'Invalid collection name',
        message: 'Collection name can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: 'Invalid document ID',
        message: 'Document ID must be a valid ObjectId'
      }, { status: 400 });
    }

    const document = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    
    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found',
        message: `Document with ID '${id}' not found in collection '${collection}'`
      }, { status: 404 });
    }

    return NextResponse.json({
      data: document,
      collection
    });
  } catch (error) {
    console.error(`Failed to fetch document ${params.id} from collection ${params.collection}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch document',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { collection: string; id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const { collection, id } = params;
    const updateData = await request.json();

    // Validate collection name
    if (!/^[a-zA-Z0-9_]+$/.test(collection)) {
      return NextResponse.json({ 
        error: 'Invalid collection name',
        message: 'Collection name can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: 'Invalid document ID',
        message: 'Document ID must be a valid ObjectId'
      }, { status: 400 });
    }

    // Collection-specific validation
    if (collection === 'users') {
      // Check if document exists first
      const existingUser = await db.collection('users').findOne({
        _id: new ObjectId(id)
      });
      
      if (!existingUser) {
        return NextResponse.json({ 
          error: 'Not Found', 
          message: 'User not found' 
        }, { status: 404 });
      }

      // Validate required fields for users
      if (!updateData.name || !updateData.email) {
        return NextResponse.json({ 
          error: 'Validation Error', 
          message: 'Name and email are required fields' 
        }, { status: 400 });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({ 
          error: 'Validation Error', 
          message: 'Invalid email format' 
        }, { status: 400 });
      }
      
      // Check for duplicate email (excluding current user)
      const duplicateEmail = await db.collection('users').findOne({
        _id: { $ne: new ObjectId(id) },
        email: updateData.email
      });
      
      if (duplicateEmail) {
        return NextResponse.json({ 
          error: 'Validation Error', 
          message: 'A different user with this email already exists' 
        }, { status: 409 });
      }
    }

    // Remove _id from update data if present
    delete updateData._id;
    
    // Add/update timestamp
    updateData.updatedAt = new Date();

    // Remove undefined/null fields to avoid unnecessary audit logs
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    const result = await db.collection(collection).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ 
        error: 'Document not found',
        message: `Document with ID '${id}' not found in collection '${collection}'`
      }, { status: 404 });
    }

    return NextResponse.json({
      data: result,
      collection
    });
  } catch (error) {
    console.error(`Failed to update document ${params.id} in collection ${params.collection}:`, error);
    return NextResponse.json({ 
      error: 'Failed to update document',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { collection: string; id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const { collection, id } = params;

    // Validate collection name
    if (!/^[a-zA-Z0-9_]+$/.test(collection)) {
      return NextResponse.json({ 
        error: 'Invalid collection name',
        message: 'Collection name can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: 'Invalid document ID',
        message: 'Document ID must be a valid ObjectId'
      }, { status: 400 });
    }

    const result = await db.collection(collection).findOneAndDelete({ _id: new ObjectId(id) });

    if (!result) {
      return NextResponse.json({ 
        error: 'Document not found',
        message: `Document with ID '${id}' not found in collection '${collection}'`
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Document deleted successfully',
      data: result,
      collection
    });
  } catch (error) {
    console.error(`Failed to delete document ${params.id} from collection ${params.collection}:`, error);
    return NextResponse.json({ 
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
