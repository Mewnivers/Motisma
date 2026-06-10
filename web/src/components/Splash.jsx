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

export default function Splash() {
  // show -> hide (fade) -> gone (unmounted)
  const [phase, setPhase] = useState('show');

  useEffect(() => {
    const hide = setTimeout(() => setPhase('hide'), 2700);
    const gone = setTimeout(() => setPhase('gone'), 3250);
    return () => {
      clearTimeout(hide);
      clearTimeout(gone);
    };
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
