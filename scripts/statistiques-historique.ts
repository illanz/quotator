/**
 * Lecture de l'historique commercial reconstruit.
 *
 * Ce script n'ecrit rien : il montre ce que la base permet de repondre, et sert
 * de specification aux ecrans a construire.
 */
import { prisma } from "../src/lib/prisma.ts";

const euros = (cents: number) => `${Math.round(cents / 100).toLocaleString("fr-FR")} €`;
const titre = (t: string) => console.log(`\n\x1b[1m${t}\x1b[0m\n${"─".repeat(t.length)}`);

const evenements = await prisma.evenement.findMany({
  include: { animations: true, organisation: true },
});

titre("Volume");
const total = evenements.reduce((s, e) => s + e.caHTCents, 0);
console.log(`${evenements.length} événements — ${euros(total)} HT`);
console.log(`${new Set(evenements.map((e) => e.organisationId)).size} clients`);
console.log(`panier moyen : ${euros(total / evenements.length)}`);

titre("Par année");
const parAnnee = new Map<number, { n: number; ca: number }>();
for (const e of evenements) {
  const a = parAnnee.get(e.annee) ?? { n: 0, ca: 0 };
  a.n++;
  a.ca += e.caHTCents;
  parAnnee.set(e.annee, a);
}
for (const [annee, a] of [...parAnnee.entries()].sort((x, y) => x[0] - y[0])) {
  console.log(
    `${annee}  ${String(a.n).padStart(4)} événements  ${euros(a.ca).padStart(12)}  panier ${euros(a.ca / a.n).padStart(9)}`,
  );
}

titre("Animations les plus vendues");
const parAnimation = new Map<string, { n: number; ca: number; famille: string }>();
for (const e of evenements) {
  for (const a of e.animations) {
    const x = parAnimation.get(a.nom) ?? { n: 0, ca: 0, famille: a.famille };
    x.n++;
    x.ca += a.montantCents;
    parAnimation.set(a.nom, x);
  }
}
for (const [nom, x] of [...parAnimation.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 20)) {
  console.log(`${String(x.n).padStart(4)} × ${nom.padEnd(26)} ${euros(x.ca).padStart(12)}  ${x.famille}`);
}

titre("Par famille d'animation");
const parFamille = new Map<string, { n: number; ca: number }>();
for (const e of evenements) {
  for (const a of e.animations) {
    const x = parFamille.get(a.famille) ?? { n: 0, ca: 0 };
    x.n++;
    x.ca += a.montantCents;
    parFamille.set(a.famille, x);
  }
}
for (const [f, x] of [...parFamille.entries()].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`${String(x.n).padStart(4)} × ${f.padEnd(26)} ${euros(x.ca).padStart(12)}`);
}

titre("Client direct ou agence");
const direct = evenements.filter((e) => !e.organisation.estAgence);
const agence = evenements.filter((e) => e.organisation.estAgence);
const ca = (l: typeof evenements) => l.reduce((s, e) => s + e.caHTCents, 0);
console.log(`clients directs : ${direct.length} événements, ${euros(ca(direct))}`);
console.log(`agences         : ${agence.length} événements, ${euros(ca(agence))}`);

titre("Par secteur — clients directs seulement");
const parSecteur = new Map<string, { n: number; ca: number; clients: Set<string> }>();
for (const e of direct) {
  const s = e.organisation.secteur ?? "Non classé";
  const x = parSecteur.get(s) ?? { n: 0, ca: 0, clients: new Set<string>() };
  x.n++;
  x.ca += e.caHTCents;
  x.clients.add(e.organisationId);
  parSecteur.set(s, x);
}
for (const [s, x] of [...parSecteur.entries()].sort((a, b) => b[1].ca - a[1].ca)) {
  console.log(
    `${s.padEnd(36)} ${String(x.n).padStart(4)} év.  ${String(x.clients.size).padStart(4)} clients  ${euros(x.ca).padStart(12)}`,
  );
}

titre("Ce que chaque secteur achète — top 3 par secteur");
for (const [s, x] of [...parSecteur.entries()].sort((a, b) => b[1].ca - a[1].ca)) {
  if (s === "Non classé" || x.n < 5) continue;
  const compte = new Map<string, number>();
  for (const e of direct.filter((e) => (e.organisation.secteur ?? "Non classé") === s)) {
    for (const a of e.animations) compte.set(a.nom, (compte.get(a.nom) ?? 0) + 1);
  }
  const top = [...compte.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nom, n]) => `${nom} (${n})`)
    .join(", ");
  console.log(`${s.padEnd(36)} ${top}`);
}

titre("Fidélité");
const parClient = new Map<string, { n: number; ca: number; nom: string }>();
for (const e of evenements) {
  const x = parClient.get(e.organisationId) ?? { n: 0, ca: 0, nom: e.organisation.nom };
  x.n++;
  x.ca += e.caHTCents;
  parClient.set(e.organisationId, x);
}
const clients = [...parClient.values()];
const fideles = clients.filter((c) => c.n > 1);
console.log(`${fideles.length} clients sur ${clients.length} ont commandé plus d'une fois (${Math.round((100 * fideles.length) / clients.length)} %)`);
console.log(`ils représentent ${euros(fideles.reduce((s, c) => s + c.ca, 0))} sur ${euros(total)}`);
console.log(`\nles 10 plus fidèles :`);
for (const c of clients.sort((a, b) => b.n - a.n).slice(0, 10)) {
  console.log(`${String(c.n).padStart(3)} événements  ${euros(c.ca).padStart(11)}  ${c.nom}`);
}

titre("Saisonnalité");
const parMois = new Map<number, { n: number; ca: number }>();
for (const e of evenements) {
  const m = Number(e.date.slice(5, 7));
  const x = parMois.get(m) ?? { n: 0, ca: 0 };
  x.n++;
  x.ca += e.caHTCents;
  parMois.set(m, x);
}
const mois = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
for (let m = 1; m <= 12; m++) {
  const x = parMois.get(m) ?? { n: 0, ca: 0 };
  const barre = "█".repeat(Math.round(x.n / 12));
  console.log(`${mois[m - 1]!.padEnd(5)} ${String(x.n).padStart(4)}  ${euros(x.ca).padStart(12)}  ${barre}`);
}

await prisma.$disconnect();
