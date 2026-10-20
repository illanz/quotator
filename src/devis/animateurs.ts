import { PALIERS, type Palier } from "@/domain/paliers";

/**
 * Nombre d'animateurs par animation et par palier de participants.
 *
 * Reprise de la base Notion « Nombre d'animateurs par activité TB », figee ici
 * pour ne pas mettre une dependance externe sur le chemin critique de la
 * creation d'un devis. La table est editable dans l'outil.
 *
 * **La mention d'assistant n'apparait jamais sur un devis.** La source indique
 * parfois « 1 artiste et 1 assistant MCZ » : seul l'encadrement principal est
 * annonce au client. Le retrait est fait au rendu, pas a la saisie, pour que la
 * donnee d'exploitation reste complete.
 */

export type LigneAnimateurs = {
  /** Cle de l'animation, alignee sur celle de la grille tarifaire. */
  cle: string;
  nom: string;
  /** Effectif par palier, dans l'ordre des dix tranches. `null` = non renseigne. */
  effectifs: Array<string | null>;
};

/** Les neuf premiers paliers sont documentes ; 240+ ne l'est pas. */
const T = (...valeurs: Array<string | null>): Array<string | null> => {
  const complet = [...valeurs];
  while (complet.length < PALIERS.length) complet.push(null);
  return complet;
};

export const ANIMATEURS: LigneAnimateurs[] = [
  { cle: "BATUCADA", nom: "Batucada", effectifs: T("1 coach", "1 coach", "1 coach", "1 coach et 1 assistant MCZ", "1 coach et 1 assistant MCZ", "1 coach et 1 assistant MCZ", "1 coach et 2 assistants MCZ", "1 coach et 2 assistants MCZ", "1 coach et 2 assistants MCZ") },
  { cle: "BODY PERCUSSION", nom: "Body Perc", effectifs: T("1 (1 coach supp tous les 50 pax)", "1", "1", "1", "2", "2", "2", "3", "4") },
  { cle: "CARNAVAL SAMBA", nom: "Carnaval Samba", effectifs: T("3", "3", "3", "3", "3", "3") },
  { cle: "CHANT", nom: "Chant", effectifs: T("1") },
  { cle: "CLIP DUB", nom: "Clip Dub", effectifs: T("3", "3", "3", "3", "4", "4", "6 et 1 assistant MCZ", "6 et 1 assistant MCZ", "8") },
  { cle: "CREATION DE COCKTAILS", nom: "Cocktails", effectifs: T("1", "1", "1", "2") },
  { cle: "COURTS METRAGES CAMERAS PRO", nom: "Courts Métrages caméras", effectifs: T("1", "1", "1", "2", "3", "4", "5", "6", "8") },
  { cle: "COURTS METRAGES TABLETTES", nom: "Courts Métrages tablettes", effectifs: T("1", "1", "1", "2", "2", "3", "4", "5", "6") },
  { cle: "CREACYCLE", nom: "Creacycle", effectifs: T("1", "1", "1", "2", "2", "3", "3", "4", "5") },
  { cle: "DESTRUCTION CONSTRUCTIVE", nom: "Destruction Constructive", effectifs: T("2 anim. MCZ et 1 anim. mosaïque", "2 anim. MCZ et 1 anim. mosaïque", "2 anim. MCZ et 1 anim. mosaïque", "2 anim. MCZ et 1 anim. mosaïque", "2 anim. MCZ et 1 anim. mosaïque", "2 anim. MCZ, 2 anim. Mosaïque et 1 anim. Yoga", "2 anim. MCZ, 2 anim. Mosaïque et 1 anim. Yoga", "2 anim. MCZ, 3 anim. Mosaïque et 2 anim. Yoga", "2 anim. MCZ, 3 anim. Mosaïque, 2 anim. Yoga et 1 anim. Théâtre") },
  { cle: "DOUBLAGE", nom: "Doublage", effectifs: T("1", "1", "1", "2", "2", "3", "4", "4", "5") },
  { cle: "ESCAPE GAME SPACE K", nom: "Escape Game Entreprise - Space K", effectifs: T("1", "1", "2", "2", "3", "4", "5", "7", "7") },
  { cle: "ESCAPE GAME VISIO", nom: "Escape Game Visio", effectifs: T("1", "1", "1", "2", "2", "3", "4", "5", "6") },
  { cle: "FLASH MOB", nom: "Flash Mob", effectifs: T("1", "1", "1", "1", "2", "2", "2", "3", "3") },
  { cle: "FRESQUE CLASSIQUE", nom: "Fresque", effectifs: T("1 artiste", "1 artiste", "1 artiste et 1 assistant MCZ", "2 artistes et 1 assistant MCZ", "2 artistes et 1 assistant MCZ", "3 artistes et 1 assistant MCZ", "4 artistes et 1 assistant MCZ", "5 artistes et 1 assistant MCZ", "6 artistes et 1 assistant MCZ") },
  { cle: "GRAFFITI", nom: "Graffiti", effectifs: T("1 artiste et 1 assistant MCZ", "1 artiste et 1 assistant MCZ", "1 artiste et 1 assistant MCZ", "2 artistes et 1 assistant MCZ", "2 artistes et 1 assistant MCZ", "3 artistes et 1 assistant MCZ", "4 artistes et 1 assistant MCZ", "5 artistes et 1 assistant MCZ", "6 artistes et 1 assistant MCZ") },
  { cle: "GREEN TAG", nom: "Green Tag", effectifs: T("1", "1", "1", "2", "2", "3", "3", "4", "5") },
  { cle: "HOME CHALLENGE", nom: "Home Challenge", effectifs: T("1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique") },
  { cle: "HOME COOKING", nom: "Home Cooking", effectifs: T("1 chef", "1 chef", "2 chefs", "2 chefs", "3 chefs", "4 chefs", "6 chefs", "8 chefs", "10 chefs") },
  { cle: "LEGO MANIA", nom: "Lego Mania", effectifs: T("1", "1", "1", "2", "2", "3", "4", "4", "5") },
  { cle: "MAD BURGER", nom: "Mad Burger", effectifs: T("1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique") },
  { cle: "MOSAIQUE", nom: "Mosaique", effectifs: T("1", "1", "1", "2", "2", "4", "6", "8", "10") },
  { cle: "PATISSERIE", nom: "Patisserie", effectifs: T("1", "1", "2", "3", "4", "5", "6", "7", "8") },
  { cle: "QI GONG", nom: "Qi Gong", effectifs: T("1", "1", "1", "2", "3", "4", "5", "6", "7") },
  { cle: "QUIZ MCZ", nom: "Quiz MCZ", effectifs: T("1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique") },
  { cle: "QUIZ RACE", nom: "Quiz Race", effectifs: T("1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique", "1 anim. et 1 régisseur technique") },
  { cle: "RALLYE INTERACTIF", nom: "Rallye Interactif", effectifs: T("1", "1", "1", "1", "1", "2", "2", "2", "2") },
  { cle: "ROBOTS MAKERS", nom: "Robots Makers", effectifs: T("1", "1", "1", "2", "2", "2", "2", "3", "3") },
  { cle: "SUSHIS", nom: "Sushis", effectifs: T("1", "1", "2", "3", "4", "5", "6", "7", "8") },
  { cle: "TAP TAP", nom: "Tap Tap", effectifs: T("1 coach", "1 coach", "1 coach", "1 coach et 1 assistant MCZ", "1 coach et 1 assistant MCZ", "1 coach et 1 assistant MCZ", "1 coach et 2 assistants MCZ", "1 coach et 2 assistants MCZ", "1 coach et 2 assistants MCZ") },
  { cle: "TEAM HAKA ICE BREAKER", nom: "Team Haka Ice Breaker", effectifs: T("2", "2", "2", "2", "2", "2", "3", "3", "4") },
  { cle: "TEAM HAKA", nom: "Team Haka TB", effectifs: T("2", "2", "2", "2", "2", "3", "4", "4", "5") },
  { cle: "THEATRE", nom: "Théâtre", effectifs: T("1", "1", "1", "1", "1", "1", "1", "1", "1") },
  { cle: "YOGA", nom: "Yoga", effectifs: T("1", "1", "1", "2", "3", "4", "5", "6", "7") },
];

