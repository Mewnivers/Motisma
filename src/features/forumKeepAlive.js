import { Events } from 'discord.js';
import { config } from '../config.js';

/**
 * Keep a set of forum posts (threads) permanently reachable.
 *
 * A "<#id>" channel mention is resolved from each viewer's own client cache,
 * and that cache only holds *active* threads. Once a forum post auto-archives
 * (after 1–7 days of inactivity) it drops out of the cache, so the mention
 * renders "#Inconnu" for anyone who was not already viewing it. These posts are
 * surfaced in the "salons à connaître" embed (src/embeds/ressources.js), where
 * that looks broken.
 *
 * The fix: whenever one of these posts is found archived, the bot unarchives it.
 * Unarchiving refreshes the thread's activity timestamp, which Discord uses to
 * compute auto-archiving, so the post is good for another full auto-archive
 * window. The edit posts no message, so the posts stay clean and no one is
 * pinged. A post can still show "#Inconnu" for at most one sweep interval right
 * after it archives, hence the short interval below.
 */

// How often to re-check the posts. Kept well under the tightest auto-archive
// window (1 day) so an archived post is reopened quickly.
const SWEEP_MS = 30 * 60 * 1000;

/**
 * Reopen any of the tracked posts that have archived.
 * @param {import('discord.js').Client} client
 */
async function sweep(client) {
  for (const id of config.forumKeepAliveIds) {
    const thread = await client.channels.fetch(id).catch(() => null);
    if (!thread) {
      console.warn(`[keepalive] Post ${id} is unreachable (deleted or missing access).`);
      continue;
    }
    if (typeof thread.isThread !== 'function' || !thread.isThread()) {
      console.warn(`[keepalive] Channel ${id} is not a forum post; skipping.`);
      continue;
    }
    if (!thread.archived) continue; // Still active: nothing to do.

    await thread
      .setArchived(false, 'Keep-alive: post listed in the resources embed')
      .then(() => console.log(`[keepalive] Reopened ${id} (#${thread.name}).`))
      .catch((e) => console.error(`[keepalive] Could not reopen ${id}:`, e?.message ?? e));
  }
}

/**
 * @param {import('discord.js').Client} client
 */
export function registerForumKeepAlive(client) {
  client.once(Events.ClientReady, (c) => {
    if (!config.forumKeepAliveIds.length) return; // Not configured: stays off.
    const run = () => sweep(c).catch((e) => console.error('[keepalive] Sweep failed:', e?.message ?? e));
    run(); // Reopen right away whatever archived while the bot was down.
    setInterval(run, SWEEP_MS);
  });
}
