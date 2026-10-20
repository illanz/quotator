/**
 * Mise en conformite des mentions heritees du catalogue.
 *
 * Les descriptions viennent de facturation.pro et portent des regles ecrites il
 * y a des annees, qui ne sont plus celles appliquees. Deux d'entre elles sont
 * lues par le client sur son devis et contredisent les regles arbitrees — ce
 * sont des engagements contractuels, pas des approximations de presentation.
 *
 * Elles sont corrigees au rendu, a partir des constantes de `regles.ts`, pour
 * que le devis dise la meme chose que le moteur de prix. Corriger les textes
 * dans facturation.pro reste souhaitable ; en attendant, aucun devis ne doit
 * partir avec une mention fausse.
 *
 * Rien d'autre n'est reecrit : le catalogue reste la source du contenu, ce
 * module ne redresse que ce qui est verifiable contre une regle.
 */

import { DEPART_LIBELLE_CLIENT, DEPARTEMENTS_INCLUS } from "@/domain/regles";

/**
 * Point de depart annonce au client.
 *
 * Le catalogue ecrit « au depart de Paris 1er » (37 descriptions). Le calcul
 * part en realite de Courbevoie, et la formulation retenue avec le client est
 * « Paris », sans arrondissement : il n'a pas a connaitre l'adresse du depot,
 * et un arrondissement precis donnerait un kilometrage verifiable qui ne
 * correspondrait pas a la facture.
 *
 * Le motif ne vise que les formulations de notre propre depot — un
 * arrondissement parisien ou Courbevoie. Une ville citee pour une autre raison
 * n'est pas touchee.
 */
const DEPART =
  /\b(au\s+départ\s+(?:de\s+)?)(Paris\s*750\d{2}|Paris\s*\d{1,2}\s*(?:er|ème|eme|e)?|Courbevoie(?:\s*\(\s*92\s*\))?)/gi;

/**
 * Perimetre sans frais de deplacement.
 *
 * Deux descriptions annoncent « petite couronne (92, 93, 94) » et oublient
 * Paris : un client parisien y lirait qu'il doit des frais de deplacement
 * qu'il ne doit pas. La liste est reecrite a partir de `DEPARTEMENTS_INCLUS`,
 * seule source du perimetre.
 */
const PERIMETRE = /(petite\s+couronne\s*)\(\s*\d{2}(?:\s*,\s*\d{2})*\s*\)/gi;

const LISTE_DEPARTEMENTS = DEPARTEMENTS_INCLUS.join(", ");

export function normaliserMentions(texte: string): string {
  return texte
    .replace(DEPART, `$1${DEPART_LIBELLE_CLIENT}`)
    .replace(PERIMETRE, `$1(${LISTE_DEPARTEMENTS})`);
}
