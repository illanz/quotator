/**
 * Les dix paliers de participants de la grille tarifaire MadCityZen.
 *
 * L'ordre du tableau est celui des colonnes B a K de l'Excel : le parseur s'en
 * sert pour associer une colonne a un palier, et le moteur de prix pour trouver
 * le palier d'un nombre de participants donne.
 */

export const PALIERS = [
  "P1_9",
  "P10_19",
  "P20_29",
  "P30_49",
  "P50_79",
  "P80_119",
  "P120_159",
  "P160_199",
  "P200_239",
  "P240_PLUS",
] as const;

export type Palier = (typeof PALIERS)[number];

type Bornes = { min: number; max: number | null; label: string };

export const BORNES: Record<Palier, Bornes> = {
  P1_9: { min: 1, max: 9, label: "1-9" },
  P10_19: { min: 10, max: 19, label: "10-19" },
  P20_29: { min: 20, max: 29, label: "20-29" },
  P30_49: { min: 30, max: 49, label: "30-49" },
  P50_79: { min: 50, max: 79, label: "50-79" },
  P80_119: { min: 80, max: 119, label: "80-119" },
  P120_159: { min: 120, max: 159, label: "120-159" },
  P160_199: { min: 160, max: 199, label: "160-199" },
  P200_239: { min: 200, max: 239, label: "200-239" },
  P240_PLUS: { min: 240, max: null, label: "240+" },
};

/**
 * Palier correspondant a un nombre de participants.
 *
 * Le decalage de colonne est l'erreur la plus couteuse du processus manuel :
 * lire le prix de la colonne 80-119 en croyant lire celle de 50-79. Cette
 * fonction est le seul endroit ou l'association pax -> palier est decidee.
 */
export function palierPourPax(pax: number): Palier | null {
  if (!Number.isFinite(pax) || pax < 1) return null;
  for (const p of PALIERS) {
    const { min, max } = BORNES[p];
    if (pax >= min && (max === null || pax <= max)) return p;
  }
  return null;
}

/**
 * Palier d'une fourchette de participants (« 50-60 pax »).
 *
 * Une fourchette qui chevauche deux paliers n'a pas de prix evident : on
 * retourne les deux, et l'appelant demande confirmation plutot que de choisir
 * a la place du commercial.
 */
export function paliersPourFourchette(min: number, max: number): Palier[] {
  const bas = palierPourPax(min);
  const haut = palierPourPax(max);
  if (!bas || !haut) return [];
  const iBas = PALIERS.indexOf(bas);
  const iHaut = PALIERS.indexOf(haut);
  return PALIERS.slice(Math.min(iBas, iHaut), Math.max(iBas, iHaut) + 1);
}

export function labelPalier(p: Palier): string {
  return BORNES[p].label;
}
