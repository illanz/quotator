import type { Palier as PalierPrisma, Prisma } from "@prisma/client";
import { PALIERS } from "@/domain/paliers";
import { prisma } from "@/lib/prisma";
import type { GrilleParsee, LigneGrille } from "./types";

/**
 * Persistance de la grille tarifaire.
 *
 * Un import ne remplace jamais la grille active directement : il est d'abord
 * enregistre en attente, avec ses ecarts, et n'est applique qu'apres validation.
 * Les millesimes precedents restent en base — un devis emis en 2026 doit rester
 * relisible avec les prix de 2026.
 */

export async function grilleActive() {
  return prisma.grille.findFirst({
    where: { active: true },
    include: { lignes: { include: { prix: true }, orderBy: { ligneSource: "asc" } } },
  });
}

type GrilleAvecLignes = NonNullable<Awaited<ReturnType<typeof grilleActive>>>;

/** Reconstruit la forme analysee a partir de la base, pour comparer deux millesimes. */
export function versGrilleParsee(grille: GrilleAvecLignes): GrilleParsee {
  return {
    fichier: grille.fichier,
    version: grille.version,
    millesime: grille.millesime,
    regles: grille.regles,
    avertissements: [],
    lignes: grille.lignes.map(
      (l): LigneGrille => ({
        ligneSource: l.ligneSource,
        libelle: l.libelle,
        cle: l.cle,
        famille: l.famille,
        categorie: l.categorie,
        libreAcces: l.libreAcces,
        regime: l.regime,
        ...(l.regleForfait ? { regleForfait: l.regleForfait } : {}),
        // L'ordre des paliers est celui de la grille, pas l'ordre alphabetique :
        // trier sur le nom placerait « P10_19 » avant « P1_9 ».
        cellules: [...l.prix]
          .sort((a, b) => PALIERS.indexOf(a.palier) - PALIERS.indexOf(b.palier))
          .map((p) => ({
            palier: p.palier,
            kind: p.kind,
            ...(p.prixCents !== null ? { prixCents: p.prixCents } : {}),
            ...(p.texte !== null ? { texte: p.texte } : {}),
          })),
      }),
    ),
  };
}

export async function enregistrerImport(params: {
  parsee: GrilleParsee;
  ecarts: unknown;
  utilisateurId?: string;
}) {
  return prisma.importGrille.create({
    data: {
      fichier: params.parsee.fichier,
      contenu: params.parsee as unknown as Prisma.InputJsonValue,
      ecarts: (params.ecarts ?? null) as Prisma.InputJsonValue,
      avertissements: params.parsee.avertissements,
      ...(params.utilisateurId ? { parId: params.utilisateurId } : {}),
    },
  });
}

/**
 * Applique un import : cree le millesime, y bascule l'activite, et rattache
 * chaque ligne a son animation du catalogue quand la cle correspond.
 *
 * Tout se fait dans une transaction : une grille a moitie importee laisserait
 * des devis sans prix.
 */
export async function appliquerImport(importId: string) {
  const enregistrement = await prisma.importGrille.findUniqueOrThrow({
    where: { id: importId },
  });
  if (enregistrement.statut !== "EN_ATTENTE") {
    throw new Error("Cet import a déjà été traité.");
  }
  const parsee = enregistrement.contenu as unknown as GrilleParsee;

  return prisma.$transaction(async (tx) => {
    await tx.grille.updateMany({ where: { active: true }, data: { active: false } });

    const grille = await tx.grille.create({
      data: {
        millesime: parsee.millesime ?? new Date().getFullYear(),
        version: parsee.version,
        fichier: parsee.fichier,
        regles: parsee.regles,
        active: true,
      },
    });

    for (const ligne of parsee.lignes) {
      // Le catalogue se complete au fil des imports : une animation inconnue
      // est creee, une animation connue est mise a jour sans perdre sa
      // description ni ses liens.
      const animation = await tx.animation.upsert({
        where: { cle: ligne.cle },
        create: {
          cle: ligne.cle,
          nom: ligne.libelle,
          famille: ligne.famille,
          categorie: ligne.categorie,
          libreAcces: ligne.libreAcces,
        },
        update: {
          famille: ligne.famille,
          categorie: ligne.categorie,
          libreAcces: ligne.libreAcces,
        },
      });

      await tx.grilleLigne.create({
        data: {
          grilleId: grille.id,
          animationId: animation.id,
          libelle: ligne.libelle,
          cle: ligne.cle,
          famille: ligne.famille,
          categorie: ligne.categorie,
          libreAcces: ligne.libreAcces,
          regime: ligne.regime,
          regleForfait: ligne.regleForfait ?? null,
          ligneSource: ligne.ligneSource,
          prix: {
            create: ligne.cellules.map((c) => ({
              palier: c.palier as PalierPrisma,
              kind: c.kind,
              prixCents: c.prixCents ?? null,
              texte: c.texte ?? null,
            })),
          },
        },
      });
    }

    await tx.importGrille.update({
      where: { id: importId },
      data: { statut: "APPLIQUE", grilleId: grille.id, applicLe: new Date() },
    });

    return grille;
  });
}

export async function annulerImport(importId: string) {
  return prisma.importGrille.update({
    where: { id: importId },
    data: { statut: "ANNULE" },
  });
}
