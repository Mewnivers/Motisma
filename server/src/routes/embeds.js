import { config } from '../config.js';
import { getInfoEmbeds } from '../db.js';

// Modèles d'embed exposés publiquement (lecture seule) pour l'aperçu sur le site.
const PUBLIC_KEYS = new Set(['rdv_annonce']);

export async function embedsRoutes(app) {
  app.get('/api/embeds/:key', async (request, reply) => {
    const key = String(request.params.key || '');
    if (!PUBLIC_KEYS.has(key)) return reply.code(404).send({ error: 'unknown_embed' });
    if (!config.guildId) return reply.code(503).send({ error: 'unavailable' });

    // getInfoEmbeds sème les défauts puis renvoie toutes les lignes.
    const rows = await getInfoEmbeds(config.guildId).catch(() => []);
    const row = rows.find((r) => r.key === key);
    if (!row) return reply.code(404).send({ error: 'not_found' });

    // On ne renvoie que ce qui sert au rendu (ni posted_*, ni infos internes).
    return {
      key: row.key,
      mode: row.mode,
      content: row.content,
      title: row.title,
      description: row.description,
      color: row.color,
      image_url: row.image_url,
      thumbnail_url: row.thumbnail_url,
      footer_text: row.footer_text,
      fields: row.fields || [],
      buttons: row.buttons || {},
    };
  });
}
