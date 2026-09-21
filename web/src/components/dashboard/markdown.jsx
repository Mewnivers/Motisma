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

export function renderMarkdown(text) {
  const rules = [
    [/<(a)?:(\w+):(\d+)>/, 'emoji'],
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
