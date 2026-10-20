/**
 * Ce qu'est un message sortant, independamment de qui l'achemine.
 *
 * MadCityZen envoie deux familles de courriers : des liens de connexion a
 * l'equipe, et des devis a des clients. Les deux passent par le meme port, pour
 * qu'un changement de prestataire ne touche qu'un fichier.
 */

export type Destinataire = {
  email: string;
  /** Nom affiche, quand il est connu. */
  nom?: string | null;
};

export type PieceJointe = {
  nom: string;
  contenu: Buffer;
  typeMime: string;
};

export type Message = {
  a: Destinataire;
  sujet: string;
  /**
   * Version texte, obligatoire.
   *
   * Ce n'est pas une politesse envers les lecteurs en texte seul : un message
   * HTML sans equivalent texte est un signal de courrier indesirable pour la
   * plupart des filtres, et un devis qui tombe en spam est un devis perdu.
   */
  texte: string;
  html?: string;
  /**
   * Copie cachee. Elle porte l'adresse de l'affaire Pipedrive, pour que le fil
   * commercial reste a jour sans que le client voie l'outil interne.
   */
  cci?: string[];
  piecesJointes?: PieceJointe[];
  /** Identifiant metier, repris dans le journal : « devis 19806 », « connexion ». */
  reference?: string;
};

export type ResultatEnvoi =
  | { ok: true; identifiant: string }
  | { ok: false; erreur: string };

/**
 * Port d'expedition.
 *
 * L'implementation reelle parle SMTP, ce que tous les prestataires offrent :
 * le choix de l'un d'eux ne tient qu'a des variables d'environnement, jamais a
 * une ligne de code.
 */
export type Expediteur = {
  envoyer(message: Message): Promise<ResultatEnvoi>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Verification de forme, avant de confier une adresse au reseau. */
export function emailPlausible(email: string): boolean {
  return EMAIL.test(email.trim());
}

/** « Nom <adresse> », ou l'adresse seule quand le nom manque. */
export function adresseComplete(d: Destinataire): string {
  const nom = d.nom?.trim();
  if (!nom) return d.email;
  // Les guillemets protegent les noms qui portent une virgule ou un point.
  return `"${nom.replace(/"/g, "")}" <${d.email}>`;
}
