/**
 * Sequence de relance d'un devis.
 *
 * Onze devis sur cent sont acceptes aujourd'hui, et rien ne se passe apres
 * l'envoi : ni relance, ni expiration, ni signal au commercial. C'est le plus
 * gros gisement de l'outil, devant toute amelioration du devis lui-meme.
 *
 * Trois principes gouvernent le calage, et ils sont dans le code parce qu'ils
 * se verifient :
 *
 * 1. **Jamais plus d'un message non lu en attente.** Si une relance n'a pas
 *    ete suivie d'une ouverture, la suivante est decalee plutot qu'empilee.
 *    Deux messages sans reponse dans une boite, c'est un expediteur qu'on
 *    classe.
 * 2. **Chaque relance apporte quelque chose de neuf** — une verification, une
 *    reponse, une echeance. Aucune ne se contente de revenir vers le client.
 * 3. **Le client qui agit sort de la sequence.** Une demande d'ajustement, un
 *    refus ou une acceptation arretent tout immediatement.
 *
 * Ce module ne connait ni le stockage ni l'envoi : il dit quel message est du
 * aujourd'hui, et pourquoi.
 */

import { ajouterJours, type DateISO } from "@/domain/calendrier";

export type CleRelance =
  | "VERIFICATION"
  | "QUESTIONS"
  | "VALEUR"
  | "DISPONIBILITE"
  | "ECHEANCE"
  | "CLOTURE";

/** Ce que la relance attend de l'etat de lecture du devis. */
type Exigence = "NON_OUVERT" | "OUVERT" | "INDIFFERENT";

export type EtapeRelance = {
  rang: number;
  cle: CleRelance;
  /** Jours ecoules depuis l'envoi. */
  jour: number;
  exige: Exigence;
  /** Ne part qu'une fois la validite depassee. */
  apresExpiration?: boolean;
};

/**
 * Le calendrier, cale sur la validite de trente jours.
 *
 * Les deux premieres etapes se distinguent par la lecture : a qui n'a pas
 * ouvert on verifie que le message est arrive, a qui a ouvert on propose de
 * repondre aux questions. Envoyer l'un pour l'autre se voit immediatement.
 */
export const ETAPES: readonly EtapeRelance[] = [
  { rang: 1, cle: "VERIFICATION", jour: 2, exige: "NON_OUVERT" },
  { rang: 2, cle: "QUESTIONS", jour: 4, exige: "OUVERT" },
  { rang: 3, cle: "VALEUR", jour: 8, exige: "INDIFFERENT" },
  { rang: 4, cle: "DISPONIBILITE", jour: 15, exige: "INDIFFERENT" },
  { rang: 5, cle: "ECHEANCE", jour: 25, exige: "INDIFFERENT" },
  { rang: 6, cle: "CLOTURE", jour: 31, exige: "INDIFFERENT", apresExpiration: true },
] as const;

/**
 * Delai minimal apres une relance restee sans ouverture.
 *
 * C'est la mise en oeuvre du premier principe : tant que le client n'a pas
 * rouvert son devis, la relance suivante attend au moins ce delai, meme si sa
 * date est atteinte.
 */
export const DELAI_SI_NON_LU_JOURS = 4;

/** Statuts qui laissent la sequence courir. */
const STATUTS_RELANCABLES = new Set(["ENVOYE", "VU", "EXPIRE"]);

export type EtatDevis = {
  statut: string;
  envoyeLe: Date | null;
  /** Fin de validite, en date civile. */
  valableAu: DateISO | null;
  /** Derniere ouverture du lien public, toutes ouvertures confondues. */
  derniereOuverture: Date | null;
  /** Vrai des que le client a ouvert le devis au moins une fois. */
  ouvert: boolean;
  derniereRelance: { rang: number; le: Date } | null;
};

export type Decision =
  | { envoyer: true; etape: EtapeRelance }
  | { envoyer: false; motif: MotifSilence };

export type MotifSilence =
  | "PAS_ENVOYE"
  | "CLIENT_A_AGI"
  | "SEQUENCE_TERMINEE"
  | "TROP_TOT"
  | "ATTEND_UNE_LECTURE"
  | "VALIDITE_COURANTE";

