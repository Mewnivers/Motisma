// web/src/components/dashboard/markdown.jsx
// Rend le sous-ensemble de markdown Discord utilisé dans les aperçus.

function Emoji({ id, name, animated }) {
  const ext = animated ? 'gif' : 'png';
  return (
    <img
      className="discord-emoji"
      src={`https://cdn.discordapp.com/emojis/${id}.${ext}`}
      alt={name}
      draggable={false}
    />
  );
}

// Rend le texte tel quel, en remplaçant seulement les emojis custom
// `<:nom:id>` / `<a:nom:id>` par leur image. Le reste (markdown, sauts de
// ligne, espaces) est laissé littéral — c'est la vue « au repos » de l'éditeur.
const EMOJI_RE = /<(a)?:(\w+):(\d+)>/g;
export function renderEmojiText(text) {
  const s = text || '';
  const out = [];
  let last = 0;
  let key = 0;
  let m;
  EMOJI_RE.lastIndex = 0;
  while ((m = EMOJI_RE.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(<Emoji key={key++} animated={m[1] === 'a'} name={m[2]} id={m[3]} />);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function renderMarkdown(text) {
  const rules = [
    [/<(a)?:(\w+):(\d+)>/, 'emoji'],
    // Mentions : <@id> / <@!id> (Discord) et <@=Nom> (aperçu avec un nom lisible).
    [/<@[!=]?([\w-]+)>/, 'mention'],
    [/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/, 'link'],
    [/\*\*([\s\S]+?)\*\*/, 'strong'],
    [/__([\s\S]+?)__/, 'u'],
    [/~~([\s\S]+?)~~/, 's'],
    [/\*([\s\S]+?)\*/, 'em'],
    [/_([\s\S]+?)_/, 'em'],
    [/`([\s\S]+?)`/, 'code'],
  ];
  let counter = 0;
  function walk(str) {
    if (!str) return [];
    let best = null;
    for (const [re, tag] of rules) {
      const m = re.exec(str);
      if (m && (!best || m.index < best.m.index)) best = { m, tag };
    }
    if (!best) return [str];
    const { m, tag } = best;
    const out = [];
    if (m.index > 0) out.push(str.slice(0, m.index));
    if (tag === 'emoji') {
      out.push(<Emoji key={counter++} animated={m[1] === 'a'} name={m[2]} id={m[3]} />);
    } else if (tag === 'mention') {
      const name = /^\d+$/.test(m[1]) ? 'membre' : m[1];
      out.push(
        <span key={counter++} className="discord-mention">
          @{name}
        </span>,
      );
    } else if (tag === 'link') {
      out.push(
        <a key={counter++} className="discord-link" href={m[2]} target="_blank" rel="noreferrer">
          {m[1]}
        </a>,
      );
    } else {
      const Tag = tag;
      out.push(<Tag key={counter++}>{walk(m[1])}</Tag>);
    }
    out.push(...walk(str.slice(m.index + m[0].length)));
    return out;
  }
  return walk(text || '');
}
