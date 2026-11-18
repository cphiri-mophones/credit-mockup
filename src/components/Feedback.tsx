import { useSiteping } from '@siteping/widget/react';

// The mockup routes by hash, but SitePing scopes pins by pathname. Use the hash route as the page instead.
function pageScope() {
  const [route = '', sub = ''] = window.location.hash.replace(/^#\/?/, '').split('/');
  const page = `/${route || 'queue'}`;
  return { url: sub ? `${page}/${sub}` : page, urlPattern: sub ? `${page}/:tab` : null };
}

export function Feedback() {
  useSiteping({
    endpoint: '/api/siteping',
    projectName: 'credit-review-mockup',
    position: 'bottom-left',
    accentColor: '#4338ca',
    forceShow: true,
    readOnly: true,
    getPageScope: pageScope,
  });
  return null;
}
