/**
 * Choix de l'expediteur, selon ce que l'environnement offre.
 *
 * Deux implementations seulement :
 *
 * - SMTP, des que les variables de connexion sont presentes. Tous les
 *   prestataires transactionnels en offrent un, si bien que changer de
 *   prestataire ne touche aucune ligne de code.
 * - Le journal, sinon. Il ecrit le message sur disque au lieu de l'envoyer,
 *   pour que l'outil fonctionne en developpement sans compte chez personne —
 *   et surtout pour qu'un environnement mal configure n'envoie jamais de
 *   courrier a un vrai client par accident.
 */

import { expediteurJournal } from "./journal";
import type { Environnement } from "@/domain/environnement";
import type { Expediteur } from "./message";
import { expediteurSMTP } from "./smtp";

export type ConfigurationCourrier = {
  hote: string;
  port: number;
  utilisateur: string;
  motDePasse: string;
  /** Adresse d'expedition affichee au destinataire. */
  de: string;
  /** Adresse de reponse, quand elle differe de l'expedition. */
  repondreA?: string;
};

/**
 * Lit la configuration SMTP, ou rend `null` si elle est incomplete.
 *
 * Une configuration a moitie remplie est traitee comme absente : mieux vaut
 * basculer franchement sur le journal que tenter une connexion qui echouera
 * au premier envoi, c'est-a-dire devant un client.
 */
export function configurationCourrier(
  env: Environnement = process.env,
): ConfigurationCourrier | null {
  const hote = env.SMTP_HOTE;
  const utilisateur = env.SMTP_UTILISATEUR;
  const motDePasse = env.SMTP_MOT_DE_PASSE;
  const de = env.COURRIER_EXPEDITEUR;
  if (!hote || !utilisateur || !motDePasse || !de) return null;

  return {
    hote,
    port: Number(env.SMTP_PORT ?? 587),
    utilisateur,
    motDePasse,
    de,
    ...(env.COURRIER_REPONDRE_A ? { repondreA: env.COURRIER_REPONDRE_A } : {}),
  };
}

let expediteur: Expediteur | null = null;

/** Expediteur du processus, construit une fois. */
export function courrier(): Expediteur {
  if (expediteur) return expediteur;
  const configuration = configurationCourrier();
  expediteur = configuration ? expediteurSMTP(configuration) : expediteurJournal();
  return expediteur;
}

/** Vrai quand les messages partent reellement. */
export function envoiReel(): boolean {
  return configurationCourrier() !== null;
}
