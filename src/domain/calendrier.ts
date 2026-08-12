/**
 * Dates d'evenement et jours majores.
 *
 * Une date d'evenement est manipulee en `YYYY-MM-DD`, jamais en `Date` : un
 * objet Date porte une heure et un fuseau, et une animation du samedi 15 aout
 * ne doit pas basculer au vendredi 14 parce que le serveur tourne en UTC et le
 * commercial a Paris.
 */

export type DateISO = string;

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

export function estDateISO(valeur: string): valeur is DateISO {
  const m = FORMAT.exec(valeur);
  if (!m) return false;
  const [, a, mo, j] = m;
  const annee = Number(a);
  const mois = Number(mo);
  const jour = Number(j);
  if (mois < 1 || mois > 12 || jour < 1) return false;
  return jour <= joursDansLeMois(annee, mois);
}

function joursDansLeMois(annee: number, mois: number): number {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate();
}

function versUTC(date: DateISO): Date {
  const m = FORMAT.exec(date);
  if (!m) throw new Error(`Date invalide : ${date}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function versISO(d: Date): DateISO {
  return d.toISOString().slice(0, 10);
}

export function ajouterJours(date: DateISO, jours: number): DateISO {
  const d = versUTC(date);
  d.setUTCDate(d.getUTCDate() + jours);
  return versISO(d);
}

/** 0 = dimanche, 6 = samedi. */
export function jourDeLaSemaine(date: DateISO): number {
  return versUTC(date).getUTCDay();
}

export function estWeekEnd(date: DateISO): boolean {
  const j = jourDeLaSemaine(date);
  return j === 0 || j === 6;
}

/** Dimanche de Paques, algorithme de Meeus/Jones/Butcher. */
function paques(annee: number): DateISO {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return versISO(new Date(Date.UTC(annee, mois - 1, jour)));
}

/** Les onze jours feries francais d'une annee donnee. */
export function joursFeries(annee: number): Set<DateISO> {
  const p = paques(annee);
  return new Set<DateISO>([
    `${annee}-01-01`, // Jour de l'an
    ajouterJours(p, 1), // Lundi de Paques
    `${annee}-05-01`, // Fete du travail
    `${annee}-05-08`, // Victoire 1945
    ajouterJours(p, 39), // Ascension
    ajouterJours(p, 50), // Lundi de Pentecote
    `${annee}-07-14`, // Fete nationale
    `${annee}-08-15`, // Assomption
    `${annee}-11-01`, // Toussaint
    `${annee}-11-11`, // Armistice
    `${annee}-12-25`, // Noel
  ]);
}

export function estJourFerie(date: DateISO): boolean {
  const annee = Number(date.slice(0, 4));
  return joursFeries(annee).has(date);
}

/** Une prestation ce jour-la subit la majoration week-end et jours feries. */
export function estJourMajore(date: DateISO): boolean {
  return estWeekEnd(date) || estJourFerie(date);
}
