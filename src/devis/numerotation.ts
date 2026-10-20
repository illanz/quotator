/**
 * Regles de numerotation des devis.
 *
 * Le numero prolonge la serie de facturation.pro, et une serie de numeros de
 * devis se doit d'etre continue : un trou se justifie devant un controle, et
 * ne se rattrape pas.
 *
 * C'est pour cela qu'il est pris a l'emission et non a la creation. Un
 * commercial qui ouvre trois brouillons pour comparer des formules n'en envoie
 * qu'un ; les deux autres ne doivent consommer aucun numero.
 *
 * Ce module ne connait pas le stockage : il dit seulement si un devis est en
 * etat de recevoir son numero, et pourquoi il ne l'est pas.
 */

export type MotifRefus =
  | "INTROUVABLE"
  | "DEJA_EMIS"
  | "SANS_PRESTATION"
  | "MONTANT_NUL";

/** Ce qu'il faut savoir d'un devis pour decider s'il peut etre emis. */
export type CandidatEmission = {
  statut: string;
  numero: number | null;
  totalHTCents: number;
  /** Nombre de lignes fermes qui portent une prestation. */
  prestations: number;
};

/**
 * Controle d'emission, isole du stockage pour etre teste seul.
 *
 * Retourne le motif du refus, ou `null` quand le devis peut partir.
 */
export function controlerEmission(devis: CandidatEmission): MotifRefus | null {
  // Un devis qui porte deja un numero a ete emis : le renvoyer ne doit pas en
  // consommer un second, sous peine de deux numeros pour une meme affaire.
  if (devis.numero !== null) return "DEJA_EMIS";
  if (devis.statut !== "BROUILLON") return "DEJA_EMIS";
  if (devis.prestations === 0) return "SANS_PRESTATION";
  // Un devis a zero euro est toujours une erreur de saisie : soit le palier
  // n'a pas de prix en grille, soit la prestation reste a chiffrer.
  if (devis.totalHTCents <= 0) return "MONTANT_NUL";
  return null;
}

/** Message a afficher au commercial pour un refus d'emission. */
export const MESSAGES_REFUS: Record<MotifRefus, string> = {
  INTROUVABLE: "Ce devis n'existe plus.",
  DEJA_EMIS: "Ce devis a déjà été émis et porte son numéro.",
  SANS_PRESTATION: "Ce devis ne contient aucune prestation ferme.",
  MONTANT_NUL:
    "Le total est nul : une prestation n'a pas de prix, ou le palier n'est pas tarifé en grille.",
};
