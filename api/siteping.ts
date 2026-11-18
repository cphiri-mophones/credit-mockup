import { createClient } from '@libsql/client';
import { createLibSQLSitepingStore } from '@siteping/adapter-drizzle/libsql';
import { createSitepingHandler } from '@siteping/server';
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({
  url: process.env.MAIN_JUICE_TURSO_DATABASE_URL!,
  authToken: process.env.MAIN_JUICE_TURSO_AUTH_TOKEN,
});

export const { GET, POST, PATCH, DELETE, OPTIONS } = createSitepingHandler({
  store: createLibSQLSitepingStore(drizzle(client), { logger: console }),
  apiKey: process.env.SITEPING_API_KEY,
  // Anyone with the link can read, pin and reply; resolving and deleting need the key.
  publicEndpoints: ['GET', 'POST', 'OPTIONS'],
});
