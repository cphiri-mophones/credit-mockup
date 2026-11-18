import { isAdmin, isAdminKey, sessionCookie } from './_lib/admin.js';

export function GET(request: Request) {
  return Response.json({ admin: isAdmin(request) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const key = body && typeof body === 'object' && 'key' in body ? body.key : null;
  if (typeof key !== 'string' || !isAdminKey(key)) return Response.json({ error: 'That key is not right.' }, { status: 401 });
  return Response.json({ admin: true }, { headers: { 'Set-Cookie': sessionCookie(true) } });
}

export function DELETE() {
  return Response.json({ admin: false }, { headers: { 'Set-Cookie': sessionCookie(false) } });
}
