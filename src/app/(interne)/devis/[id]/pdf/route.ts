import { reponseDevisPdf } from "@/pdf/reponse";

/** Le rendu PDF lit les fontes sur le disque : il lui faut l'execution Node. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Apercu interne du devis, numerote ou non. */
export async function GET(_requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return reponseDevisPdf({ id });
}
