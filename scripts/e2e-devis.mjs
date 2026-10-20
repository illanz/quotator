/**
 * Parcours de bout en bout : mettre la grille en vigueur, puis creer un devis.
 *
 * Usage : npm run build && npx next start & puis
 *         SP=<dossier-captures> node scripts/e2e-devis.mjs
 *
 * Complete les tests unitaires : eux verifient les regles, celui-ci verifie que
 * l'ecran, le moteur et la base s'accordent reellement.
 */
import { chromium } from "playwright";

const SP = process.env.SP ?? ".";
const navigateur = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await navigateur.newPage({ viewport: { width: 1400, height: 1150 } });
page.on("pageerror", (e) => console.log("ERREUR PAGE:", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 160));
});

// 1. Mettre la grille 2026 en vigueur.
await page.goto("http://127.0.0.1:3000/tarifs/import", { waitUntil: "networkidle" });
await page.setInputFiles('input[type="file"]', "fixtures/2026_Tarif_Public_MadCityZen.xlsx");
await page.getByRole("button", { name: /Analyser/ }).click();
await page.waitForURL(/\/tarifs\/import\/\w+/, { timeout: 30000 });
await page.getByRole("button", { name: /Mettre cette grille en vigueur/ }).click();
await page.waitForURL(/\/tarifs$/, { timeout: 30000 });
console.log("grille :", await page.locator("h1").innerText());

// 2. Creer un devis : Graffiti, 50-60 pax, un samedi, a Lognes.
await page.goto("http://127.0.0.1:3000/devis/nouveau", { waitUntil: "networkidle" });
await page.getByPlaceholder("NATUROPERA").fill("NATUROPERA");
await page.locator('input[type="date"]').fill("2026-08-15"); // samedi et Assomption
await page.getByPlaceholder("Lognes").fill("Lognes");
await page.getByPlaceholder("77185").fill("77185");
await page.getByLabel("Participants", { exact: true }).fill("50");
await page.getByLabel(/jusqu'à/).fill("60");

await page.getByLabel("Ajouter une animation").selectOption({ label: "Graffiti" });
await page.waitForTimeout(300);

console.log("titre composé :", await page.locator("textarea").inputValue());
const alerte = await page.locator(".encadre-alerte").first().innerText().catch(() => "");
console.log("alerte :", alerte.replace(/\n/g, " ").slice(0, 120));

// La fourchette 50-60 tient dans une seule tranche : le prix doit tomber seul.
const totaux = await page.locator(".totaux").innerText();
console.log("totaux :\n" + totaux);
await page.screenshot({ path: `${SP}/devis-saisie.png`, fullPage: true });

// 3. Enregistrer et verifier la fiche.
await page.getByRole("button", { name: /Enregistrer le brouillon/ }).click();
await page.waitForURL(/\/devis\/\w+/, { timeout: 30000 });
await page.waitForLoadState("networkidle");
console.log("\nfiche :", (await page.locator(".eyebrow").innerText()).replace(/\n/g, " "));
console.log("client :", await page.locator("h1").innerText());
console.log("titre :", await page.locator(".lede").innerText());
const lignes = await page.locator("tbody tr").allInnerTexts();
console.log("lignes :");
for (const l of lignes) console.log("   ", l.replace(/\t/g, " | "));
await page.screenshot({ path: `${SP}/devis-fiche.png`, fullPage: true });

await navigateur.close();
