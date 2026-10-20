/**
 * Textes des relances.
 *
 * Le copy est celui valide dans `docs/01-conversion.md`. Il est porte ici en
 * clair plutot qu'en base : ces messages engagent le discours commercial de
 * MadCityZen, ils meritent d'etre relus en revue de code comme le reste.
 *
 * Deux regles tenues par la structure plutot que par la vigilance :
 *
 * - **Le prix n'apparait jamais dans le corps d'un message.** Il reste sur le
 *   PDF et sur la page du devis. Le contexte fourni aux modeles ne porte donc
 *   aucun montant : la regle ne peut pas etre enfreinte par distraction.
 * - **La mention d'engagement vient de `regles.ts`.** Une relance qui
 *   promettrait de bloquer une date contredirait l'article 3 des conditions
 *   generales, et cette contradiction se decouvrirait au pire moment.
 */

import { formaterDateLongue } from "@/devis/titre";
import { corps } from "./pliage";
import { MENTION_ENGAGEMENT } from "@/domain/regles";
import type { CleRelance } from "./sequence";

export type ContexteMessage = {
  prenom: string | null;
  animation: string;
  dateEvent: string | null;
  ville: string | null;
  numero: number | null;
  valableAu: string | null;
  lienDevis: string;
  commercial: string;
  telephoneCommercial: string | null;
  /**
   * Phrase factuelle tiree de l'historique reel, pour la relance J+8.
   *
   * Absente quand l'historique ne dit rien d'exploitable : mieux vaut une
   * relance plus courte qu'une reference inventee.
   */
  referenceSecteur?: string | null;
};

export type MessageRelance = { sujet: string; texte: string };

function bonjour(prenom: string | null): string {
  return prenom ? `Bonjour ${prenom},` : "Bonjour,";
}

/** Deux paragraphes : la formule, puis le nom. Les replier les collerait. */
function signature(c: ContexteMessage): string[] {
  return ["Bien à vous,", c.commercial];
}

function quand(c: ContexteMessage): string {
  return c.dateEvent ? `du ${formaterDateLongue(c.dateEvent)}` : "à venir";
}

function echeance(c: ContexteMessage): string {
  return c.valableAu ? formaterDateLongue(c.valableAu) : "sa date d'échéance";
}

function reference(c: ContexteMessage): string {
  return c.numero ? `n° ${c.numero}` : "";
}

const MODELES: Record<CleRelance, (c: ContexteMessage) => MessageRelance> = {
  VERIFICATION: (c) => ({
    sujet: `Votre devis ${reference(c)} vous est bien parvenu ?`.replace(/\s+/g, " ").trim(),
    texte: corps([
      bonjour(c.prenom),
      "",
      `Je m'assure simplement que notre proposition pour l'événement ${quand(c)} vous est bien arrivée — les pièces jointes se perdent parfois dans les filtres.`,
      "",
      "Vous pouvez la consulter directement en ligne :",
      c.lienDevis,
      "",
      ...signature(c),
    ]),
  }),

  QUESTIONS: (c) => ({
    sujet: `Des questions sur votre animation ${c.animation} ?`,
    texte: corps([
      bonjour(c.prenom),
      "",
      "Vous avez pu parcourir notre proposition — je reste à votre disposition si un point mérite d'être précisé : déroulé, matériel, adaptation au lieu, ou ajustement du nombre de participants.",
      "",
      "Si vous préférez en parler de vive voix, dites-moi simplement quel créneau vous arrange cette semaine.",
      "",
      c.lienDevis,
      "",
      ...signature(c),
    ]),
  }),

  VALEUR: (c) => ({
    sujet: `${c.animation} : comment ça se passe concrètement`,
    texte: corps([
      bonjour(c.prenom),
      "",
      ...(c.referenceSecteur
        ? [`Je reviens vers vous avec un élément qui aide souvent à se décider : ${c.referenceSecteur}`, ""]
        : [
            "Je reviens vers vous au cas où un point resterait à lever — l'espace nécessaire, les contraintes techniques, ou la participation de collègues peu à l'aise à l'idée de se lancer. Ce sont les trois questions qui reviennent le plus, et aucune n'est un obstacle.",
            "",
          ]),
      "Si le projet a évolué de votre côté — date, nombre de participants, budget — nous pouvons ajuster la proposition très rapidement.",
      "",
      c.lienDevis,
      "",
      ...signature(c),
    ]),
  }),

  DISPONIBILITE: (c) => ({
    sujet: `Votre date ${quand(c)} — point de disponibilité`,
    texte: corps([
      bonjour(c.prenom),
      "",
      "Un mot sur le calendrier : nos équipes d'animation s'engagent au fur et à mesure des accords, et la période se remplit.",
      "",
      `Pour être transparent : ${MENTION_ENGAGEMENT}`,
      "",
      c.lienDevis,
      "",
      "Si votre projet se confirme, le plus simple est de valider en ligne. Et si la date a bougé, dites-le moi : je regarde ce qui reste disponible.",
      "",
      ...signature(c),
    ]),
  }),

  ECHEANCE: (c) => ({
    sujet: `Votre devis ${reference(c)} expire le ${echeance(c)}`.replace(/\s+/g, " ").trim(),
    texte: corps([
      bonjour(c.prenom),
      "",
      `Votre devis arrive à échéance le ${echeance(c)}. Passé cette date, les tarifs devront être revus en fonction de nos disponibilités.`,
      "",
      "S'il vous manque un élément pour décider, dites-le moi — un appel de cinq minutes suffit généralement" +
        (c.telephoneCommercial ? ` : ${c.telephoneCommercial}.` : "."),
      "",
      c.lienDevis,
      "",
      ...signature(c),
    ]),
  }),

  CLOTURE: (c) => ({
    sujet: "On garde votre projet de côté",
    texte: corps([
      bonjour(c.prenom),
      "",
      "Sans retour de votre part, je clôture ce devis — sans aucun souci.",
      "",
      "Votre projet reste dans nos dossiers : si l'occasion revient, un message suffit et je vous refais une proposition à jour, sans repartir de zéro.",
      "",
      "Et si vous avez retenu une autre solution, je serais sincèrement curieux de savoir ce qui a fait la différence : cela nous aide à progresser.",
      "",
      ...signature(c),
    ]),
  }),
};

export function composerRelance(cle: CleRelance, contexte: ContexteMessage): MessageRelance {
  return MODELES[cle](contexte);
}
