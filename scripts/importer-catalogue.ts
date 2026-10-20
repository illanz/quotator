/**
 * Import du catalogue produits facturation.pro.
 *
 * Usage : npx tsx --env-file=.env scripts/importer-catalogue.ts <dossier> [--appliquer]
 *
 * Sans `--appliquer`, le script se contente de rendre compte : combien de
 * produits sont rattaches a une animation de la grille, lesquels ne le sont
 * pas, et quelle duree standard a ete reconnue. L'ecriture en base est un
 * second temps, volontairement explicite.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { analyserDesignation } from "../src/devis/designation.ts";
import { prisma } from "../src/lib/prisma.ts";
import { cleAnimation } from "../src/tarifs/parse-grille.ts";
import { identifierAnimation } from "../src/trackrecord/animations.ts";

type ProduitFP = {
  id: number;
  ref: string | null;
  title: string | null;
  unit_price: string;
  soft_deleted: boolean;
};

const [dossier, drapeau] = process.argv.slice(2);
if (!dossier) throw new Error("usage: importer-catalogue.ts <dossier-produits> [--appliquer]");
const appliquer = drapeau === "--appliquer";

const produits = readdirSync(dossier)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dossier, f), "utf8")) as ProduitFP)
  .filter((p) => !p.soft_deleted);

/**
 * Produits utilitaires du catalogue : ils servent a composer un devis mais ne
 * sont pas des animations, et n'ont donc pas d'equivalent dans la grille.
 */
const UTILITAIRES = /^(TITRE|A_REMISE|VHR|Frais déplacement|Stationnement|Option |Test )/i;

/**
 * Duree standard annoncee par la fiche produit.
 *
 * C'est elle qui fait foi sur le devis, jamais la duree demandee par le client :
 * le devis a valeur contractuelle.
 */
function dureeStandard(intitule: string): string | null {
  const m =
    /dur[ée]e\s*(?:moyenne)?\s*:?\s*([0-9]+\s*h(?:\s*[0-9]{2})?(?:\s*[àa]\s*[0-9]+h(?:[0-9]{2})?)?)/i.exec(
      intitule,
    ) ?? /vacation\s*(?:de)?\s*:?\s*([0-9]+h(?:[0-9]{2})?)/i.exec(intitule);
  return m ? m[1]!.replace(/\s+/g, "") : null;
}

const animations = await prisma.animation.findMany({
  select: { id: true, cle: true, nom: true, libreAcces: true },
});
const parCle = new Map(animations.map((a) => [a.cle, a]));

/** Animation canonique reconnue dans un libelle, via la table d'alias. */
function canonique(texte: string): string | null {
  const r = identifierAnimation(texte);
  return r.type === "ANIMATION" ? r.animation.cle : null;
}

// Les deux nomenclatures ne coincident pas : la grille ecrit « BODY PERCUSSION »
// la ou le catalogue ecrit « BODY PERC », « TEAM HAKA » contre « HAKA ». La
// table d'alias du track record sert de pont entre les deux.
const parCanonique = new Map<string, typeof animations>();
for (const a of animations) {
  const c = canonique(a.nom);
  if (!c) continue;
  parCanonique.set(c, [...(parCanonique.get(c) ?? []), a]);
}

/**
 * Rapprochements que seule la connaissance du metier tranche.
 *
 * « COURTS METRAGES » sans qualificatif designe la version cameras : la version
 * tablettes porte son propre produit. « MAD BURGER PRESENTIEL » va sur la ligne
 * presentielle, pas sur la ligne visio.
 */
const ARBITRAGES: Record<string, string> = {
  "ATELIER MOSAIQUE": "MOSAIQUE",
  "COURTS METRAGES": "COURTS METRAGES CAMERAS PRO",
  "MAD BURGER PRESENTIEL": "QUIZ MAD BURGER TOUS THEMES",
};

type Rapprochement =
  | { trouve: true; animation: (typeof animations)[number]; voie: string }
  | { trouve: false; raison: "AUCUNE" | "AMBIGU"; candidats?: string[] };

/**
 * Rapprochement d'un produit avec une animation de la grille, par couches de
 * fiabilite decroissante. Une correspondance ambigue n'est pas tranchee : deux
 * fresques differentes n'ont ni la meme description ni le meme prix.
 */
