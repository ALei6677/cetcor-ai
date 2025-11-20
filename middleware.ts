import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PAYPAL_CSP = [
  "default-src 'self';",
  "base-uri 'self';",
  "object-src 'none';",
  "script-src 'self' 'unsafe-eval' https://www.paypal.com https://www.paypalobjects.com https://*.paypal.com https://*.paypalobjects.com;",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
  "img-src 'self' data: blob: https://www.paypal.com https://www.paypalobjects.com https://*.paypal.com https://*.paypalobjects.com;",
  "font-src 'self' data: https://fonts.gstatic.com;",
  "connect-src 'self' https://www.paypal.com https://api-m.paypal.com https://*.paypal.com https://*.paypalobjects.com https://*.supabase.co https://*.supabase.in https://ark.cn-beijing.volces.com https://*.bytepluses.com;",
  "frame-src 'self' https://www.paypal.com https://*.paypal.com;",
  "form-action 'self' https://www.paypal.com https://*.paypal.com;",
  "worker-src 'self';",
].join(' ');

export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', PAYPAL_CSP);
  return response;
}

export const config = {
  matcher: ['/checkout', '/checkout/:path*'],
};

