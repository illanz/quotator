/**
 * Lit ou cale le prochain numero de la serie de devis.
 *
 *     npm run serie                      # affiche l'etat de la serie
 *     npm run serie -- --prochain 19803  # cale le compteur
 *
 * Le calage sert au moment de la mise en service : une base de recette a
 * consomme des numeros, et la serie doit reprendre exactement ou
 * facturation.pro s'est arretee. Il est refuse si un devis porte deja un
 * numero superieur ou egal, parce que la serie deviendrait ambigue — deux
 * devis pour un meme numero, et plus rien ne se justifie devant un controle.
 */
import { PREMIER_NUMERO_DEVIS } from "../src/domain/regles.ts";
import { prisma } from "../src/lib/prisma.ts";

const i = process.argv.indexOf("--prochain");
const demande = i === -1 ? null : Number(process.argv[i + 1]);

const parametres = await prisma.parametres.upsert({
  where: { id: "global" },
  create: { id: "global" },
  update: {},
});

const emis = await prisma.devis.aggregate({
  where: { numero: { not: null } },
  _max: { numero: true },
  _count: true,
});

console.log(`série facturation.pro reprise à : ${PREMIER_NUMERO_DEVIS}`);
console.log(`devis déjà numérotés            : ${emis._count}`);
console.log(`plus haut numéro émis           : ${emis._max.numero ?? "—"}`);
console.log(`prochain numéro                 : ${parametres.prochainNumero}`);

if (demande === null) process.exit(0);

if (!Number.isInteger(demande) || demande < 1) {
  console.error("\n--prochain attend un entier positif.");
  process.exit(1);
}

const plancher = emis._max.numero === null ? 1 : emis._max.numero + 1;
if (demande < plancher) {
  console.error(
    `\nRefusé : le devis n° ${emis._max.numero} existe déjà. ` +
      `Le plus petit prochain numéro admissible est ${plancher}.`,
  );
  process.exit(1);
}

await prisma.parametres.update({
  where: { id: "global" },
  data: { prochainNumero: demande },
});
console.log(`\nProchain numéro calé à ${demande}.`);

await prisma.$disconnect();
