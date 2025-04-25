import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('test'); 
    
    const user = await db.collection('users').findOne({
      _id: new ObjectId(params.id)
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('test');
    
    const userData = await request.json();
    userData.updatedAt = new Date();
    
    if (userData._id) {
      delete userData._id;
    }
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: userData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      _id: params.id,
      ...userData 
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('test'); 
    
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(params.id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}