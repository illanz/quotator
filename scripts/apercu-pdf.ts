/**
 * Rend le devis le plus recent en PDF, pour relire la mise en page sans passer
 * par le navigateur.
 *
 *     npm run pdf:apercu -- [chemin de sortie] [id du devis]
 */
import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma.ts";
import { devisPourPdf, nomFichierDevis, rendreDevisPdf } from "../src/pdf/service.tsx";

const sortie = process.argv[2] ?? "/tmp/apercu-devis.pdf";
const id = process.argv[3];

const choisi =
  id ??
  (await prisma.devis.findFirst({ orderBy: { creeLe: "desc" }, select: { id: true } }))?.id;

if (!choisi) {
  console.error("Aucun devis en base.");
  process.exit(1);
}

const devis = await devisPourPdf({ id: choisi });
if (!devis) {
  console.error(`Devis ${choisi} introuvable.`);
  process.exit(1);
}

writeFileSync(sortie, await rendreDevisPdf(devis));

console.log(`${nomFichierDevis(devis)} → ${sortie}`);
console.log(
  `  ${devis.fermes.length} ligne(s) ferme(s), ${devis.options.length} option(s), ` +
    `total TTC ${devis.totalTTCCents / 100} €`,
);

await prisma.$disconnect();
