/**
 * Cree ou met a jour un compte, et liste les comptes existants.
 *
 *     npm run utilisateur
 *     npm run utilisateur -- --email illanz@madcityzen.fr --nom Illan --role ADMIN
 *     npm run utilisateur -- --email ancien@madcityzen.fr --desactiver
 *
 * Il n'y a pas d'inscription libre : l'outil porte toute la base clients, et
 * un formulaire ouvert y serait une porte ouverte. Les comptes se creent donc
 * ici, ou plus tard depuis un ecran d'administration.
 *
 * Un depart se traite par `--desactiver` et non par une suppression : les
 * devis emis restent rattaches a leur commercial, et cette trace doit survivre
 * a son depart.
 */
import { prisma } from "../src/lib/prisma.ts";

function argument(nom: string): string | undefined {
  const i = process.argv.indexOf(`--${nom}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const email = argument("email")?.trim().toLowerCase();
const nom = argument("nom");
const role = argument("role")?.toUpperCase();
const desactiver = process.argv.includes("--desactiver");
const reactiver = process.argv.includes("--reactiver");

if (!email) {
  const comptes = await prisma.utilisateur.findMany({ orderBy: { creeLe: "asc" } });
  if (comptes.length === 0) {
    console.log("Aucun compte. En créer un :");
    console.log("  npm run utilisateur -- --email vous@madcityzen.fr --nom Vous --role ADMIN");
  }
  for (const c of comptes) {
    console.log(`${c.actif ? "●" : "○"} ${c.email.padEnd(32)} ${c.role.padEnd(10)} ${c.nom}`);
  }
  await prisma.$disconnect();
  process.exit(0);
}

if (role && role !== "ADMIN" && role !== "COMMERCIAL") {
  console.error("--role attend ADMIN ou COMMERCIAL.");
  process.exit(1);
}

const existant = await prisma.utilisateur.findUnique({ where: { email } });

if (!existant && !nom) {
  console.error(`Compte inconnu : ${email}. Pour le créer, préciser --nom.`);
  process.exit(1);
}

const compte = await prisma.utilisateur.upsert({
  where: { email },
  create: {
    email,
    nom: nom!,
    role: (role as "ADMIN" | "COMMERCIAL") ?? "COMMERCIAL",
    actif: !desactiver,
  },
  update: {
    ...(nom ? { nom } : {}),
    ...(role ? { role: role as "ADMIN" | "COMMERCIAL" } : {}),
    ...(desactiver ? { actif: false } : {}),
    ...(reactiver ? { actif: true } : {}),
  },
});

console.log(
  `${existant ? "Compte mis à jour" : "Compte créé"} : ${compte.email} — ${compte.nom} (${compte.role})${compte.actif ? "" : " — désactivé"}`,
);

// Un compte desactive ne doit plus pouvoir se connecter avec un lien en vol.
if (desactiver) {
  const { count } = await prisma.jetonConnexion.updateMany({
    where: { utilisateurId: compte.id, utiliseLe: null },
    data: { utiliseLe: new Date() },
  });
  if (count > 0) console.log(`  ${count} lien(s) de connexion en cours annulé(s).`);
}

await prisma.$disconnect();
