// Rendu du panneau du salon /rdv : modèle éditable « rdv_salon » avec les
// variables {participants} (nombre) et {inscrits} (liste), ou embed codé de
// repli. Module partagé entre la commande (création) et les contrôles
// (inscription / désinscription), pour éviter tout import circulaire.
import { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';
import { getInfoEmbed } from '../db.js';
import { contentToEmbed, substituteRow, rowHasContent } from '../embeds/renderInfoEmbed.js';

const BRAND = 0x5865f2;
const EMPTY = 'Personne pour l’instant.';

/** Vrai si le modèle utilise la variable {name} quelque part. */
export function usesVar(row, name) {
  if (!row) return false;
  const token = `{${name}}`;
  const parts = [
    row.content,
    row.title,
    row.description,
    row.footer_text,
    ...(row.fields || []).flatMap((f) => [f?.name, f?.value]),
  ];
  return parts.some((s) => typeof s === 'string' && s.includes(token));
}

/** Variables du panneau : celles de la sortie + le nombre et la liste d'inscrits. */
function panelVars(outing) {
  const ids = outing.participants || [];
  return {
    ...(outing.vars || {}),
    participants: String(ids.length),
    inscrits: ids.length ? ids.map((id) => `<@${id}>`).join('\n') : EMPTY,
  };
}

/** Embed codé de repli si le modèle rdv_salon n'est pas configuré. */
function buildPanelEmbedCoded(vars, ids) {
  const desc = vars.description ? String(vars.description) : '';
  return new EmbedBuilder()
    .setColor(BRAND)
    .setTitle('🗓️ Sortie')
    .setDescription(
      [desc ? `${desc}\n` : null, '-# Bouton ci-dessous pour te désinscrire et quitter le salon.']
        .filter(Boolean)
        .join('\n'),
    )
    .addFields(
      { name: '📍 Lieu', value: vars.lieu || '—', inline: true },
      { name: '🕒 Horaire', value: `${vars.heure_debut || ''} → ${vars.heure_fin || ''}`, inline: true },
      { name: '👤 Organisateur', value: vars.organisateur || '—', inline: true },
      {
        name: `Participants (${ids.length})`,
        value: ids.length ? ids.map((id) => `<@${id}>`).join('\n') : EMPTY,
        inline: false,
      },
    )
    .setFooter({ text: `🕒 Fermeture automatique du salon le ${vars.fermeture || ''}` });
}

/**
 * Rend l'embed du panneau du salon pour une sortie donnée. Le modèle est lu
 * sous config.guildId (les info_embeds sont mono-serveur).
 * @param {{ vars: object, participants: string[] }} outing
 */
export async function renderPanel(outing) {
  const ids = outing.participants || [];
  const vars = panelVars(outing);
  const tpl = await getInfoEmbed(config.guildId, 'rdv_salon').catch(() => null);
  if (rowHasContent(tpl)) {
    const embed = contentToEmbed(substituteRow(tpl, vars));
    // Rétrocompat : si le modèle n'utilise pas {inscrits}, on ajoute la liste en champ.
    if (!usesVar(tpl, 'inscrits')) {
      embed.fields = [
        ...(embed.fields || []),
        { name: `Participants (${ids.length})`, value: vars.inscrits, inline: false },
      ];
    }
    return embed;
  }
  return buildPanelEmbedCoded(vars, ids);
}
