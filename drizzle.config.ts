import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',
  schema: './server/schema.ts',
  dbCredentials: {
    url: process.env.MAIN_JUICE_TURSO_DATABASE_URL!,
    authToken: process.env.MAIN_JUICE_TURSO_AUTH_TOKEN,
  },
});
