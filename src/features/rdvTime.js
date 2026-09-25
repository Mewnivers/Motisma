// Calculs d'horaire pour /rdv (interprétés en heure de Paris). Partagé entre la
// création (/rdv) et la modification (/rdv-modifier).
export const PARIS = 'Europe/Paris';
const pad = (n) => String(n).padStart(2, '0');

/** Décompose un epoch (ms) en champs de date/heure dans le fuseau donné. */
export function partsInTz(epoch, tz = PARIS) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const o = {};
  for (const p of dtf.formatToParts(new Date(epoch))) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return o;
}

/** Convertit une heure locale (mur) d'un fuseau en epoch (ms). */
export function wallClockToEpoch(y, mo, d, hh, mm, tz = PARIS) {
  const naive = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const p = partsInTz(naive, tz);
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - naive;
  return naive - offset;
}

/** Prochaine occurrence de l'heure saisie (ex. « 15h30 ») en heure de Paris. */
export function eventStartEpoch(timeStr) {
  const m = String(timeStr || '').match(/(\d{1,2})(?:\s*[h:]\s*(\d{1,2}))?/i);
  if (!m) return Date.now() + 24 * 60 * 60 * 1000; // non analysable -> nettoyage dans 24h
  const hh = Math.min(23, parseInt(m[1], 10));
  const mm = m[2] ? Math.min(59, parseInt(m[2], 10)) : 0;

  const now = Date.now();
  const today = partsInTz(now, PARIS);
  let epoch = wallClockToEpoch(today.year, today.month, today.day, hh, mm, PARIS);
  if (epoch <= now) {
    const tomorrow = partsInTz(now + 24 * 60 * 60 * 1000, PARIS);
    epoch = wallClockToEpoch(tomorrow.year, tomorrow.month, tomorrow.day, hh, mm, PARIS);
  }
  return epoch;
}

/** Heure de début (normalisée), heure de fin (= début + durée) et plage « HH → HH ». */
export function computeHoraire(timeStr, dureeMin) {
  const startEpoch = eventStartEpoch(timeStr);
  const s = partsInTz(startEpoch, PARIS);
  const e = partsInTz(startEpoch + dureeMin * 60000, PARIS);
  const heureDebut = `${pad(s.hour)}h${pad(s.minute)}`;
  const heureFin = `${pad(e.hour)}h${pad(e.minute)}`;
  return { startEpoch, heureDebut, heureFin, horaire: `${heureDebut} → ${heureFin}` };
}

/** Fermeture automatique : minuit (Paris) du jour suivant la sortie. */
export function computeClose(startEpoch) {
  const s = partsInTz(startEpoch, PARIS);
  const deleteAt = wallClockToEpoch(s.year, s.month, s.day + 1, 0, 0, PARIS);
  const c = partsInTz(deleteAt, PARIS);
  const closeLabel = `${pad(c.day)}/${pad(c.month)} à ${pad(c.hour)}h${pad(c.minute)}`;
  return { deleteAt, closeLabel };
}
