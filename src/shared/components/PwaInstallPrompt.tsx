export function PwaInstallPrompt() {
  // The in-app install card was intentionally removed after mobile dismissal
  // regressions. PWA manifest, service worker, browser menu install, update
  // prompt, and offline banner remain active.
  return null;
}
