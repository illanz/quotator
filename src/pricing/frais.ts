import type { Cents } from "@/domain/money";
import {
  DEPARTEMENTS_INCLUS,
  DEPART_VILLE,
  PRIX_KM_CENTS,
} from "@/domain/regles";

export type FraisDeplacement =
  | { du: "INCLUS"; departement: string }
  | { du: "KM_MANQUANTS"; departement: string }
  | { du: "A_FACTURER"; departement: string; kmAllerRetour: number; montantCents: Cents };

export function departementDe(codePostal: string): string | null {
  const cp = codePostal.replace(/\s/g, "");
  if (!/^\d{5}$/.test(cp)) return null;
  // La Corse (2A/2B) et l'outre-mer (97x/98x) tiennent sur trois chiffres.
  if (cp.startsWith("97") || cp.startsWith("98")) return cp.slice(0, 3);
  return cp.slice(0, 2);
}

/**
 * Frais de deplacement d'une prestation.
 *
 * Paris et la petite couronne sont inclus. Au-dela, la facturation est au
 * kilometre aller-retour depuis Courbevoie. Tant que le kilometrage n'est pas
 * connu, on le signale plutot que de produire une ligne a zero euro : un devis
 * parti avec des frais oublies se renegocie mal.
 */
export function calculerFraisDeplacement(
  codePostal: string | null | undefined,
  kmAllerRetour: number | null | undefined,
): FraisDeplacement | null {
  if (!codePostal) return null;
  const departement = departementDe(codePostal);
  if (!departement) return null;

  if ((DEPARTEMENTS_INCLUS as readonly string[]).includes(departement)) {
    return { du: "INCLUS", departement };
  }
  if (kmAllerRetour === null || kmAllerRetour === undefined || kmAllerRetour <= 0) {
    return { du: "KM_MANQUANTS", departement };
  }
  return {
    du: "A_FACTURER",
    departement,
    kmAllerRetour,
    montantCents: Math.round(kmAllerRetour) * PRIX_KM_CENTS,
  };
}

/** Libelle de la ligne de frais, au format employe sur les devis. */
export function libelleFraisDeplacement(ville: string): string {
  return `Frais de déplacement ${DEPART_VILLE} > ${ville} > ${DEPART_VILLE}`;
}
