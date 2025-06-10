import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('test');

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const sortField = url.searchParams.get('sortField') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const total = await db.collection('users').countDocuments({});
    
    const users = await db
      .collection('users')
      .find({})
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('test'); 

    const userData = await request.json();
    
    if (!userData.name || !userData.email) {
      return NextResponse.json({ 
        error: 'Validation error',
        message: 'Name and email are required fields' 
      }, { status: 400 });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json({ 
        error: 'Validation error',
        message: 'Invalid email format' 
      }, { status: 400 });
    }
    
    const existingUser = await db.collection('users').findOne({ email: userData.email });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Validation error',
        message: 'A user with this email already exists' 
      }, { status: 409 });
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

    const result = await db.collection('users').insertOne(userData);

    return NextResponse.json(
      { _id: result.insertedId, ...userData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}