/**
 * Cycle quotidien : expiration des devis perimes, puis relances dues.
 *
 *     npm run cycle              # execute
 *     npm run cycle -- --blanc   # montre ce qui partirait, sans rien envoyer
 *
 * Lance chaque matin par `quotator-cycle.timer`. Il est volontairement
 * idempotent : le rejouer dans la journee n'envoie rien de plus, puisque
 * chaque relance laisse une trace qui fait avancer la sequence.
 */
import { prisma } from "../src/lib/prisma.ts";
import { expirerDevis, etatDepuisDevis, relancerDevis } from "../src/relance/service.ts";
import { prochaineRelance } from "../src/relance/sequence.ts";

const blanc = process.argv.includes("--blanc");

const expires = blanc ? 0 : await expirerDevis();
if (!blanc && expires > 0) console.log(`${expires} devis passé(s) à expiré.`);

if (blanc) {
  // Lecture seule : on montre la decision sans rien ecrire ni envoyer.
  const devis = await prisma.devis.findMany({
    where: { statut: { in: ["ENVOYE", "VU", "EXPIRE"] }, envoyeLe: { not: null } },
    include: {
      evenements: { where: { type: { in: ["OUVERTURE", "RELANCE"] } }, orderBy: { creeLe: "desc" } },
      organisation: true,
      contact: true,
      commercial: true,
      lignes: { where: { type: "ANIMATION" }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  for (const d of devis) {
    const decision = prochaineRelance(etatDepuisDevis(d));
    const quoi = decision.envoyer ? `→ ${decision.etape.cle}` : `· ${decision.motif}`;
    console.log(`  n° ${String(d.numero ?? "—").padEnd(6)} ${quoi.padEnd(24)} ${d.organisation.nom}`);
  }
  console.log(`\n${devis.length} devis examiné(s). Rien n'a été envoyé.`);
} else {
  const resultats = await relancerDevis();
  const partis = resultats.filter((r) => r.envoye);
  const empeches = resultats.filter((r) => r.empechement);

  for (const r of partis) {
    console.log(`  → n° ${r.numero ?? "—"} : ${r.decision.envoyer && r.decision.etape.cle}`);
  }
  for (const r of empeches) {
    console.log(`  ! n° ${r.numero ?? "—"} : ${r.empechement}`);
  }
  console.log(
    `\n${resultats.length} devis examiné(s), ${partis.length} relance(s) envoyée(s)` +
      (empeches.length > 0 ? `, ${empeches.length} empêchement(s).` : "."),
  );
}

await prisma.$disconnect();
