import type { Palier } from "@/domain/paliers";
import { palierPourPax, paliersPourFourchette } from "@/domain/paliers";

/**
 * Forme du catalogue telle que l'ecran de saisie la consomme.
 *
 * Ce module ne touche pas a la base : il est charge aussi bien par le serveur
 * que par le navigateur, ou le moteur de prix recalcule le devis a la frappe.
 */
export type AnimationVendable = {
  cle: string;
  nom: string;
  famille: string | null;
  libreAcces: boolean;
  regime: "PALIER" | "FORFAIT";
  /** Regle en texte libre, pour un forfait dont le prix se saisit a la main. */
  regleForfait: string | null;
  descriptionHtml: string | null;
  dureeStandard: string | null;
  /** Prix par palier, en centimes. */
  prixParPalier: Partial<Record<Palier, number | null>>;
  /** Ce que la grille dit quand elle ne donne pas de prix : « Nous consulter ». */
  mentionParPalier: Partial<Record<Palier, string>>;
};

/**
 * Nom presentable d'une animation.
 *
 * La grille ecrit ses libelles en capitales, avec les conditions tarifaires
 * entre parentheses : « GRAFFITI (indoor : + 15€/ pax) ». Ces mentions servent
 * au commercial, pas au client : elles n'ont rien a faire sur un devis.
 */
export function nomCommercial(libelleGrille: string): string {
  const sansConditions = libelleGrille
    .replace(/\(([^)]*)\)/g, (_, contenu: string) =>
      /€|\bpax\b|:|\//i.test(contenu) ? " " : ` (${contenu}) `,
    )
    .replace(/\s{2,}/g, " ")
    .trim();

  // Les capitales integrales d'un tableur se lisent mal dans une phrase.
  return sansConditions
    .split(" ")
    .map((mot) =>
      mot.length > 2 && mot === mot.toUpperCase() && /[A-ZÀ-Ý]/.test(mot)
        ? mot.charAt(0) + mot.slice(1).toLowerCase()
        : mot,
    )
    .join(" ");
}

/**
 * Palier applicable a une demande.
 *
 * Une fourchette a cheval sur deux tranches n'a pas de prix evident : plutot
 * que de trancher a la place du commercial, on remonte les deux candidats.
 */
export function palierPourDemande(
  pax: number | null | undefined,
  paxMax: number | null | undefined,
): { palier: Palier | null; ambigu: Palier[] } {
  if (!pax) return { palier: null, ambigu: [] };
  if (!paxMax || paxMax === pax) return { palier: palierPourPax(pax), ambigu: [] };

  const candidats = paliersPourFourchette(pax, paxMax);
  if (candidats.length <= 1) return { palier: candidats[0] ?? null, ambigu: [] };
  return { palier: null, ambigu: candidats };
}
