import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Judge } from '@/models/index';
import bcrypt from 'bcryptjs';
import { verifyToken, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('jury_auth')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await dbConnect();
    const judge = await Judge.findById(payload.id);
    if (!judge) return NextResponse.json({ error: 'Judge not found' }, { status: 404 });

    const salt = await bcrypt.genSalt(10);
    judge.password = await bcrypt.hash(newPassword, salt);
    judge.requiresPasswordChange = false;
    await judge.save();

    // Issue new token with updated requiresPasswordChange = false
    const newToken = await signToken({
      id: judge._id.toString(),
      name: judge.name,
      role: judge.role,
      requiresPasswordChange: false
    });

    const resp = NextResponse.json({ success: true });
    resp.cookies.set('jury_auth', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return resp;
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
