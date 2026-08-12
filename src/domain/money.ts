/**
 * Tous les montants circulent en centimes entiers.
 *
 * Un devis MadCityZen enchaine des majorations (+15 % week-end), des remises
 * (-10 % agence) et des sommes de lignes. En flottant, ces operations laissent
 * des residus qui finissent par decaler le total affiche du total recalcule.
 * L'entier supprime le probleme a la source.
 */

export type Cents = number;

/** Arrondi commercial au centime le plus proche (0,5 arrondi vers le haut). */
export function roundCents(value: number): Cents {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Applique un pourcentage a un montant : `pct` est exprime en points (15 = +15 %). */
export function applyPercent(amount: Cents, pct: number): Cents {
  return roundCents(amount * (1 + pct / 100));
}

/** Montant de la remise, toujours negatif, pour un taux exprime en points. */
export function discountAmount(amount: Cents, pct: number): Cents {
  return -roundCents((amount * pct) / 100);
}

/** Convertit des euros (nombre ou chaine « 1 590 € HT ») en centimes. */
export function eurosToCents(value: number | string): Cents | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? roundCents(value * 100) : null;
  }
  const cleaned = value
    .replace(/ /g, " ")
    .replace(/€|EUR|HT|TTC/gi, "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .trim();
  if (cleaned === "" || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return roundCents(Number(cleaned) * 100);
}

export function formatEuros(cents: Cents): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
