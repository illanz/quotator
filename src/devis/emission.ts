/**
 * Emission d'un devis : attribution du numero et passage a l'etat envoye.
 *
 * Le numero est attribue ici, et nulle part ailleurs. Les regles qui decident
 * si un devis peut le recevoir vivent dans `numerotation.ts`, sans dependance
 * au stockage ; ce module n'en est que le bras.
 */

import { ajouterJours, dateCivile, type DateISO } from "@/domain/calendrier";
import { prisma } from "@/lib/prisma";
import { controlerEmission, type MotifRefus } from "./numerotation";

export type ResultatEmission =
  | { ok: true; numero: number; version: number; valableAu: DateISO }
  | { ok: false; motif: MotifRefus };

/** Lignes qui portent une prestation facturee, par opposition aux titres. */
const PRESTATIONS = new Set(["ANIMATION", "FRAIS_DEPLACEMENT", "LIBRE"]);

/**
 * Attribue son numero au devis et le passe a l'etat envoye.
 *
 * L'increment du compteur et l'ecriture du numero se font dans la meme
 * transaction : deux commerciaux qui emettent au meme instant obtiennent deux
 * numeros distincts, parce que l'increment pose un verrou de ligne que le
 * second attend.
 */
export async function emettreDevis(
  devisId: string,
  parId?: string,
): Promise<ResultatEmission> {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignes: { select: { type: true, optionnelle: true } } },
  });
  if (!devis) return { ok: false, motif: "INTROUVABLE" };

  const motif = controlerEmission({
    statut: devis.statut,
    numero: devis.numero,
    totalHTCents: devis.totalHTCents,
    prestations: devis.lignes.filter((l) => !l.optionnelle && PRESTATIONS.has(l.type)).length,
  });
  if (motif) return { ok: false, motif };

  // La ligne de parametres porte le compteur. Elle est creee a la demande :
  // l'outil doit fonctionner sur une base vierge.
  await prisma.parametres.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });

  return prisma.$transaction(async (tx) => {
    const parametres = await tx.parametres.update({
      where: { id: "global" },
      data: { prochainNumero: { increment: 1 } },
    });
    // L'increment rend le prochain numero ; celui de ce devis est le precedent.
    const numero = parametres.prochainNumero - 1;
    const valableAu = ajouterJours(dateCivile(), parametres.validiteJours);

    const emis = await tx.devis.update({
      where: { id: devisId },
      data: { numero, statut: "ENVOYE", envoyeLe: new Date(), valableAu },
    });

    await tx.devisEvenement.create({
      data: {
        devisId,
        type: "ENVOI",
        detail: `Devis n° ${numero} émis, valable jusqu'au ${valableAu}`,
        parId: parId ?? null,
      },
    });

    return { ok: true as const, numero, version: emis.version, valableAu };
  });
}
