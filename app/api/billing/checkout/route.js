import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req){
  try {
    const { email } = await req.json();
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Derive origin from request URL to prevent open redirect
    const origin = new URL(req.url).origin;
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ 
        price: process.env.STRIPE_PRICE_ID_PRO || 'price_default',
        quantity: 1 
      }],
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancel`,
    });
    
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}