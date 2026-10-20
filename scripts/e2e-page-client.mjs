/**
 * Parcours client : du devis cree en interne a l'acceptation sur la page
 * publique, en passant par le choix d'une option.
 */
import { chromium } from "playwright";

const SP = process.env.SP ?? ".";
const navigateur = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await navigateur.newPage({ viewport: { width: 1480, height: 1250 } });
page.on("pageerror", (e) => console.log("ERREUR PAGE:", e.message));

// Grille en vigueur.
await page.goto("http://127.0.0.1:3000/tarifs/import", { waitUntil: "networkidle" });
await page.setInputFiles('input[type="file"]', "fixtures/2026_Tarif_Public_MadCityZen.xlsx");
await page.getByRole("button", { name: /Analyser/ }).click();
await page.waitForURL(/\/tarifs\/import\/\w+/, { timeout: 30000 });
await page.getByRole("button", { name: /Mettre cette grille en vigueur/ }).click();
await page.waitForURL(/\/tarifs$/, { timeout: 30000 });

// Devis a deux animations : la seconde part en option.
await page.goto("http://127.0.0.1:3000/devis/nouveau", { waitUntil: "networkidle" });
await page.getByPlaceholder("NATUROPERA").fill("FLEXSTONE PARTNERS");
await page.locator('input[type="date"]').fill("2026-12-10");
await page.getByPlaceholder("Lognes").fill("Paris");
await page.getByPlaceholder("77185").fill("75011");
await page.getByLabel("Participants", { exact: true }).fill("40");
await page.getByLabel("Ajouter une animation").selectOption({ label: "Graffiti" });
await page.waitForTimeout(200);
await page.getByLabel("Ajouter une animation").selectOption({ label: "Lego Mania" });
await page.waitForTimeout(300);
console.log("titre :", await page.locator("textarea").inputValue());
await page.getByRole("button", { name: /Enregistrer le brouillon/ }).click();
await page.waitForURL(/\/devis\/\w+/, { timeout: 30000 });

const lien = await page.getByRole("link", { name: /Ouvrir la page client/ }).getAttribute("href");
console.log("lien public :", lien);

// Cote client.
await page.goto(`http://127.0.0.1:3000${lien}`, { waitUntil: "networkidle" });
console.log("\ntitre client :", await page.locator("h1").innerText());
console.log("panneau :", (await page.locator(".public-panneau h2").innerText()).trim());
const options = await page.locator(".bloc-options .case").allInnerTexts();
console.log("options proposées :", options.map((o) => o.replace(/\n/g, " ")).join(" | "));
console.log("total affiché :", (await page.locator(".total-courant").innerText()).replace(/\n/g, " "));
await page.screenshot({ path: `${SP}/client-1.png`, fullPage: true });

// Le client retient l'option, puis valide.
await page.locator(".bloc-options input[type=checkbox]").first().check();
console.log("après choix :", (await page.locator(".total-courant").innerText()).replace(/\n/g, " "));
await page.getByRole("button", { name: /Valider cette proposition/ }).click();
await page.getByLabel("Nom et prénom").fill("Anne Levy");
await page.getByLabel("Fonction").fill("Office Manager");
await page.getByLabel("Email").fill("anne.levy@flexstone.fr");
await page.screenshot({ path: `${SP}/client-2.png`, fullPage: true });
await page.getByRole("button", { name: /Valider —/ }).click();
await page.waitForTimeout(1500);
console.log("\naprès validation :", (await page.locator(".public-panneau").innerText()).split("\n").slice(0, 3).join(" / "));
await page.screenshot({ path: `${SP}/client-3.png`, fullPage: true });

await navigateur.close();
