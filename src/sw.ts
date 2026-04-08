/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Take control immediately
self.skipWaiting();
clientsClaim();

// Precache all assets injected by Vite PWA (App Shell)
precacheAndRoute(self.__WB_MANIFEST);

// SPA fallback: any navigation request goes to index.html to prevent white screen
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  // Allowlist/Denylist could be configured here, but default is good for SPA
  allowlist: [/^(?!\/?api).*/],
});
registerRoute(navigationRoute);

// Runtime caching for Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
      }),
    ],
  })
);

// Runtime caching for Supabase GET requests (to allow read-only offline)
registerRoute(
  ({ request, url }) => url.href.includes('.supabase.co') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);