function rapprocher(ref: string, intitule: string): Rapprochement {
  const arbitre = ARBITRAGES[cleAnimation(ref)];
  if (arbitre) {
    const vise = parCle.get(arbitre);
    if (vise) return { trouve: true, animation: vise, voie: "arbitrage" };
  }

  const exact = parCle.get(cleAnimation(ref));
  if (exact) return { trouve: true, animation: exact, voie: "référence exacte" };

  const c = canonique(ref) ?? canonique(intitule);
  if (!c) return { trouve: false, raison: "AUCUNE" };

  const candidats = parCanonique.get(c) ?? [];
  if (candidats.length === 1) return { trouve: true, animation: candidats[0]!, voie: "alias" };
  if (candidats.length === 0) return { trouve: false, raison: "AUCUNE" };

  // Plusieurs lignes de grille partagent l'animation : le regime libre acces
  // les departage, sinon on s'abstient.
  const libre = /libre\s*acc[eè]s/i.test(ref) || /libre\s*acc[eè]s/i.test(intitule);
  const filtres = candidats.filter((a) => a.libreAcces === libre);
  if (filtres.length === 1) return { trouve: true, animation: filtres[0]!, voie: "alias + régime" };

  return { trouve: false, raison: "AMBIGU", candidats: candidats.map((a) => a.nom) };
}

let rattaches = 0;
let avecDuree = 0;
const orphelins: string[] = [];
const ambigus: string[] = [];
const utilitaires: string[] = [];
const parVoie = new Map<string, number>();

for (const produit of produits) {
  const ref = (produit.ref ?? "").trim();
  if (!ref || UTILITAIRES.test(ref)) {
    utilitaires.push(ref || `#${produit.id}`);
    continue;
  }

  const designation = analyserDesignation(produit.title ?? "");
  const duree = dureeStandard(designation.intitule);

  const rapprochement = rapprocher(ref, designation.intitule);
  if (!rapprochement.trouve) {
    if (rapprochement.raison === "AMBIGU") {
      ambigus.push(`${ref} → ${rapprochement.candidats?.join(" ou ")}`);
    } else {
      orphelins.push(`${ref}${duree ? ` (${duree})` : ""}`);
    }
    continue;
  }
  const animation = rapprochement.animation;
  parVoie.set(rapprochement.voie, (parVoie.get(rapprochement.voie) ?? 0) + 1);

  rattaches++;
  if (duree) avecDuree++;

  if (appliquer) {
    await prisma.animation.update({
      where: { id: animation.id },
      data: {
        descriptionHtml: produit.title,
        dureeStandard: duree,
        referenceFP: produit.id,
      },
    });
  }
}

console.log(`produits lus            : ${produits.length}`);
console.log(`  utilitaires (hors catalogue animations) : ${utilitaires.length}`);
console.log(`  rattachés à la grille  : ${rattaches}`);
for (const [voie, n] of parVoie) console.log(`      par ${voie} : ${n}`);
console.log(`  rapprochement ambigu   : ${ambigus.length}`);
console.log(`  dont avec durée lue    : ${avecDuree}`);
console.log(`  sans correspondance    : ${orphelins.length}`);
console.log(`\nanimations de la grille : ${animations.length}`);
const rattachees = new Set<string>();
for (const p of produits) {
  const ref = (p.ref ?? "").trim();
  if (!ref || UTILITAIRES.test(ref)) continue;
  const r = rapprocher(ref, analyserDesignation(p.title ?? "").intitule);
  if (r.trouve) rattachees.add(r.animation.id);
}
const sansProduit = animations.filter((a) => !rattachees.has(a.id));
console.log(`  sans produit associé   : ${sansProduit.length}`);

if (ambigus.length > 0) {
  console.log("\n--- rapprochements ambigus, laissés de côté");
  for (const a of ambigus.sort()) console.log("   ", a);
}
if (orphelins.length > 0) {
  console.log("\n--- produits sans animation correspondante");
  for (const o of orphelins.sort()) console.log("   ", o);
}
if (sansProduit.length > 0) {
  console.log("\n--- animations de la grille sans description");
  for (const a of sansProduit) console.log("   ", a.nom);
}

console.log(appliquer ? "\nCatalogue appliqué." : "\nSimulation — relancer avec --appliquer.");

await prisma.$disconnect();
