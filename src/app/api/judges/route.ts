import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Judge } from '@/models/index';

export async function GET() {
  try {
    await dbConnect();
    const judges = await Judge.find({}).sort({ name: 1 });
    // Map _id to id for frontend compatibility
    const mapped = judges.map(j => ({ id: j._id, name: j.name }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching judges:', error);
    return NextResponse.json({ error: 'Failed to fetch judges' }, { status: 500 });
  }
}
