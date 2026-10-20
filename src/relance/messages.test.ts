import { describe, expect, it } from "vitest";
import { MENTION_ENGAGEMENT } from "@/domain/regles";
import { composerRelance, type ContexteMessage } from "./messages";
import { LARGEUR, replier } from "./pliage";
import { ETAPES } from "./sequence";

function contexte(partiel: Partial<ContexteMessage> = {}): ContexteMessage {
  return {
    prenom: "Claire",
    animation: "Graffiti",
    dateEvent: "2027-02-05",
    ville: "Paris",
    numero: 19806,
    valableAu: "2026-11-19",
    lienDevis: "https://app.madcityzen.fr/p/3c2042ea-5227-4970-80f3-6b83e63f27c5",
    commercial: "Illan",
    telephoneCommercial: "01 84 20 40 20",
    ...partiel,
  };
}

describe("replier", () => {
  it("replie un paragraphe à la largeur demandée", () => {
    const lignes = replier("un deux trois quatre cinq six", 12);
    expect(lignes).toEqual(["un deux", "trois quatre", "cinq six"]);
  });

  it("ne coupe jamais un lien", () => {
    // Une ligne sans espace est une adresse : la couper la rendrait
    // incliquable, et c'est ce que le message demande de cliquer.
    const lien = "https://app.madcityzen.fr/p/3c2042ea-5227-4970-80f3-6b83e63f27c5";
    expect(replier(lien, 20)).toEqual([lien]);
  });

  it("conserve les lignes vides, qui séparent les paragraphes", () => {
    expect(replier("")).toEqual([""]);
  });
});

describe("composerRelance", () => {
  it("compose chaque étape de la séquence", () => {
    for (const etape of ETAPES) {
      const m = composerRelance(etape.cle, contexte());
      expect(m.sujet.length).toBeGreaterThan(5);
      expect(m.texte).toContain("Bonjour Claire,");
      expect(m.texte).toContain("Illan");
    }
  });

  it("n'écrit jamais de montant", () => {
    // Règle en vigueur : le prix reste sur le PDF et la page du devis. Le
    // contexte fourni aux modèles ne porte aucun montant, la règle ne peut
    // donc pas être enfreinte par distraction — ce test le constate.
    for (const etape of ETAPES) {
      const m = composerRelance(etape.cle, contexte());
      expect(`${m.sujet} ${m.texte}`).not.toMatch(/€|\bHT\b|\bTTC\b/);
    }
  });

  it("ne dépasse jamais la largeur d'un courriel en texte brut", () => {
    for (const etape of ETAPES) {
      const m = composerRelance(etape.cle, contexte());
      const trop = m.texte
        .split("\n")
        .filter((l) => l.length > LARGEUR && l.includes(" "));
      expect(trop).toEqual([]);
    }
  });

  it("reprend la mention d'engagement mot pour mot", () => {
    // Une relance qui promettrait de bloquer une date contredirait l'article 3
    // des conditions générales.
    const m = composerRelance("DISPONIBILITE", contexte());
    const sansRetours = m.texte.replace(/\n/g, " ");
    expect(sansRetours).toContain(MENTION_ENGAGEMENT);
  });

  it("se passe du prénom quand il manque", () => {
    const m = composerRelance("QUESTIONS", contexte({ prenom: null }));
    expect(m.texte).toContain("Bonjour,");
    expect(m.texte).not.toContain("Bonjour null");
  });

  it("porte la référence sectorielle quand l'historique en donne une", () => {
    const avec = composerRelance(
      "VALEUR",
      contexte({ referenceSecteur: "depuis 2022, nous avons animé 11 fois Graffiti." }),
    );
    expect(avec.texte).toContain("11 fois Graffiti");

    // Sans historique exploitable, le message se replie sur les objections
    // courantes plutôt que d'inventer une référence. Le texte est comparé
    // déplié : les retours à la ligne viennent du pliage, pas du modèle.
    const sans = composerRelance("VALEUR", contexte({ referenceSecteur: null }));
    expect(sans.texte.replace(/\n/g, " ")).toContain("l'espace nécessaire");
    expect(sans.texte).not.toContain("nous avons animé");
  });

  it("se passe du numéro sur un devis qui n'en a pas encore", () => {
    const m = composerRelance("VERIFICATION", contexte({ numero: null }));
    expect(m.sujet).not.toContain("null");
    expect(m.sujet).toBe("Votre devis vous est bien parvenu ?");
  });
});
