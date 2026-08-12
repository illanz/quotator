/**
 * Mesure la couverture de l'identification des animations sur l'historique
 * reel, et liste ce qui reste non reconnu pour affiner les alias.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { identifierAnimation } from "../src/trackrecord/animations.ts";

const racine = process.argv[2] ?? "";
const fichiers = readdirSync(racine).filter((f) => f.endsWith(".json"));

let animations = 0;
let accessoires = 0;
const inconnus = new Map<string, number>();
const parAnimation = new Map<string, number>();

for (const f of fichiers) {
  const facture = JSON.parse(readFileSync(join(racine, f), "utf8"));
  for (const ligne of facture.items ?? []) {
    if (ligne.style !== null || Number(ligne.unit_price) <= 0) continue;
    const r = identifierAnimation(ligne.title ?? "");
    if (r.type === "ANIMATION") {
      animations++;
      parAnimation.set(r.animation.nom, (parAnimation.get(r.animation.nom) ?? 0) + 1);
    } else if (r.type === "ACCESSOIRE") accessoires++;
    else {
      const cle = r.libelle.replace(/<[^>]*>/g, "").slice(0, 60);
      inconnus.set(cle, (inconnus.get(cle) ?? 0) + 1);
    }
  }
}

const total = animations + accessoires + [...inconnus.values()].reduce((a, b) => a + b, 0);
const nbInconnus = [...inconnus.values()].reduce((a, b) => a + b, 0);
console.log(`lignes payantes : ${total}`);
console.log(`  animations identifiees : ${animations} (${Math.round((100 * animations) / total)} %)`);
console.log(`  accessoires            : ${accessoires} (${Math.round((100 * accessoires) / total)} %)`);
console.log(`  non reconnues          : ${nbInconnus} (${Math.round((100 * nbInconnus) / total)} %)`);
console.log(`\nanimations distinctes rencontrees : ${parAnimation.size}`);
console.log("\n--- 30 libelles non reconnus les plus frequents");
for (const [k, v] of [...inconnus.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`${String(v).padStart(4)}  ${k}`);
}
