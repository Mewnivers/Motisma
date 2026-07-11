// Auto-reload when a new build is deployed. The app knows its own build id
// (__BUILD_ID__, injected by Vite) and polls /version.json (cache-busted). When
// the deployed id differs, it reloads once — so changes appear without a manual
// refresh. A sessionStorage guard prevents reload loops if index.html is served
// stale (e.g. before the nginx no-cache header is in place).

const CURRENT = __BUILD_ID__;
const GUARD = 'pogo_reload_for';

async function check() {
  try {
    const res = await fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const { id } = await res.json();
    if (!id) return;
    if (id !== CURRENT) {
      if (sessionStorage.getItem(GUARD) === id) return; // already attempted for this build
      sessionStorage.setItem(GUARD, id);
      window.location.reload();
    } else {
      sessionStorage.removeItem(GUARD);
    }
  } catch {
    /* offline or version.json missing (dev) — ignore */
  }
}

export function startVersionCheck(intervalMs = 15000) {
  check();
  setInterval(check, intervalMs);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
