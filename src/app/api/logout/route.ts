import { NextResponse } from 'next/server';

export async function POST() {
  const resp = NextResponse.json({ success: true });
  resp.cookies.delete('jury_auth');
  return resp;
}
