import { describe, expect, it } from "vitest";
import { intituleSection, majusculeInitiale, normaliserTypographie } from "./typographie";

/** Espace fine insecable et espace insecable, invisibles mais signifiantes. */
const FINE = " ";
const NBSP = " ";

describe("normaliserTypographie", () => {
  it("compose les guillemets à la française", () => {
    expect(normaliserTypographie('Animation "Samba do Brazil"')).toBe(
      `Animation «${FINE}Samba do Brazil${FINE}»`,
    );
  });

  it("laisse un guillemet orphelin plutôt que d'en inventer la paire", () => {
    // Le catalogue contient « Street Art "Graffiti » sans fermante.
    expect(normaliserTypographie('Street Art "Graffiti')).toContain('"Graffiti');
  });

  it("colle la ponctuation double à une espace fine", () => {
    expect(normaliserTypographie("Durée : 2h30")).toBe(`Durée${FINE}: 2h30`);
    expect(normaliserTypographie("Combien ?")).toBe(`Combien${FINE}?`);
  });

  it("ne coupe pas une URL en deux", () => {
    expect(normaliserTypographie("https://madcityzen.fr")).toBe("https://madcityzen.fr");
  });

  it("ne sépare jamais un montant de son signe", () => {
    expect(normaliserTypographie("Supplément de 15€ HT")).toBe(`Supplément de 15${NBSP}€ HT`);
    expect(normaliserTypographie("800€ HT")).toBe(`800${NBSP}€ HT`);
    expect(normaliserTypographie("majoré de 15%")).toBe(`majoré de 15${NBSP}%`);
  });

  it("aère les montants à quatre chiffres", () => {
    expect(normaliserTypographie("2790€")).toBe(`2${NBSP}790${NBSP}€`);
  });

  it("détache l'unité collée à l'euro et redresse le kilomètre", () => {
    expect(normaliserTypographie("Forfait de 1€HT/Km A/R")).toBe(
      `Forfait de 1${NBSP}€${NBSP}HT/km A/R`,
    );
  });

  it("remplace l'apostrophe droite et le tiret d'incise", () => {
    expect(normaliserTypographie("l'activité - incluse")).toBe("l’activité – incluse");
  });
});

describe("intituleSection", () => {
  it("cesse de crier, le style s'en charge", () => {
    expect(intituleSection("FRAIS DE DEPLACEMENT")).toBe("Frais de deplacement");
    expect(intituleSection("STAFF")).toBe("Staff");
  });

  it("respecte un intitulé déjà composé", () => {
    expect(intituleSection("Matériel fourni")).toBe("Matériel fourni");
  });
});

describe("majusculeInitiale", () => {
  it("ne touche qu'au premier caractère", () => {
    expect(majusculeInitiale("encadrés par un artiste")).toBe("Encadrés par un artiste");
    expect(majusculeInitiale("MadCityZen fournit")).toBe("MadCityZen fournit");
  });
});
