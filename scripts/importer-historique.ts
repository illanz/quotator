/**
 * Construction de l'historique commercial a partir des exports facturation.pro.
 *
 * Usage : npx tsx scripts/importer-historique.ts <dossier-factures> <dossier-clients>
 *
 * L'operation est idempotente : relancer le script reconstruit l'historique
 * sans le dupliquer.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma.ts";
import { identifierAnimation } from "../src/trackrecord/animations.ts";
import { classerSecteur } from "../src/trackrecord/secteurs.ts";

type LigneFacture = {
  title: string | null;
  unit_price: string;
  total: string;
  style: string | null;
};

type Facture = {
  id: number;
  customer_id: number;
  invoiced_on: string;
  balance_year: number;
  total: string;
  quote_id: number | null;
  items: LigneFacture[];
};

type ClientFP = {
  id: number;
  company_name: string | null;
  short_name: string | null;
  city: string | null;
  zip_code: string | null;
  street: string | null;
  siret: string | null;
  vat_number: string | null;
  last_invoiced_on: string | null;
  created_at: string;
};

const [dossierFactures, dossierClients] = process.argv.slice(2);
if (!dossierFactures || !dossierClients) {
  throw new Error("usage: importer-historique.ts <dossier-factures> <dossier-clients>");
}

function lire<T>(dossier: string): T[] {
  return readdirSync(dossier)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dossier, f), "utf8")) as T);
}

function sansBalises(texte: string | null): string {
  return (texte ?? "").replace(/<[^>]*>/g, " ").replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
}

function cents(montant: string | number): number {
  return Math.round(Number(montant) * 100);
}

function normaliserNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\b(SAS|SARL|SA|SASU|EURL|SNC|GIE|SCI)\b/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/** Ville et jauge, quand la ligne de titre de l'evenement les mentionne. */
function extraireContexte(titre: string): { ville: string | null; pax: number | null } {
  const segments = titre.split("/").map((s) => s.trim());
  let ville: string | null = null;
  let pax: number | null = null;
  for (const s of segments) {
    const m = /(\d+)\s*(?:a|à|-)?\s*(\d+)?\s*pax/i.exec(s);
    if (m && pax === null) pax = Number(m[2] ?? m[1]);
    else if (
      ville === null &&
      s.length > 2 &&
      s.length < 40 &&
      !/pax|vacation|animation|tarification|remise|\d{4}/i.test(s)
    ) {
      ville = s;
    }
  }
  return { ville, pax };
}

console.log("Lecture des exports…");
const factures = lire<Facture>(dossierFactures);
const clients = lire<ClientFP>(dossierClients);
console.log(`  ${factures.length} factures, ${clients.length} fiches clients`);

// --------------------------------------------------------------- organisations

// Seuls les clients reellement factures entrent dans l'historique : les 83 % de
// fiches sans facture n'ont rien a y faire.
const caParClient = new Map<number, number>();
const mentionsAgence = new Map<number, number>();
const facturesParClient = new Map<number, number>();

for (const f of factures) {
  caParClient.set(f.customer_id, (caParClient.get(f.customer_id) ?? 0) + cents(f.total));
  facturesParClient.set(f.customer_id, (facturesParClient.get(f.customer_id) ?? 0) + 1);
  const blob = f.items.map((i) => sansBalises(i.title)).join(" ").toLowerCase();
  if (/tarification agence|tarif agence/.test(blob)) {
    mentionsAgence.set(f.customer_id, (mentionsAgence.get(f.customer_id) ?? 0) + 1);
  }
}

/**
 * Une agence se reconnait a son nom, ou au fait qu'elle achete a un tarif
 * agence de facon repetee. Un client final qui a beneficie une fois d'un tarif
 * exceptionnel ne doit pas basculer dans cette categorie.
 */
function estAgence(nom: string, id: number): boolean {
  if (classerSecteur(nom).secteur === "Agence événementielle") return true;
  const mentions = mentionsAgence.get(id) ?? 0;
  const total = facturesParClient.get(id) ?? 0;
  return mentions >= 2 && mentions / total >= 0.25;
}

console.log("Reconstruction des organisations…");
const organisationParFP = new Map<number, string>();
let creees = 0;

