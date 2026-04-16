import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Judge } from '@/models/index';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let { name, password } = await request.json();
    
    if (!name || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    name = name.trim(); // Prevent whitespace issues
    password = password.trim(); 

    await dbConnect();
    
    // Case insensitive regex search to prevent typos
    const judge = await Judge.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (!judge) {
      return NextResponse.json({ error: 'Invalid name or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, judge.password || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid name or password' }, { status: 401 });
    }

    const token = await signToken({
      id: judge._id.toString(),
      name: judge.name,
      role: judge.role,
      requiresPasswordChange: judge.requiresPasswordChange
    });

    const resp = NextResponse.json({ success: true, requiresPasswordChange: judge.requiresPasswordChange });
    resp.cookies.set('jury_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return resp;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
