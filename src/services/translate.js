// Translation through the Claude API (Anthropic), used by the "Traduire"
// message context-menu command. Plain fetch, no SDK. The key comes from the
// ANTHROPIC_API_KEY environment variable.

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const LANGUAGES = { fr: 'français', en: 'anglais', es: 'espagnol' };
const LABELS = { fr: 'Français', en: 'Anglais', es: 'Espagnol' };
const MODEL = 'claude-haiku-5-5';
const ALREADY = '===DEJA===';

/** Discord locale → target language code. FR, EN, ES; anything else is FR. */
export function targetLanguage(locale) {
  const code = String(locale ?? '').slice(0, 2);
  return code in LANGUAGES ? code : 'fr';
}

/** Buttons to translate a message into the languages other than `lang`. */
export function otherLanguageButtons(lang, channelId, messageId) {
  return new ActionRowBuilder().addComponents(
    Object.keys(LANGUAGES)
      .filter((code) => code !== lang)
      .map((code) =>
        new ButtonBuilder()
          .setCustomId(`traduire:${code}:${channelId}:${messageId}`)
          .setLabel(LABELS[code])
          .setStyle(ButtonStyle.Secondary),
      ),
  );
}

/**
 * Translate `text` into `lang` ('fr' | 'en' | 'es'). Resolves to null when the
 * text is already in that language. Throws on any failure.
 */
export async function translate(text, lang) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY manquante');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system:
        `Traduis le message de l'utilisateur en ${LANGUAGES[lang]}. ` +
        'Réponds uniquement par la traduction, sans commentaire. ' +
        `Si le message est déjà en ${LANGUAGES[lang]}, réponds exactement ${ALREADY} et rien d'autre.`,
      messages: [{ role: 'user', content: text }],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`API Anthropic : HTTP ${res.status}`);
  const body = await res.json();
  const out = body.content?.find((b) => b.type === 'text')?.text?.trim();
  if (!out) throw new Error('API Anthropic : réponse vide');
  return out === ALREADY ? null : out;
}
