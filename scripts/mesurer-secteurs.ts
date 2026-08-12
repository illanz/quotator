/** Couverture du classement sectoriel sur les clients reellement factures. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { classerSecteur } from "../src/trackrecord/secteurs.ts";

const [dossierFactures, dossierClients] = process.argv.slice(2);
if (!dossierFactures || !dossierClients) throw new Error("usage: <factures> <clients>");

const clients = new Map<number, { nom: string }>();
for (const f of readdirSync(dossierClients).filter((f) => f.endsWith(".json"))) {
  const c = JSON.parse(readFileSync(join(dossierClients, f), "utf8"));
  clients.set(c.id, { nom: c.company_name ?? c.short_name ?? "" });
}

const caParClient = new Map<number, number>();
for (const f of readdirSync(dossierFactures).filter((f) => f.endsWith(".json"))) {
  const facture = JSON.parse(readFileSync(join(dossierFactures, f), "utf8"));
  caParClient.set(facture.customer_id, (caParClient.get(facture.customer_id) ?? 0) + Number(facture.total));
}

const parSecteur = new Map<string, { clients: number; ca: number }>();
for (const [id, ca] of caParClient) {
  const { secteur } = classerSecteur(clients.get(id)?.nom);
  const e = parSecteur.get(secteur) ?? { clients: 0, ca: 0 };
  e.clients++;
  e.ca += ca;
  parSecteur.set(secteur, e);
}

const totalCA = [...caParClient.values()].reduce((a, b) => a + b, 0);
console.log(`clients factures : ${caParClient.size} — CA HT ${Math.round(totalCA).toLocaleString("fr-FR")} €\n`);
console.log("secteur                                clients      CA HT    part");
for (const [s, e] of [...parSecteur.entries()].sort((a, b) => b[1].ca - a[1].ca)) {
  console.log(
    `${s.padEnd(36)} ${String(e.clients).padStart(6)} ${Math.round(e.ca).toLocaleString("fr-FR").padStart(10)} € ${String(Math.round((100 * e.ca) / totalCA)).padStart(4)} %`,
  );
}

console.log("\n--- 25 plus gros clients non classes");
const nonClasses = [...caParClient.entries()]
  .filter(([id]) => classerSecteur(clients.get(id)?.nom).secteur === "Non classé")
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25);
for (const [id, ca] of nonClasses) {
  console.log(`${Math.round(ca).toLocaleString("fr-FR").padStart(9)} €  ${clients.get(id)?.nom ?? id}`);
}
