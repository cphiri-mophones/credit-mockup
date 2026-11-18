import { createClient } from '@libsql/client';
import { createLibSQLSitepingStore, createSitepingSqliteTables } from '@siteping/adapter-drizzle/libsql';
import { createSitepingHandler, type SitepingAction } from '@siteping/server';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { isAdmin } from './_lib/admin.js';

const client = createClient({
  url: process.env.MAIN_JUICE_TURSO_DATABASE_URL!,
  authToken: process.env.MAIN_JUICE_TURSO_AUTH_TOKEN,
});
const db = drizzle(client);
const { sitepingFeedbacks, sitepingComments } = createSitepingSqliteTables();

const ADMIN_ACTIONS: ReadonlySet<SitepingAction> = new Set(['update', 'delete', 'deleteAll', 'deleteComment']);

interface Reviewer {
  admin: boolean;
  email: string;
}

// The widget sends the email the reviewer typed in. It is not verified: fine for an internal tool, not for a public one.
function reviewerEmail(request: Request) {
  return (request.headers.get('x-reviewer-email') ?? '').trim().toLowerCase();
}

// A list response asks about every feedback and reply it carries, so load the authors once per request.
const authorsByRequest = new WeakMap<Request, Promise<Map<string, string>>>();

function authorsOf(request: Request, projectName: string) {
  let authors = authorsByRequest.get(request);
  if (!authors) {
    authors = loadAuthors(projectName);
    authorsByRequest.set(request, authors);
  }
  return authors;
}

async function loadAuthors(projectName: string) {
  const feedbacks = await db
    .select({ id: sitepingFeedbacks.id, email: sitepingFeedbacks.authorEmail })
    .from(sitepingFeedbacks)
    .where(eq(sitepingFeedbacks.projectName, projectName));
  const comments = await db
    .select({ id: sitepingComments.id, email: sitepingComments.authorEmail })
    .from(sitepingComments)
    .innerJoin(sitepingFeedbacks, eq(sitepingComments.feedbackId, sitepingFeedbacks.id))
    .where(eq(sitepingFeedbacks.projectName, projectName));
  return new Map([...feedbacks, ...comments].map((r) => [r.id, r.email.trim().toLowerCase()]));
}

// Anyone with the link can read, pin and reply, and delete what they wrote; status changes are for admins.
export const { GET, POST, PATCH, DELETE, OPTIONS } = createSitepingHandler<Reviewer>({
  store: createLibSQLSitepingStore(db, { logger: console }),
  access: {
    authenticate: (request) => ({ admin: isAdmin(request), email: reviewerEmail(request) }),
    authorize: async ({ principal, action, request, projectName, feedbackId, commentId }) => {
      if (principal.admin) return true;
      if (!ADMIN_ACTIONS.has(action)) return true;
      const ownId = action === 'delete' ? feedbackId : action === 'deleteComment' ? commentId : undefined;
      if (!ownId || !principal.email) return false;
      return (await authorsOf(request, projectName)).get(ownId) === principal.email;
    },
    canReadAuthorEmail: (principal) => principal.admin,
  },
});
