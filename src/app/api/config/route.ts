import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Config } from '@/models/index';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const config = await Config.findOne({ key: 'deadline' });
    return NextResponse.json({ deadline: config?.value || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('jury_auth')?.value;
    const payload = token ? await verifyToken(token) : null;
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { deadline } = await request.json();
    await dbConnect();
    
    await Config.findOneAndUpdate(
      { key: 'deadline' },
      { value: deadline ? new Date(deadline) : null },
      { upsert: true }
    );
     
    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
