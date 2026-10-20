import { prisma } from "@/lib/prisma";
import { reponseDevisPdf } from "@/pdf/reponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Devis PDF accessible au client depuis son lien.
 *
 * Un brouillon n'est pas servi ici : tant que le devis n'a pas de numero, il
 * n'engage personne et n'a pas a circuler sous forme de document. Le
 * telechargement laisse une trace, au meme titre que l'ouverture de la page :
 * un client qui enregistre le devis est un signal commercial.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;

  const devis = await prisma.devis.findUnique({
    where: { jetonPublic: jeton },
    select: { id: true, statut: true },
  });
  if (!devis) return new Response("Devis introuvable", { status: 404 });
  if (devis.statut === "BROUILLON") {
    return new Response("Cette proposition n'est pas encore disponible", { status: 404 });
  }

  await prisma.devisEvenement.create({
    data: { devisId: devis.id, type: "OUVERTURE", detail: "Téléchargement du PDF" },
  });

  return reponseDevisPdf({ jetonPublic: jeton });
}
