import { useSiteping } from '@siteping/widget/react';

export const FEEDBACK_PROJECT = 'credit-review-mockup';

// The mockup routes by hash, but SitePing scopes pins by pathname. Use the hash route as the page instead.
function pageScope() {
  const [route = '', sub = ''] = window.location.hash.replace(/^#\/?/, '').split('/');
  const page = `/${route || 'queue'}`;
  return { url: sub ? `${page}/${sub}` : page, urlPattern: sub ? `${page}/:tab` : null };
}

// The widget keeps the name and email the reviewer typed under this key. The server uses the email to let people delete their own comments.
function reviewerHeaders(): Record<string, string> {
  try {
    const identity: unknown = JSON.parse(localStorage.getItem('siteping_identity') ?? 'null');
    const email = identity && typeof identity === 'object' && 'email' in identity ? identity.email : null;
    return typeof email === 'string' && email ? { 'X-Reviewer-Email': email } : {};
  } catch {
    return {};
  }
}

export function Feedback() {
  useSiteping({
    endpoint: '/api/siteping',
    headers: reviewerHeaders,
    projectName: FEEDBACK_PROJECT,
    accentColor: '#4338ca',
    forceShow: true,
    deepLink: true,
    getPageScope: pageScope,
  });
  return null;
}