const INDEX = new Map(ANIMATEURS.map((a) => [a.cle, a]));

/**
 * Retire toute mention d'assistant d'un effectif.
 *
 * « 1 artiste et 1 assistant MCZ » devient « 1 artiste » ; « 2 anim. MCZ,
 * 2 anim. Mosaïque et 1 anim. Yoga » est conserve tel quel, car aucun de ces
 * intervenants n'est un assistant.
 */
export function sansAssistants(effectif: string): string {
  return effectif
    .replace(/\s*(,|et)\s*\d+\s*assistants?\s*(MCZ)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export type EffectifAnimateurs =
  | { connu: true; effectif: string; effectifComplet: string }
  | { connu: false; raison: "ANIMATION_INCONNUE" | "PALIER_NON_RENSEIGNE" };

/**
 * Effectif a annoncer sur le devis pour une animation et un palier.
 *
 * Retourne l'ignorance plutot qu'une valeur par defaut : un nombre
 * d'animateurs invente sur un devis engage MadCityZen contractuellement.
 */
export function animateursPour(cle: string, palier: Palier): EffectifAnimateurs {
  const ligne = INDEX.get(cle);
  if (!ligne) return { connu: false, raison: "ANIMATION_INCONNUE" };

  const effectifComplet = ligne.effectifs[PALIERS.indexOf(palier)];
  if (!effectifComplet) return { connu: false, raison: "PALIER_NON_RENSEIGNE" };

  return { connu: true, effectif: sansAssistants(effectifComplet), effectifComplet };
}
