import { NextResponse } from 'next/server';
import { getOrCreateToken } from '../../../lib/csrf';
import crypto from 'crypto';

export async function GET(req) {
  try {
    const token = getOrCreateToken(req);
    
    // Set session cookie if not present
    const response = NextResponse.json({ token });
    
    if (!req.cookies.get('sessionId')) {
      const sessionId = crypto.randomUUID();
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400 * 30 // 30 days
      });
    }
    
    return response;
  } catch (err) {
    console.error('CSRF token generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}