/**
 * Enregistre les coordonnees bancaires de la societe.
 *
 *     npm run banque -- --iban "FR76 ..." --bic AGRIFRPP882 \
 *       --banque "Credit Agricole d'Ile-de-France" --domiciliation "LA GARENNE COLOMBES"
 *
 * Les valeurs sont passees en arguments et vivent en base, jamais dans le
 * depot : un releve d'identite bancaire figure certes sur chaque devis envoye,
 * mais il n'a rien a faire dans l'historique d'un depot Git, qui peut changer
 * de main ou de visibilite.
 *
 * L'IBAN est verifie avant ecriture. Sans cette verification, une faute de
 * frappe ne se voit nulle part : elle produit un virement rejete deux semaines
 * plus tard.
 */
import { ibanValide } from "../src/domain/iban.ts";
import { prisma } from "../src/lib/prisma.ts";

function argument(nom: string): string | undefined {
  const i = process.argv.indexOf(`--${nom}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const iban = argument("iban");
const bic = argument("bic");
const banque = argument("banque");
const domiciliation = argument("domiciliation");

if (!iban) {
  console.error("Usage : npm run banque -- --iban <IBAN> [--bic <BIC>] [--banque <nom>] [--domiciliation <agence>]");
  process.exit(1);
}

if (!ibanValide(iban)) {
  console.error("IBAN refusé : la clé de contrôle ne tombe pas juste. Rien n'a été écrit.");
  process.exit(1);
}

const parametres = await prisma.parametres.upsert({
  where: { id: "global" },
  create: { id: "global", iban, bic, banque, domiciliation },
  update: { iban, bic, banque, domiciliation },
});

console.log("Coordonnées bancaires enregistrées.");
console.log(`  établissement : ${[parametres.banque, parametres.domiciliation].filter(Boolean).join(" — ") || "—"}`);
console.log(`  IBAN          : …${parametres.iban?.slice(-4)}`);
console.log(`  BIC           : ${parametres.bic ?? "—"}`);

await prisma.$disconnect();
