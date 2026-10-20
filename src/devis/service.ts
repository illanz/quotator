import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Palier } from "@/domain/paliers";
import { prisma } from "@/lib/prisma";
import { calculerDevis, type DevisInput, type LigneCalculee } from "@/pricing/engine";
import { grilleActive } from "@/tarifs/service";
import { animateursPour } from "./animateurs";
import { nomCommercial, type AnimationVendable } from "./catalogue";
import { analyserDesignation, designationEnTexte, rendreDesignation } from "./designation";

export type { AnimationVendable } from "./catalogue";
export { palierPourDemande, nomCommercial } from "./catalogue";

export async function catalogueVendable(): Promise<{
  millesime: number | null;
  animations: AnimationVendable[];
}> {
  const grille = await grilleActive();
  if (!grille) return { millesime: null, animations: [] };

  const animations = grille.lignes.map((ligne): AnimationVendable => {
    const prixParPalier: Partial<Record<Palier, number | null>> = {};
    const mentionParPalier: Partial<Record<Palier, string>> = {};

    for (const prix of ligne.prix) {
      if (prix.kind === "PRIX") prixParPalier[prix.palier] = prix.prixCents;
      else if (prix.kind !== "VIDE") {
        mentionParPalier[prix.palier] =
          prix.kind === "CONSULTER"
            ? "Nous consulter"
            : prix.kind === "SUR_DEMANDE"
              ? "Sur demande"
              : prix.kind === "INDISPONIBLE"
                ? "Non proposée à ce palier"
                : (prix.texte ?? "");
      }
    }

    return {
      cle: ligne.cle,
      nom: nomCommercial(ligne.libelle),
      famille: ligne.famille,
      libreAcces: ligne.libreAcces,
      regime: ligne.regime,
      regleForfait: ligne.regleForfait,
      descriptionHtml: ligne.animation?.descriptionHtml ?? null,
      dureeStandard: ligne.animation?.dureeStandard ?? null,
      prixParPalier,
      mentionParPalier,
    };
  });

  return { millesime: grille.millesime, animations };
}

/** Designation prete a figurer sur le devis, marqueurs remplis. */
export function designationPour(
  animation: AnimationVendable,
  contexte: { palierLabel?: string | null; duree?: string | null },
): { texte: string; aCompleter: string[] } {
  if (!animation.descriptionHtml) {
    return { texte: animation.nom, aCompleter: [] };
  }
  const effectif = null; // renseigne par l'appelant via `effectifAnimateurs`
  const { designation, aCompleter } = rendreDesignation(
    analyserDesignation(animation.descriptionHtml),
    {
      palier: contexte.palierLabel ?? null,
      duree: contexte.duree ?? animation.dureeStandard ?? null,
      animateurs: effectif,
    },
  );
  return { texte: designationEnTexte(designation), aCompleter };
}

/** Effectif a annoncer, ou la raison pour laquelle il reste a saisir. */
export function effectifAnimateurs(cle: string, palier: Palier | null) {
  if (!palier) return null;
  const r = animateursPour(cle, palier);
  return r.connu ? r.effectif : null;
}

export type EnregistrementDevis = {
  organisationId: string;
  contactId?: string | null;
  input: DevisInput;
  grilleMillesime: number | null;
  pax?: number | null;
  paxMax?: number | null;
};

/**
 * Enregistre un brouillon.
 *
 * Le devis n'a pas de numero a ce stade : il est attribue a l'envoi, pour que
 * la serie reste continue meme si des brouillons sont abandonnes.
 */
export async function enregistrerBrouillon(donnees: EnregistrementDevis) {
  const calcul = calculerDevis(donnees.input);
  const commercial = await commercialParDefaut();

  return prisma.devis.create({
    data: {
      statut: "BROUILLON",
      organisationId: donnees.organisationId,
      contactId: donnees.contactId ?? null,
      commercialId: commercial.id,
      titre: donnees.input.titre,
      dateEvent: donnees.input.dateEvent ?? null,
      ville: donnees.input.ville ?? null,
      codePostal: donnees.input.codePostal ?? null,
      pax: donnees.pax ?? null,
      paxMax: donnees.paxMax ?? null,
      majoration: calcul.majorationAppliquee,
      kmAllerRetour: donnees.input.kmAllerRetour ?? null,
      grilleMillesime: donnees.grilleMillesime,
      totalHTCents: calcul.totalHTCents,
      totalTVACents: calcul.totalTVACents,
      totalTTCCents: calcul.totalTTCCents,
      totalOptionsCents: calcul.totalOptionsHTCents,
      acompteCents: calcul.acompteCents,
      jetonPublic: randomUUID(),
      lignes: { create: calcul.lignes.map(versLigneBase) },
      evenements: { create: { type: "CREATION", parId: commercial.id } },
    },
  });
}

function versLigneBase(ligne: LigneCalculee) {
  return {
    position: ligne.position,
    type: ligne.type,
    designation: ligne.designation,
    designationStructuree: (ligne.designationStructuree ?? null) as Prisma.InputJsonValue,
    prixUnitaireCents: ligne.prixUnitaireCents,
    quantite: ligne.quantite,
    tvaPct: ligne.tvaPct,
    totalHTCents: ligne.totalHTCents,
    optionnelle: ligne.optionnelle,
  };
}

/**
 * Utilisateur rattache aux devis tant que l'authentification n'existe pas.
 *
 * Volontairement cree a la demande plutot que suppose present : l'outil doit
 * fonctionner sur une base vierge.
 */
export async function commercialParDefaut() {
  return prisma.utilisateur.upsert({
    where: { email: "illanz@madcityzen.fr" },
    create: { email: "illanz@madcityzen.fr", nom: "Illan", role: "ADMIN" },
    update: {},
  });
}
