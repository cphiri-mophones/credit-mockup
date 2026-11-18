import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'siteping_admin';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sameSecret(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// The cookie holds a value derived from the key, never the key itself.
function sessionToken(key: string) {
  return createHmac('sha256', key).update('siteping-admin-session').digest('hex');
}

export function isAdminKey(value: string) {
  const key = process.env.SITEPING_API_KEY;
  return !!key && sameSecret(value, key);
}

// Admin by session cookie (the dashboard) or by bearer key (scripts, curl).
export function isAdmin(request: Request) {
  const key = process.env.SITEPING_API_KEY;
  if (!key) return false;
  const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (bearer) return sameSecret(bearer, key);
  const cookie = (request.headers.get('cookie') ?? '')
    .split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return cookie !== undefined && sameSecret(cookie, sessionToken(key));
}

export function sessionCookie(signedIn: boolean) {
  const value = signedIn ? sessionToken(process.env.SITEPING_API_KEY!) : '';
  return `${COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${signedIn ? MAX_AGE_SECONDS : 0}`;
}
