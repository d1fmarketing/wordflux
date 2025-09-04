import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get the response
  const response = NextResponse.next()
  
  // For HTML requests, set no-cache headers
  if (request.headers.get('accept')?.includes('text/html')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  }
  
  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}