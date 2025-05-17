import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ 
        error: 'Invalid ID', 
        message: 'The provided ID is not in a valid format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('test'); 
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not Found', 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ 
        error: 'Invalid ID', 
        message: 'The provided ID is not in a valid format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('test');
    
    const existingUser = await db.collection('users').findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!existingUser) {
      return NextResponse.json({ 
        error: 'Not Found', 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    const userData = await request.json();
    
    if (!userData.name || !userData.email) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        message: 'Name and email are required fields' 
      }, { status: 400 });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        message: 'Invalid email format' 
      }, { status: 400 });
    }
    
    const duplicateEmail = await db.collection('users').findOne({
      _id: { $ne: new ObjectId(params.id) },
      email: userData.email
    });
    
    if (duplicateEmail) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        message: 'A different user with this email already exists' 
      }, { status: 409 });
    }
    
    userData.updatedAt = new Date();
    
    if (userData._id) {
      delete userData._id;
    }
    
    if (!userData.role) {
      userData.role = null;
    }
    
    if (!userData.Address) {
      userData.Address = {
        AddressLine1: null,
        AddressLine2: null,
        City: null,
        State: null,
        Country: null,
        ZipCode: null
      };
    } else {
      const addressFields = ['AddressLine1', 'AddressLine2', 'City', 'State', 'Country', 'ZipCode'];
      addressFields.forEach(field => {
        if (!userData.Address[field]) {
          userData.Address[field] = null;
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      _id: params.id,
      ...userData 
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ 
        error: 'Invalid ID', 
        message: 'The provided ID is not in a valid format' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('test'); 
    
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(params.id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: 'Not Found', 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}