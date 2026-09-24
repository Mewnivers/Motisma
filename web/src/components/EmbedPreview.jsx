// Aperçu fidèle d'un modèle d'embed configuré (ex. l'annonce /rdv), tel qu'il
// est publié sur Discord. Les variables ({lieu}, {heure_debut}…) sont remplies
// avec des valeurs d'exemple. Réutilise le rendu markdown du dashboard et les
// styles .discord-* déjà présents.
import { useEffect, useRef, useState } from 'react';
import { apiGet } from '../api.js';
import { renderMarkdown } from './dashboard/markdown.jsx';

// Discord affiche les emojis Unicode via Twemoji : on charge la lib et on
// remplace les emojis du rendu par les mêmes images (chargée une seule fois).
let twemojiPromise = null;
function loadTwemoji() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.twemoji) return Promise.resolve(window.twemoji);
  if (!twemojiPromise) {
    twemojiPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve(window.twemoji || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return twemojiPromise;
}

// Valeurs d'exemple pour une sortie fictive. `<@=Nom>` = mention (rendue en bleu).
const SAMPLE = {
  organisateur: '<@=RedAsh>',
  lieu: 'Parc Beaumont',
  heure_debut: '15h00',
  heure_fin: '15h45',
  description: '',
  fermeture: 'demain à 00h00',
  participants: '6',
};
const sub = (s) =>
  typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, k) => (k in SAMPLE ? SAMPLE[k] : m)) : s;
const intToHex = (n) => (n == null ? '#5b86f7' : `#${Number(n).toString(16).padStart(6, '0')}`);
const dc = (s) => (s || '').trim();

/** Rend une ligne de texte avec blockquotes `> ` + markdown (comme Discord). */
function RichText({ text }) {
  const lines = (text || '').split('\n');
  const out = [];
  let quote = [];
  const flush = (k) => {
    if (!quote.length) return;
    out.push(
      <blockquote key={`q${k}`} className="discord-quote">
        {renderMarkdown(quote.join('\n'))}
      </blockquote>,
    );
    quote = [];
  };
  lines.forEach((line, i) => {
    if (line.startsWith('> ')) quote.push(line.slice(2));
    else {
      flush(i);
      out.push(
        <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
          {renderMarkdown(line)}
          {'\n'}
        </span>,
      );
    }
  });
  flush('end');
  return <>{out}</>;
}

function Fields({ fields }) {
  const list = (fields || []).filter((f) => dc(f.name) && dc(f.value));
  if (!list.length) return null;
  return (
    <div className="discord-embed-fields">
      {list.map((f, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className={`discord-embed-field${f.inline ? ' inline' : ''}`}>
          <div className="discord-embed-field-name">{renderMarkdown(sub(dc(f.name)))}</div>
          <div className="discord-embed-field-value">
            <RichText text={sub(f.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}

const BTN = { Primary: 'primary', Secondary: 'secondary', Success: 'success', Danger: 'danger' };

export default function EmbedPreview({ embedKey = 'rdv_annonce', botAvatar = '/motisma.png', botName = 'Motisma’Pau' }) {
  const [row, setRow] = useState(null); // null = chargement, false = erreur
  const ref = useRef(null);

  useEffect(() => {
    let live = true;
    apiGet(`/api/embeds/${embedKey}`)
      .then((r) => live && setRow(r))
      .catch(() => live && setRow(false));
    return () => {
      live = false;
    };
  }, [embedKey]);

  // Une fois l'embed rendu, remplace les emojis Unicode par leurs images Twemoji.
  useEffect(() => {
    if (!row || row === false || !ref.current) return;
    loadTwemoji().then((tw) => {
      if (tw && ref.current) {
        tw.parse(ref.current, {
          base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/',
          folder: 'svg',
          ext: '.svg',
          className: 'emoji',
        });
      }
    });
  }, [row]);

  if (row === null) return <div className="discord-msg discord-msg-skel" aria-hidden="true" />;
  if (row === false) return null;

  const mode = row.mode || 'embed';
  const content = sub(row.content);
  const showContent = mode !== 'embed' && dc(content);
  const showEmbed = mode !== 'simple';
  const color = intToHex(row.color);
  const buttons = Object.values(row.buttons || {}).filter((b) => b && b.label);

  return (
    <div className="discord-msg" ref={ref}>
      <img className="discord-avatar-img" src={botAvatar} alt="" width="40" height="40" />
      <div className="discord-body">
        <div className="discord-author">
          {botName} <span className="discord-bot">BOT</span>
        </div>
        {showContent && <div className="discord-text">{renderMarkdown(content)}</div>}
        {showEmbed && (
          <div className="discord-embed" style={{ borderLeftColor: color }}>
            <div className="discord-embed-main">
              {dc(row.title) && <div className="discord-embed-title">{renderMarkdown(sub(row.title))}</div>}
              {dc(row.description) && (
                <div className="discord-embed-desc">
                  <RichText text={sub(row.description)} />
                </div>
              )}
              <Fields fields={row.fields} />
              {dc(row.footer_text) && <div className="discord-embed-footer">{sub(row.footer_text)}</div>}
            </div>
          </div>
        )}
        {buttons.length > 0 && (
          <div className="discord-buttons">
            {buttons.map((b, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={i} className={`discord-btn btn-${BTN[b.style] || 'secondary'}`}>
                {b.emoji && <span className="discord-btn-emoji">{renderMarkdown(b.emoji)}</span>}
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
