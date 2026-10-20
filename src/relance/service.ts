/**
 * Execution du cycle : expiration des devis, puis relances dues.
 *
 * L'ordre compte. Un devis dont la validite vient de tomber doit etre marque
 * expire avant que la sequence ne soit evaluee, sinon il recevrait une relance
 * vantant des tarifs qui ne sont plus garantis.
 */

import type { Prisma } from "@prisma/client";
import { courrier } from "@/courrier/expediteur";
import { urlApplication } from "@/auth/service";
import { formaterDateLongue } from "@/devis/titre";
import { dateCivile } from "@/domain/calendrier";
import { prisma } from "@/lib/prisma";
import { composerRelance } from "./messages";
import { referenceSecteur } from "./reference";
import { prochaineRelance, type Decision, type EtatDevis } from "./sequence";

/**
 * Marque expires les devis dont la validite est passee.
 *
 * L'expiration est calculee, jamais planifiee : un serveur arrete pendant deux
 * jours ne doit pas laisser des devis perimes a l'etat « envoye ».
 */
export async function expirerDevis(aujourdHui = dateCivile()): Promise<number> {
  const perimes = await prisma.devis.findMany({
    where: {
      statut: { in: ["ENVOYE", "VU"] },
      valableAu: { not: null, lt: aujourdHui },
    },
    select: { id: true, numero: true },
  });

  for (const devis of perimes) {
    await prisma.$transaction([
      prisma.devis.update({ where: { id: devis.id }, data: { statut: "EXPIRE" } }),
      prisma.devisEvenement.create({
        data: {
          devisId: devis.id,
          type: "EXPIRATION",
          detail: `Validité dépassée le ${formaterDateLongue(aujourdHui)}`,
        },
      }),
    ]);
  }

  return perimes.length;
}

const INCLUSION = {
  organisation: true,
  contact: true,
  commercial: true,
  lignes: { where: { type: "ANIMATION" as const }, orderBy: { position: "asc" as const }, take: 1 },
  evenements: {
    where: { type: { in: ["OUVERTURE", "RELANCE"] as const } },
    orderBy: { creeLe: "desc" as const },
  },
} satisfies Prisma.DevisInclude;

type DevisComplet = Prisma.DevisGetPayload<{ include: typeof INCLUSION }>;

/** Reconstitue l'etat attendu par la sequence a partir du journal du devis. */
export function etatDepuisDevis(devis: DevisComplet): EtatDevis {
  const ouvertures = devis.evenements.filter((e) => e.type === "OUVERTURE");
  const relances = devis.evenements.filter((e) => e.type === "RELANCE");

  // Les evenements arrivent du plus recent au plus ancien.
  const derniereRelance = relances[0];
  const rang =
    derniereRelance && typeof derniereRelance.donnees === "object" && derniereRelance.donnees
      ? Number((derniereRelance.donnees as { rang?: unknown }).rang)
      : NaN;

  return {
    statut: devis.statut,
    envoyeLe: devis.envoyeLe,
    valableAu: devis.valableAu,
    ouvert: ouvertures.length > 0,
    derniereOuverture: ouvertures[0]?.creeLe ?? null,
    derniereRelance:
      derniereRelance && Number.isFinite(rang)
        ? { rang, le: derniereRelance.creeLe }
        : null,
  };
}

export type ResultatRelance = {
  devisId: string;
  numero: number | null;
  decision: Decision;
  envoye: boolean;
  /** Renseigne quand la relance n'a pas pu partir. */
  empechement?: string;
};

/**
 * Parcourt les devis en cours et envoie ce qui est du.
 *
 * Chaque devis est traite isolement : l'echec d'un envoi ne doit pas priver
 * les suivants de leur relance.
 */
export async function relancerDevis(maintenant = new Date()): Promise<ResultatRelance[]> {
  const devis = await prisma.devis.findMany({
    where: { statut: { in: ["ENVOYE", "VU", "EXPIRE"] }, envoyeLe: { not: null } },
    include: INCLUSION,
  });

  const resultats: ResultatRelance[] = [];

  for (const d of devis) {
    const decision = prochaineRelance(etatDepuisDevis(d), maintenant);
    if (!decision.envoyer) {
      resultats.push({ devisId: d.id, numero: d.numero, decision, envoye: false });
      continue;
    }

    const destinataire = d.contact?.email;
    if (!destinataire) {
      // Sans adresse, la sequence resterait bloquee a tout jamais sur cette
      // etape : le commercial doit le voir dans le compte rendu.
      resultats.push({
        devisId: d.id,
        numero: d.numero,
        decision,
        envoye: false,
        empechement: "Aucune adresse de contact sur ce devis.",
      });
      continue;
    }

    const animation = d.lignes[0];
    const nomAnimation = animation
      ? (animation.designation.split("\n")[0] ?? d.titre)
      : d.titre;

    const message = composerRelance(decision.etape.cle, {
      prenom: d.contact?.prenom ?? null,
      animation: nomAnimation,
      dateEvent: d.dateEvent,
      ville: d.ville,
      numero: d.numero,
      valableAu: d.valableAu,
      lienDevis: `${urlApplication()}/p/${d.jetonPublic}`,
      commercial: d.commercial.nom,
      telephoneCommercial: d.commercial.telephone,
      referenceSecteur:
        decision.etape.cle === "VALEUR" && animation?.animationId
          ? await referencePour(animation.animationId, nomAnimation, d.organisationId)
          : null,
    });

    const envoi = await courrier().envoyer({
      a: { email: destinataire, nom: nomContact(d.contact) },
      sujet: message.sujet,
      texte: message.texte,
      reference: `relance-${d.numero ?? d.id}-${decision.etape.cle.toLowerCase()}`,
    });

    if (!envoi.ok) {
      resultats.push({
        devisId: d.id,
        numero: d.numero,
        decision,
        envoye: false,
        empechement: envoi.erreur,
      });
      continue;
    }

    // La trace n'est ecrite qu'apres un envoi reussi : un echec doit pouvoir
    // etre retente au prochain passage, pas etre compte comme fait.
    await prisma.devisEvenement.create({
      data: {
        devisId: d.id,
        type: "RELANCE",
        detail: message.sujet,
        donnees: { rang: decision.etape.rang, cle: decision.etape.cle },
      },
    });

    resultats.push({ devisId: d.id, numero: d.numero, decision, envoye: true });
  }

  return resultats;
}

function nomContact(contact: DevisComplet["contact"]): string | null {
  if (!contact) return null;
  const nom = [contact.prenom, contact.nom].filter(Boolean).join(" ").trim();
  return nom === "" ? null : nom;
}

/** Reference sectorielle, si l'historique en porte une. */
async function referencePour(
  animationId: string,
  nom: string,
  organisationId: string,
): Promise<string | null> {
  const [animation, organisation] = await Promise.all([
    prisma.animation.findUnique({ where: { id: animationId }, select: { cle: true } }),
    prisma.organisation.findUnique({ where: { id: organisationId }, select: { secteur: true } }),
  ]);
  if (!animation) return null;

  return referenceSecteur({
    cle: animation.cle,
    nom,
    secteur: organisation?.secteur ?? null,
  });
}
