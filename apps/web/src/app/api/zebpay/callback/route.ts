import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    // In a real implementation, you would exchange the code for a token here
    // or forward it to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Forward the callback to the backend
    const response = await fetch(`${backendUrl}/zebpay/callback?code=${code}&state=${state}`);
    const data = await response.json();

    // Redirect the user back to the application (e.g., profile or wallet)
    // with a success flag or token
    const redirectUrl = new URL('/profile?zebpay=success', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error handling Zebpay callback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
