import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('test');

    const users = await db
      .collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('test'); 

    const userData = await request.json();
    
    userData.createdAt = new Date();
    userData.updatedAt = new Date();

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

    const result = await db.collection('users').insertOne(userData);

    return NextResponse.json(
      { _id: result.insertedId, ...userData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}