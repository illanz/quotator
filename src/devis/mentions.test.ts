import { describe, expect, it } from "vitest";
import { normaliserMentions } from "./mentions";

describe("normaliserMentions", () => {
  it("ramène le départ annoncé à la formulation retenue avec le client", () => {
    // 37 descriptions du catalogue portent cette mention.
    expect(
      normaliserMentions("Au delà de ces départements : Forfait de 1€HT/Km A/R au départ de Paris 1er."),
    ).toBe("Au delà de ces départements : Forfait de 1€HT/Km A/R au départ de Paris.");
  });

  it("couvre les autres façons d'écrire notre propre dépôt", () => {
    expect(normaliserMentions("au départ de Paris 1ème")).toBe("au départ de Paris");
    expect(normaliserMentions("au départ de Paris 75001")).toBe("au départ de Paris");
    expect(normaliserMentions("au départ Courbevoie (92)")).toBe("au départ Paris");
    expect(normaliserMentions("au départ de Courbevoie (92)")).toBe("au départ de Paris");
  });

  it("ne touche pas à une ville citée pour une autre raison", () => {
    const texte = "Prestation au départ de Lyon pour les équipes régionales.";
    expect(normaliserMentions(texte)).toBe(texte);
  });

  it("rétablit le périmètre sans frais de déplacement", () => {
    // Deux descriptions oublient Paris : un client parisien y lirait qu'il doit
    // des frais qu'il ne doit pas.
    expect(
      normaliserMentions("Déplacement inclus pour Paris et sa petite couronne (92, 93, 94)."),
    ).toBe("Déplacement inclus pour Paris et sa petite couronne (75, 92, 93, 94).");
  });

  it("laisse intacte une liste déjà conforme", () => {
    const texte = "Déplacement inclus pour Paris et sa petite couronne (75, 92, 93, 94).";
    expect(normaliserMentions(texte)).toBe(texte);
  });

  it("ne réécrit rien d'autre", () => {
    const texte =
      "Tout le matériel de artistique utile a l'activité : Toiles, chevalets, bombes de peinture.";
    expect(normaliserMentions(texte)).toBe(texte);
  });
});
