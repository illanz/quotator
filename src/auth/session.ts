/**
 * Session signee, portee par un cookie.
 *
 * Le cookie ne contient qu'un identifiant d'utilisateur et une echeance, le
 * tout signe : le serveur n'a aucun etat de session a conserver, et une valeur
 * forgee ou modifiee est rejetee parce que la signature ne tombe plus juste.
 *
 * Ce n'est pas du chiffrement : le contenu est lisible par qui detient le
 * cookie. Il ne doit donc rien porter que son porteur ne puisse deja savoir —
 * son propre identifiant, et jusqu'a quand il est connecte.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Environnement } from "@/domain/environnement";

export const COOKIE_SESSION = "mcz_session";

/** Duree d'une session, en jours. */
export const DUREE_SESSION_JOURS = 30;

export type Session = {
  utilisateurId: string;
  /** Echeance, en secondes depuis l'epoque. */
  expire: number;
};

function signer(charge: string, secret: string): string {
  return createHmac("sha256", secret).update(charge).digest("base64url");
}

export function creerSession(
  utilisateurId: string,
  secret: string,
  depuis: Date = new Date(),
): string {
  const expire = Math.floor(depuis.getTime() / 1000) + DUREE_SESSION_JOURS * 86_400;
  const charge = Buffer.from(JSON.stringify({ utilisateurId, expire })).toString("base64url");
  return `${charge}.${signer(charge, secret)}`;
}

/**
 * Relit un cookie de session, ou rend `null`.
 *
 * Tous les echecs — forme invalide, signature fausse, echeance passee — rendent
 * `null` sans distinction : l'appelant n'a rien a en faire de different, et
 * distinguer les cas renseignerait un attaquant sur ce qui lui manque.
 */
export function lireSession(
  valeur: string | undefined,
  secret: string,
  maintenant: Date = new Date(),
): Session | null {
  if (!valeur) return null;

  const separateur = valeur.lastIndexOf(".");
  if (separateur <= 0) return null;

  const charge = valeur.slice(0, separateur);
  const signature = valeur.slice(separateur + 1);

  const attendue = Buffer.from(signer(charge, secret));
  const fournie = Buffer.from(signature);
  if (attendue.length !== fournie.length || !timingSafeEqual(attendue, fournie)) return null;

  let session: Session;
  try {
    session = JSON.parse(Buffer.from(charge, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }

  if (typeof session.utilisateurId !== "string" || typeof session.expire !== "number") return null;
  if (session.expire * 1000 <= maintenant.getTime()) return null;

  return session;
}

/**
 * Secret de signature.
 *
 * Absent, il n'y a pas de repli silencieux : une session signee avec un secret
 * devine ou vide n'est pas une session. Mieux vaut un demarrage qui echoue
 * qu'une authentification qui n'en est pas une.
 */
export function secretSession(env: Environnement = process.env): string {
  const secret = env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET doit être défini et faire au moins 32 caractères. " +
        "En générer un : openssl rand -base64 48",
    );
  }
  return secret;
}
