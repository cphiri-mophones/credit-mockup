import { createSitepingSqliteTables } from '@siteping/adapter-drizzle/libsql';

export const { sitepingFeedbacks, sitepingAnnotations, sitepingComments } = createSitepingSqliteTables();
