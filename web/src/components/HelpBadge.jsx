import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DISCORD_INVITE, GITHUB_URL } from '../config.js';

export default function HelpBadge() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="help-badge" ref={ref}>
      {open && (
        <div className="help-menu" role="menu">
          <Link to="/terms" className="help-item" onClick={() => setOpen(false)}>
            Conditions d'utilisation
          </Link>
          <Link to="/privacy" className="help-item" onClick={() => setOpen(false)}>
            Politique de confidentialité
          </Link>
          <div className="help-sep" />
          <a className="help-item" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
            Rejoindre le Discord
          </a>
          <a className="help-item" href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      )}
      <button
        type="button"
        className="help-toggle"
        aria-label="Aide et informations"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
    </div>
  );
}
