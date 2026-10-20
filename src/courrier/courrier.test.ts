import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { configurationCourrier } from "./expediteur";
import { expediteurJournal } from "./journal";
import { adresseComplete, emailPlausible } from "./message";

describe("configurationCourrier", () => {
  const complete = {
    SMTP_HOTE: "smtp-relay.example.net",
    SMTP_UTILISATEUR: "madcityzen",
    SMTP_MOT_DE_PASSE: "secret",
    COURRIER_EXPEDITEUR: "devis@madcityzen.fr",
  };

  it("lit une configuration complète", () => {
    const c = configurationCourrier(complete);
    expect(c).toMatchObject({ hote: "smtp-relay.example.net", de: "devis@madcityzen.fr" });
    // 587 par défaut : le port STARTTLS, celui qu'ouvrent les hébergeurs.
    expect(c?.port).toBe(587);
  });

  it("traite une configuration incomplète comme absente", () => {
    // Mieux vaut basculer franchement sur le journal que tenter une connexion
    // qui échouera au premier envoi, c'est-à-dire devant un client.
    for (const manquant of Object.keys(complete)) {
      const partielle = { ...complete, [manquant]: undefined };
      expect(configurationCourrier(partielle)).toBeNull();
    }
    expect(configurationCourrier({})).toBeNull();
  });
});

describe("emailPlausible", () => {
  it("accepte une adresse ordinaire", () => {
    expect(emailPlausible("anne.martin@yousign.com")).toBe(true);
    expect(emailPlausible("  illanz@madcityzen.fr  ")).toBe(true);
  });

  it("refuse ce qui n'est pas une adresse", () => {
    for (const mauvais of ["", "anne.martin", "anne@", "@yousign.com", "anne @ yousign.com", "anne@yousign"]) {
      expect(emailPlausible(mauvais)).toBe(false);
    }
  });
});

describe("adresseComplete", () => {
  it("compose « Nom <adresse> »", () => {
    expect(adresseComplete({ email: "a@b.fr", nom: "Anne Martin" })).toBe('"Anne Martin" <a@b.fr>');
  });

  it("rend l'adresse seule quand le nom manque", () => {
    expect(adresseComplete({ email: "a@b.fr" })).toBe("a@b.fr");
    expect(adresseComplete({ email: "a@b.fr", nom: "  " })).toBe("a@b.fr");
  });

  it("neutralise un guillemet dans le nom, qui casserait l'en-tête", () => {
    expect(adresseComplete({ email: 'a@b.fr', nom: 'Anne "AM" Martin' })).toBe(
      '"Anne AM Martin" <a@b.fr>',
    );
  });
});

describe("expediteurJournal", () => {
  it("écrit le message sur disque plutôt que de l'envoyer", async () => {
    const dossier = mkdtempSync(join(tmpdir(), "courrier-"));
    const expediteur = expediteurJournal(dossier);

    const resultat = await expediteur.envoyer({
      a: { email: "anne.martin@yousign.com", nom: "Anne Martin" },
      sujet: "Votre proposition MadCityZen",
      texte: "Bonjour Anne,",
      html: "<p>Bonjour Anne,</p>",
      cci: ["deal-4821@pipedrivemail.com"],
      reference: "devis-19806",
      piecesJointes: [
        { nom: "Devis_19806.pdf", contenu: Buffer.from("%PDF-1.7"), typeMime: "application/pdf" },
      ],
    });

    expect(resultat.ok).toBe(true);

    const fichiers = readdirSync(dossier);
    expect(fichiers.some((f) => f.endsWith("devis-19806.txt"))).toBe(true);
    expect(fichiers.some((f) => f.endsWith("devis-19806.html"))).toBe(true);
    expect(fichiers.some((f) => f.endsWith("Devis_19806.pdf"))).toBe(true);

    const texte = readFileSync(
      join(dossier, fichiers.find((f) => f.endsWith("devis-19806.txt"))!),
      "utf8",
    );
    // L'en-tête doit porter de quoi vérifier ce qui serait parti : destinataire,
    // copie cachée et pièces jointes.
    expect(texte).toContain('"Anne Martin" <anne.martin@yousign.com>');
    expect(texte).toContain("deal-4821@pipedrivemail.com");
    expect(texte).toContain("Devis_19806.pdf");
    expect(texte).toContain("Bonjour Anne,");
  });
});