function joursEcoules(depuis: Date, maintenant: Date): number {
  return Math.floor((maintenant.getTime() - depuis.getTime()) / 86_400_000);
}

/**
 * Decide s'il faut relancer aujourd'hui, et avec quel message.
 *
 * Rend aussi le motif du silence : c'est ce qui permet au commercial de
 * comprendre pourquoi un devis dort, et a un test de verifier la regle plutot
 * que son resultat.
 */
export function prochaineRelance(etat: EtatDevis, maintenant: Date = new Date()): Decision {
  if (!etat.envoyeLe) return { envoyer: false, motif: "PAS_ENVOYE" };
  if (!STATUTS_RELANCABLES.has(etat.statut)) return { envoyer: false, motif: "CLIENT_A_AGI" };

  const jours = joursEcoules(etat.envoyeLe, maintenant);
  const expire =
    etat.statut === "EXPIRE" ||
    (etat.valableAu !== null && etat.valableAu < dateCivileDe(maintenant));

  const candidates = ETAPES.filter((etape) => {
    if (etape.rang <= (etat.derniereRelance?.rang ?? 0)) return false;

    // Une etape dont la condition de lecture n'est pas remplie est passee, pas
    // reportee : verifier la bonne reception d'un devis deja lu n'a pas de sens.
    if (etape.exige === "NON_OUVERT" && etat.ouvert) return false;
    if (etape.exige === "OUVERT" && !etat.ouvert) return false;

    // La cloture attend l'expiration ; les autres s'arretent des qu'elle est
    // atteinte — relancer sur un devis perime reviendrait a vendre un prix qui
    // n'est plus garanti.
    return etape.apresExpiration ? expire : !expire;
  });

  if (candidates.length === 0) {
    // Rien a envoyer : soit tout est fait, soit la seule etape restante attend
    // l'expiration du devis.
    const attendExpiration = ETAPES.some(
      (e) => e.rang > (etat.derniereRelance?.rang ?? 0) && e.apresExpiration && !expire,
    );
    return { envoyer: false, motif: attendExpiration ? "VALIDITE_COURANTE" : "SEQUENCE_TERMINEE" };
  }

  // Parmi les etapes dues, la plus avancee.
  //
  // Un client qui ouvre son devis au quinzieme jour ne doit pas recevoir le
  // message prevu pour le quatrieme, puis celui du huitieme deux jours plus
  // tard : il recevrait un rattrapage decale, dont chaque message parlerait
  // d'un moment deja passe. La sequence rejoint le calendrier plutot que de
  // derouler son retard.
  const dues = candidates.filter((etape) => jours >= etape.jour);
  const etape = dues[dues.length - 1];
  if (!etape) return { envoyer: false, motif: "TROP_TOT" };

  if (!lectureSuffisante(etat, maintenant)) {
    return { envoyer: false, motif: "ATTEND_UNE_LECTURE" };
  }

  return { envoyer: true, etape };
}

/**
 * Vrai si l'on peut envoyer sans empiler un second message non lu.
 *
 * Une relance suivie d'une ouverture a ete lue : la suivante peut partir a sa
 * date. Sans ouverture depuis, elle attend `DELAI_SI_NON_LU_JOURS` de plus.
 */
function lectureSuffisante(etat: EtatDevis, maintenant: Date): boolean {
  const derniere = etat.derniereRelance;
  if (!derniere) return true;

  const luDepuis =
    etat.derniereOuverture !== null && etat.derniereOuverture.getTime() > derniere.le.getTime();
  if (luDepuis) return true;

  return joursEcoules(derniere.le, maintenant) >= DELAI_SI_NON_LU_JOURS;
}

/** Date civile d'un instant, dans le fuseau de la societe. */
function dateCivileDe(instant: Date): DateISO {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Date a laquelle une etape deviendra due, pour l'afficher au commercial. */
export function dateEtape(envoyeLe: DateISO, etape: EtapeRelance): DateISO {
  return ajouterJours(envoyeLe, etape.jour);
}
