/**
 * Connexion par lien magique.
 *
 * Aucun mot de passe : on saisit son adresse, on recoit un lien, on est
 * connecte. Il n'y a donc rien a retenir, rien a reutiliser ailleurs, et rien
 * a faire fuiter — et la messagerie professionnelle, deja protegee, porte la
 * securite de l'acces.
 *
 * Le lien n'ouvre que des comptes qui existent et sont actifs. Il ne cree
 * jamais personne : l'outil porte toute la base clients, et une inscription
 * libre y serait une porte ouverte.
 */

import { cookies } from "next/headers";
import type { Environnement } from "@/domain/environnement";
import { courrier, envoiReel } from "@/courrier/expediteur";
import { prisma } from "@/lib/prisma";
import { creerJeton, empreinte, expirationLien, etatJeton } from "./jeton";
import {
  COOKIE_SESSION,
  DUREE_SESSION_JOURS,
  creerSession,
  lireSession,
  secretSession,
} from "./session";

/** Delai minimal entre deux demandes pour une meme adresse, en secondes. */
const DELAI_ENTRE_DEMANDES = 60;

export function urlApplication(env: Environnement = process.env): string {
  return (env.APP_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}

/**
 * Envoie un lien de connexion, si l'adresse correspond a un compte actif.
 *
 * Le resultat ne dit jamais si l'adresse est connue. Une reponse qui
 * distinguerait les deux cas transformerait ce formulaire en annuaire : on y
 * essaierait des adresses jusqu'a decouvrir qui travaille ici.
 */
export async function demanderLien(
  email: string,
  depuisIP?: string | null,
): Promise<{ envoye: boolean }> {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!utilisateur || !utilisateur.actif) return { envoye: false };

  // Un lien encore frais suffit : sans ce garde-fou, le formulaire permettrait
  // d'inonder la boite d'un collegue.
  const recent = await prisma.jetonConnexion.findFirst({
    where: {
      utilisateurId: utilisateur.id,
      utiliseLe: null,
      creeLe: { gt: new Date(Date.now() - DELAI_ENTRE_DEMANDES * 1000) },
    },
  });
  if (recent) return { envoye: false };

  const jeton = creerJeton();
  await prisma.jetonConnexion.create({
    data: {
      empreinte: empreinte(jeton),
      utilisateurId: utilisateur.id,
      expireLe: expirationLien(),
      demandeDepuisIP: depuisIP ?? null,
    },
  });

  const lien = `${urlApplication()}/connexion/${jeton}`;
  await courrier().envoyer({
    a: { email: utilisateur.email, nom: utilisateur.nom },
    sujet: "Votre lien de connexion à Quotator",
    reference: "connexion",
    texte: [
      `Bonjour ${utilisateur.nom},`,
      "",
      "Voici votre lien de connexion à Quotator :",
      lien,
      "",
      "Il est valable un quart d'heure et ne sert qu'une fois.",
      "Si vous n'êtes à l'origine d'aucune demande, ignorez ce message : personne",
      "ne peut se connecter sans ouvrir ce lien.",
      "",
      "— MadCityZen",
    ].join("\n"),
  });

  return { envoye: true };
}

export type ResultatConnexion =
  | { ok: true; utilisateurId: string; nom: string }
  | { ok: false; motif: "INCONNU" | "EXPIRE" | "DEJA_UTILISE" | "COMPTE_INACTIF" };

/**
 * Consomme un lien et ouvre la session.
 *
 * La consommation et l'ouverture sont dans la meme transaction : un lien ne
 * doit pas etre marque utilise si la session n'est pas ouverte, ni rester
 * utilisable si elle l'est.
 */
export async function consommerJeton(jeton: string): Promise<ResultatConnexion> {
  const trouve = await prisma.jetonConnexion.findUnique({
    where: { empreinte: empreinte(jeton) },
    include: { utilisateur: true },
  });
  if (!trouve) return { ok: false, motif: "INCONNU" };

  const etat = etatJeton(trouve);
  if (etat !== "VALIDE") return { ok: false, motif: etat };
  if (!trouve.utilisateur.actif) return { ok: false, motif: "COMPTE_INACTIF" };

  // `updateMany` avec la condition « pas encore utilise » rend l'operation
  // atomique : deux ouvertures simultanees du meme lien, et une seule passe.
  const consomme = await prisma.jetonConnexion.updateMany({
    where: { id: trouve.id, utiliseLe: null },
    data: { utiliseLe: new Date() },
  });
  if (consomme.count === 0) return { ok: false, motif: "DEJA_UTILISE" };

  return { ok: true, utilisateurId: trouve.utilisateurId, nom: trouve.utilisateur.nom };
}

/**
 * Cookie de session a poser.
 *
 * Rendu comme une valeur plutot que pose directement : Next n'autorise
 * l'ecriture d'un cookie que depuis une action serveur ou un gestionnaire de
 * route, et la consommation du lien de connexion se fait dans une route.
 */
export function cookieSession(utilisateurId: string) {
  return {
    nom: COOKIE_SESSION,
    valeur: creerSession(utilisateurId, secretSession()),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      // En production l'application est servie en HTTPS ; en developpement, un
      // cookie « secure » ne serait jamais pose sur http://127.0.0.1.
      secure: urlApplication().startsWith("https://"),
      path: "/",
      maxAge: DUREE_SESSION_JOURS * 86_400,
    },
  };
}

export async function ouvrirSession(utilisateurId: string): Promise<void> {
  const { nom, valeur, options } = cookieSession(utilisateurId);
  const boite = await cookies();
  boite.set(nom, valeur, options);
}

export async function fermerSession(): Promise<void> {
  const boite = await cookies();
  boite.delete(COOKIE_SESSION);
}

export type UtilisateurConnecte = {
  id: string;
  nom: string;
  email: string;
  role: string;
};

/**
 * Utilisateur de la requete en cours, ou `null`.
 *
 * Le compte est relu en base a chaque fois plutot que repris du cookie : un
 * compte desactive doit perdre l'acces immediatement, sans attendre que sa
 * session arrive a echeance.
 */
export async function utilisateurCourant(): Promise<UtilisateurConnecte | null> {
  const boite = await cookies();
  const session = lireSession(boite.get(COOKIE_SESSION)?.value, secretSession());
  if (!session) return null;

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: session.utilisateurId },
    select: { id: true, nom: true, email: true, role: true, actif: true },
  });
  if (!utilisateur || !utilisateur.actif) return null;

  const { actif: _actif, ...connecte } = utilisateur;
  return connecte;
}

/** Vrai quand les liens de connexion s'ecrivent sur disque au lieu de partir. */
export function lienEcritSurDisque(): boolean {
  return !envoiReel();
}