for (const c of clients) {
  if (!caParClient.has(c.id)) continue;
  const nom = (c.company_name || c.short_name || `Client ${c.id}`).trim();
  const { secteur } = classerSecteur(nom);
  const agence = estAgence(nom, c.id);

  const organisation = await prisma.organisation.upsert({
    where: { referenceFP: c.id },
    create: {
      referenceFP: c.id,
      nom,
      nomCle: normaliserNom(nom),
      secteur: agence ? "Agence événementielle" : secteur,
      secteurAuto: true,
      estAgence: agence,
      type: agence ? "AGENCE" : "CLIENT_DIRECT",
      active: true,
    },
    update: {
      nom,
      nomCle: normaliserNom(nom),
      secteur: agence ? "Agence événementielle" : secteur,
      estAgence: agence,
      type: agence ? "AGENCE" : "CLIENT_DIRECT",
    },
  });
  organisationParFP.set(c.id, organisation.id);
  creees++;
}
console.log(`  ${creees} organisations`);

// ------------------------------------------------------------------ evenements

// Les factures d'une meme prestation partagent le devis d'origine.
const groupes = new Map<string, Facture[]>();
for (const f of factures) {
  const cle = f.quote_id ? `devis:${f.quote_id}` : `facture:${f.id}`;
  groupes.set(cle, [...(groupes.get(cle) ?? []), f]);
}
console.log(`Regroupement : ${factures.length} factures → ${groupes.size} evenements`);

await prisma.evenementAnimation.deleteMany();
await prisma.evenement.deleteMany();

let evenements = 0;
let avecAnimation = 0;
let lignesInconnues = 0;

for (const [cle, groupe] of groupes) {
  const premier = groupe[0]!;
  const organisationId = organisationParFP.get(premier.customer_id);
  if (!organisationId) continue;

  const trie = [...groupe].sort((a, b) => a.invoiced_on.localeCompare(b.invoiced_on));
  const caHTCents = groupe.reduce((s, f) => s + cents(f.total), 0);

  // Le titre de l'evenement et les animations viennent des factures
  // descriptives ; les factures d'acompte n'en portent aucune trace.
  let titre: string | null = null;
  const parAnimation = new Map<string, { nom: string; famille: string; montantCents: number }>();
  let viaAgence = false;

  for (const f of groupe) {
    for (const ligne of f.items) {
      const texte = sansBalises(ligne.title);
      if (ligne.style === "title" && texte && !titre) titre = texte;
      if (/tarification agence|tarif agence/i.test(texte)) viaAgence = true;
      if (ligne.style !== null || Number(ligne.unit_price) <= 0) continue;

      const identification = identifierAnimation(ligne.title ?? "");
      if (identification.type === "ANIMATION") {
        const a = identification.animation;
        const courant = parAnimation.get(a.cle);
        parAnimation.set(a.cle, {
          nom: a.nom,
          famille: a.famille,
          montantCents: (courant?.montantCents ?? 0) + cents(ligne.total),
        });
      } else if (identification.type === "INCONNU") {
        lignesInconnues++;
      }
    }
  }

  const contexte = titre ? extraireContexte(titre) : { ville: null, pax: null };

  await prisma.evenement.create({
    data: {
      ...(cle.startsWith("devis:")
        ? { referenceDevisFP: premier.quote_id }
        : { referenceFactureFP: premier.id }),
      organisationId,
      date: trie[0]!.invoiced_on,
      annee: trie[0]!.balance_year,
      titre,
      ville: contexte.ville,
      pax: contexte.pax,
      caHTCents,
      nbFactures: groupe.length,
      viaAgence,
      animations: {
        create: [...parAnimation.entries()].map(([cleAnimation, a]) => ({
          cle: cleAnimation,
          nom: a.nom,
          famille: a.famille,
          montantCents: a.montantCents,
        })),
      },
    },
  });

  evenements++;
  if (parAnimation.size > 0) avecAnimation++;
}

console.log(`  ${evenements} evenements enregistres`);
console.log(
  `  ${avecAnimation} avec au moins une animation identifiee (${Math.round((100 * avecAnimation) / evenements)} %)`,
);
console.log(`  ${lignesInconnues} lignes non reconnues`);

await prisma.$disconnect();
