// web/src/components/dashboard/EmojiField.jsx
// Champ texte de l'éditeur d'embed. Au repos, il affiche les emojis custom en
// image ; dès qu'on clique dedans, il repasse en <input>/<textarea> classique
// (code brut) pour l'édition — on garde ainsi le comportement du curseur et
// l'insertion d'emoji au point d'insertion, déjà en place.
import { useLayoutEffect, useRef, useState } from 'react';
import { renderEmojiText } from './markdown.jsx';

export default function EmojiField({
  value,
  onChange, // reçoit l'événement (comme un input natif)
  onFocus, // reçoit l'événement (l'éditeur y mémorise le champ actif)
  multiline = false,
  rows = 2,
  className = 'dash-input',
  placeholder = '',
  maxLength,
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  // À l'entrée en édition : focus le champ et place le curseur à la fin.
  useLayoutEffect(() => {
    if (!editing || !ref.current) return;
    const el = ref.current;
    el.focus();
    try {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    } catch {
      // certains types d'input n'exposent pas setSelectionRange → sans effet.
    }
  }, [editing]);

  if (editing) {
    const common = {
      ref,
      className,
      value,
      onChange,
      onFocus,
      onBlur: () => setEditing(false),
      placeholder,
      maxLength,
    };
    return multiline ? <textarea {...common} rows={rows} /> : <input {...common} />;
  }

  const enter = (e) => {
    e.preventDefault(); // évite une sélection parasite avant le focus programmé
    setEditing(true);
  };
  return (
    <div
      className={`${className} emoji-view${multiline ? ' emoji-view-multi' : ''}`}
      style={multiline ? { minHeight: `${(rows * 1.5).toFixed(1)}em` } : undefined}
      role="textbox"
      tabIndex={0}
      onMouseDown={enter}
      onFocus={() => setEditing(true)}
    >
      {value ? renderEmojiText(value) : <span className="emoji-view-ph">{placeholder}</span>}
    </div>
  );
}
