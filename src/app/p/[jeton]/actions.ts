"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Actions ouvertes au client depuis le lien public.
 *
 * Le jeton du lien tient lieu d'authentification : il est long, imprevisible,
 * et ne donne acces qu'a un devis. Exiger en plus une identification avant
 * meme la lecture ajouterait une friction sans rien garantir de plus.
 *
 * L'identite du signataire, elle, est demandee au moment d'accepter : les
 * conditions generales font de la remise du devis « date et signe » la
 * formalisation de la commande.
 */

async function devisParJeton(jeton: string) {
  const devis = await prisma.devis.findUnique({
    where: { jetonPublic: jeton },
    include: { lignes: true },
  });
  if (!devis) throw new Error("Devis introuvable.");
  return devis;
}

/** Adresse d'ou vient l'acceptation, pour l'horodatage probatoire. */
async function adresseAppelante(): Promise<string | null> {
  const entetes = await headers();
  const transmise = entetes.get("x-forwarded-for");
  return transmise?.split(",")[0]?.trim() ?? null;
}

export type ResultatAction = { ok: true } | { ok: false; erreur: string };

export async function accepterDevis(
  jeton: string,
  signataire: { nom: string; fonction: string; email: string },
  optionsRetenues: string[],
): Promise<ResultatAction> {
  const devis = await devisParJeton(jeton);

  if (devis.statut === "ACCEPTE") return { ok: false, erreur: "Ce devis est déjà accepté." };
  if (devis.statut === "EXPIRE") {
    return { ok: false, erreur: "Ce devis a expiré. Contactez-nous pour le remettre à jour." };
  }
  if (!signataire.nom.trim() || !signataire.fonction.trim()) {
    return { ok: false, erreur: "Indiquez votre nom et votre fonction." };
  }

  // Les options retenues par le client font partie de son accord : elles sont
  // consignees avec lui, sans modifier le devis d'origine, qui reste la piece
  // envoyee. Un elargissement du perimetre donnera lieu a une version suivante.
  const retenues = devis.lignes.filter((l) => optionsRetenues.includes(l.id));
  const supplementHTCents = retenues.reduce((s, l) => s + l.totalHTCents, 0);

  await prisma.$transaction([
    prisma.devis.update({
      where: { id: devis.id },
      data: {
        statut: "ACCEPTE",
        accepteLe: new Date(),
        accepteParNom: signataire.nom.trim(),
        accepteParFonction: signataire.fonction.trim(),
        accepteParEmail: signataire.email.trim() || null,
        accepteDepuisIP: await adresseAppelante(),
      },
    }),
    prisma.devisEvenement.create({
      data: {
        devisId: devis.id,
        type: "ACCEPTATION",
        detail: `${signataire.nom.trim()} — ${signataire.fonction.trim()}`,
        donnees: {
          optionsRetenues: retenues.map((l) => ({ id: l.id, designation: l.designation })),
          supplementHTCents,
          totalHTCents: devis.totalHTCents + supplementHTCents,
        } satisfies Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath(`/p/${jeton}`);
  return { ok: true };
}

export async function demanderModification(
  jeton: string,
  motifs: string[],
  message: string,
): Promise<ResultatAction> {
  const devis = await devisParJeton(jeton);
  if (motifs.length === 0 && !message.trim()) {
    return { ok: false, erreur: "Indiquez ce que vous souhaitez ajuster." };
  }

  await prisma.$transaction([
    prisma.devis.update({ where: { id: devis.id }, data: { statut: "EN_DISCUSSION" } }),
    prisma.devisEvenement.create({
      data: {
        devisId: devis.id,
        type: "DEMANDE_MODIFICATION",
        detail: message.trim() || null,
        donnees: { motifs } satisfies Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath(`/p/${jeton}`);
  return { ok: true };
}

export async function declinerDevis(
  jeton: string,
  motifs: string[],
  message: string,
): Promise<ResultatAction> {
  const devis = await devisParJeton(jeton);

  await prisma.$transaction([
    prisma.devis.update({
      where: { id: devis.id },
      data: { statut: "REFUSE", motifRefus: [...motifs, message.trim()].filter(Boolean).join(" — ") },
    }),
    prisma.devisEvenement.create({
      data: {
        devisId: devis.id,
        type: "REFUS",
        detail: message.trim() || null,
        donnees: { motifs } satisfies Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath(`/p/${jeton}`);
  return { ok: true };
}
