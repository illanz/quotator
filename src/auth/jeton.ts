/**
 * Jetons de connexion a usage unique.
 *
 * Le lien magique remplace le mot de passe : il n'y a rien a retenir, rien a
 * reutiliser ailleurs, et rien a faire fuiter. En contrepartie, le jeton est
 * l'acces : il doit etre imprevisible, court-vivant, et consomme une seule
 * fois.
 *
 * Seule son empreinte est conservee en base. Un vol de la base ne livre alors
 * aucun acces : d'une empreinte SHA-256 on ne remonte pas au jeton, et c'est le
 * jeton que verifie la connexion.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Duree de validite d'un lien, en minutes. */
export const VALIDITE_LIEN_MINUTES = 15;

/**
 * 32 octets, soit 256 bits d'entropie.
 *
 * Largement au-dela de ce qu'une attaque par force brute peut parcourir, et la
 * fenetre de quinze minutes reduit encore la cible.
 */
const OCTETS = 32;

/** Jeton en clair, a ne transmettre que par le courriel. */
export function creerJeton(): string {
  return randomBytes(OCTETS).toString("base64url");
}

/** Empreinte a stocker, jamais reversible. */
export function empreinte(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}

/**
 * Comparaison a temps constant.
 *
 * Une comparaison ordinaire s'arrete au premier caractere different, et la
 * duree de la reponse renseigne alors sur le nombre de caracteres devines.
 */
export function empreintesEgales(a: string, b: string): boolean {
  const ta = Buffer.from(a);
  const tb = Buffer.from(b);
  if (ta.length !== tb.length) return false;
  return timingSafeEqual(ta, tb);
}

export function expirationLien(depuis: Date = new Date()): Date {
  return new Date(depuis.getTime() + VALIDITE_LIEN_MINUTES * 60_000);
}

export type EtatJeton = "VALIDE" | "EXPIRE" | "DEJA_UTILISE";

/** Etat d'un jeton retrouve en base, au moment ou il est presente. */
export function etatJeton(
  jeton: { expireLe: Date; utiliseLe: Date | null },
  maintenant: Date = new Date(),
): EtatJeton {
  // La consommation prime sur l'expiration : un lien rejoue doit se signaler
  // comme tel, c'est le cas qui merite une explication a l'utilisateur.
  if (jeton.utiliseLe !== null) return "DEJA_UTILISE";
  if (jeton.expireLe.getTime() <= maintenant.getTime()) return "EXPIRE";
  return "VALIDE";
}
