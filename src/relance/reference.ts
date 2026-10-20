/**
 * Reference sectorielle tiree de l'historique reel.
 *
 * Quinze ans de facturation reconstruits donnent une information que personne
 * d'autre ne possede : combien de fois telle animation a ete jouee, pour quel
 * secteur, sur quelles tailles d'equipe. C'est l'argument de reassurance le
 * plus solide dont dispose MadCityZen, et le seul qui soit verifiable.
 *
 * Deux regles l'encadrent :
 *
 * - **Aucun nom de client.** Citer une entreprise dans un courriel de
 *   prospection engage sa confidentialite, et personne n'a donne son accord.
 *   Les chiffres agreges disent la meme chose sans ce risque.
 * - **Rien plutot qu'approximatif.** En dessous d'un seuil, la phrase se tait :
 *   « nous avons anime une fois cette activite pour votre secteur » dessert le
 *   propos. Une relance plus courte vaut mieux qu'une reference faible.
 */

import { prisma } from "@/lib/prisma";

/** En deca, l'historique ne dit rien d'assez solide pour etre avance. */
const SEUIL_SECTEUR = 3;
const SEUIL_GLOBAL = 10;

/** Annees remontees : au-dela, l'argument porte sur une equipe qui a change. */
const PROFONDEUR_ANNEES = 4;

export type ContexteReference = {
  /** Cle de l'animation proposee, telle qu'elle figure dans la grille. */
  cle: string;
  nom: string;
  /** Secteur du prospect, quand il est connu. */
  secteur?: string | null;
};

/**
 * Compose une phrase factuelle, ou rend `null`.
 *
 * L'ordre des tentatives va du plus parlant au plus general : le secteur du
 * prospect d'abord, le volume global ensuite.
 */
export async function referenceSecteur(contexte: ContexteReference): Promise<string | null> {
  const anneeMin = new Date().getFullYear() - PROFONDEUR_ANNEES;

  // Les evenements passes par un intermediaire sont exclus : le secteur
  // enregistre est celui de l'agence, pas celui du client final, et l'avancer
  // serait faux.
  const commun = {
    animations: { some: { cle: contexte.cle } },
    annee: { gte: anneeMin },
    organisation: { estAgence: false },
  };

  if (contexte.secteur) {
    const dansLeSecteur = await prisma.evenement.count({
      where: { ...commun, organisation: { estAgence: false, secteur: contexte.secteur } },
    });
    if (dansLeSecteur >= SEUIL_SECTEUR) {
      return (
        `depuis ${anneeMin}, nous avons animé ${dansLeSecteur} fois ${contexte.nom} ` +
        `pour des entreprises du secteur « ${contexte.secteur.toLowerCase()} ».`
      );
    }
  }

  const total = await prisma.evenement.count({ where: commun });
  if (total >= SEUIL_GLOBAL) {
    return `depuis ${anneeMin}, nous avons animé ${total} fois ${contexte.nom}.`;
  }

  return null;
}
