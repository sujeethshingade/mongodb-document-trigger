import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get a single user by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db();

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

// Update a user
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db();

        const userData = await request.json();
        
        // Add updated timestamp
        userData.updatedAt = new Date();
        
        // Remove _id if it exists to prevent MongoDB errors
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

// Delete a user
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db();

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