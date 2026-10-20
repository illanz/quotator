/**
 * Production du devis PDF.
 *
 * Le document est rendu a la demande plutot que stocke : il ne contient que des
 * donnees deja enregistrees, et un devis emis se recompose a l'identique tant
 * que ses lignes et ses totaux ne changent pas. Cela evite d'avoir a invalider
 * un fichier a chaque correction, et garantit qu'aucun PDF perime ne circule
 * sous le meme numero.
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { DocumentDevis } from "./devis-document";
import { composerDevisPdf, type DevisPdf } from "./donnees";

/** Rendu binaire du document, pret a etre servi ou joint a un courriel. */
export async function rendreDevisPdf(devis: DevisPdf): Promise<Buffer> {
  return renderToBuffer(<DocumentDevis devis={devis} />);
}

/**
 * Nom de fichier du devis.
 *
 * Il doit rester lisible dans une boite de reception et triable dans un
 * dossier client : le numero d'abord, puis le client, sans accent ni espace.
 */
export function nomFichierDevis(devis: DevisPdf): string {
  const client = devis.client.nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const reference = devis.numero ? String(devis.numero) : "brouillon";
  const version = devis.version > 1 ? `-v${devis.version}` : "";
  return `Devis_${reference}${version}_MadCityZen_${client}.pdf`;
}

/** Charge un devis et compose la charge utile du document. */
export async function devisPourPdf(
  ou: { id: string } | { jetonPublic: string },
): Promise<DevisPdf | null> {
  const devis = await prisma.devis.findUnique({
    where: ou,
    include: {
      organisation: true,
      etablissement: true,
      contact: true,
      commercial: true,
      lignes: { orderBy: { position: "asc" } },
    },
  });
  if (!devis) return null;

  const parametres = await prisma.parametres.findUnique({ where: { id: "global" } });
  return composerDevisPdf(devis, parametres);
}
