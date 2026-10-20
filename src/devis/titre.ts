import type { DateISO } from "@/domain/calendrier";

/**
 * Composition de la ligne de titre d'un devis.
 *
 * Le titre suit une convention maison stricte :
 *
 *     Animations <Activites> / <Date> / <Pax> Pax / <Ville> / Vacation <duree>
 *
 * L'historique montre cinq variantes du meme format, nees de quinze ans de
 * saisie a la main. La composer ici supprime cette derive, et le resultat reste
 * editable pour les evenements qui ne rentrent pas dans le gabarit.
 */

const MOIS_LONGS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const MOIS_COURTS = [
  "Janv", "Févr", "Mars", "Avril", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
];

export type PrecisionDate = "JOUR" | "MOIS" | "INDEFINIE";

export type ContexteTitre = {
  /** Noms des animations proposees, dans l'ordre d'apparition sur le devis. */
  animations: string[];
  dateEvent?: DateISO | null;
  /** Une demande sans date arretee s'annonce telle quelle, pas par une date inventee. */
  precisionDate?: PrecisionDate;
  pax?: number | null;
  /** Borne haute, quand la demande porte une fourchette (« 50-60 Pax »). */
  paxMax?: number | null;
  ville?: string | null;
  /** Duree standard de la fiche produit, jamais celle demandee par le client. */
  duree?: string | null;
  /**
   * Animation en libre acces : pas de jauge de participants, mais une plage
   * horaire (« de 12h45 à 14h15 »).
   */
  libreAcces?: boolean;
  plageHoraire?: string | null;
};

/** « 10 décembre 2026 », pour une date destinee a etre lue par le client. */
export function formaterDateLongue(date: DateISO): string {
  const [annee, mois, jour] = date.split("-");
  return `${Number(jour)} ${MOIS_LONGS[Number(mois) - 1]} ${annee}`;
}

function formaterDate(date: DateISO, precision: PrecisionDate): string {
  const [annee, mois, jour] = date.split("-");
  const indexMois = Number(mois) - 1;
  if (precision === "MOIS") return `${MOIS_COURTS[indexMois]} ${annee}`;
  return `${Number(jour)} ${MOIS_LONGS[indexMois]} ${annee}`;
}

function formaterAnimations(noms: string[]): string {
  const propres = noms.map((n) => n.trim()).filter(Boolean);
  if (propres.length === 0) return "Team Building";
  if (propres.length === 1) return propres[0]!;
  // « Space K, Doublage, Lego Mania & Robots Makers » — l'esperluette ferme la
  // liste, comme sur les devis existants.
  return `${propres.slice(0, -1).join(", ")} & ${propres.at(-1)}`;
}

function formaterPax(pax: number, paxMax: number | null | undefined): string {
  return paxMax && paxMax !== pax ? `${pax}-${paxMax} Pax` : `${pax} Pax`;
}

/**
 * Compose le titre a partir du contexte saisi.
 *
 * Chaque segment absent est omis plutot que rempli d'un marqueur : un titre
 * incomplet se voit, un titre contenant « XXX » part chez le client.
 */
export function composerTitre(contexte: ContexteTitre): string {
  const segments: string[] = [];

  const pluriel = contexte.animations.length > 1 ? "Animations" : "Animation";
  segments.push(`${pluriel} ${formaterAnimations(contexte.animations)}`);

  const precision = contexte.precisionDate ?? "JOUR";
  if (precision === "INDEFINIE" || !contexte.dateEvent) {
    segments.push("Date à définir");
  } else {
    segments.push(formaterDate(contexte.dateEvent, precision));
  }

  if (!contexte.libreAcces && contexte.pax) {
    segments.push(formaterPax(contexte.pax, contexte.paxMax));
  }

  if (contexte.ville?.trim()) segments.push(contexte.ville.trim());

  if (contexte.libreAcces && contexte.plageHoraire?.trim()) {
    segments.push(`Vacation ${contexte.plageHoraire.trim()}`);
  } else if (contexte.duree?.trim()) {
    segments.push(`Vacation ${contexte.duree.trim()}`);
  }

  return segments.join(" / ");
}
