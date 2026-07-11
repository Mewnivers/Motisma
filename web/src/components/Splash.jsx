import { useEffect, useState } from 'react';

// Electric bolts radiating outward — the final "thunderbolt" flash.
function Zaps() {
  return (
    <svg className="zaps" viewBox="0 0 180 180" aria-hidden="true">
      <g
        fill="none"
        stroke="#ffe24d"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M90 70 L82 38 L96 44 L84 6" />
        <path d="M74 80 L40 64 L52 56 L18 44" />
        <path d="M106 80 L140 64 L128 56 L162 44" />
        <path d="M76 102 L44 112 L56 120 L26 134" />
        <path d="M104 102 L136 112 L124 120 L154 134" />
      </g>
    </svg>
  );
}

const SEEN_KEY = 'pogo_splash_seen';

// Has the splash already played this browser session? (survives reloads, resets
// when the tab/window is closed.) Wrapped because storage can throw in private mode.
function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Splash() {
  // show -> hide (fade) -> gone (unmounted). Skip straight to "gone" if the
  // splash already played once this session.
  const [phase, setPhase] = useState(() => (alreadySeen() ? 'gone' : 'show'));

  useEffect(() => {
    // Runs once on mount. If the splash already played this session, do nothing.
    if (phase === 'gone') return undefined;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore storage errors */
    }
    const hide = setTimeout(() => setPhase('hide'), 2700);
    const gone = setTimeout(() => setPhase('gone'), 3250);
    return () => {
      clearTimeout(hide);
      clearTimeout(gone);
    };
    // Mount-once: `phase` here is the initial value; later transitions must not re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className={`splash${phase === 'hide' ? ' splash-out' : ''}`} aria-hidden="true">
      <div className="poke-stage">
        <div className="pokeball" />
        <div className="pika-hop">
          <img className="pika-img" src="/pikachu.png" alt="" width="120" height="120" />
        </div>
        <Zaps />
        <div className="zap-flash" />
      </div>
      <p className="splash-text">Chargement…</p>
    </div>
  );
}
