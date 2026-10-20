import { describe, expect, it } from "vitest";
import { formaterIban, ibanValide } from "./iban";

describe("ibanValide", () => {
  it("accepte un IBAN français correct", () => {
    expect(ibanValide("FR76 1820 6002 6660 2520 0001 733")).toBe(true);
    expect(ibanValide("fr7618206002666025200001733")).toBe(true);
  });

  it("rejette une faute de frappe, même d'un seul chiffre", () => {
    // Deux chiffres intervertis : la longueur et la forme restent correctes,
    // seule la clé de contrôle trahit l'erreur.
    expect(ibanValide("FR76 1820 6002 6660 2520 0001 737")).toBe(false);
    expect(ibanValide("FR76 1820 6002 6606 2520 0001 733")).toBe(false);
  });

  it("rejette ce qui n'a pas la forme d'un IBAN", () => {
    expect(ibanValide("")).toBe(false);
    expect(ibanValide("18206 00266 60252000017 33")).toBe(false);
    expect(ibanValide("FR76")).toBe(false);
  });

  it("accepte un IBAN étranger de longueur différente", () => {
    expect(ibanValide("DE89 3704 0044 0532 0130 00")).toBe(true);
    expect(ibanValide("BE68 5390 0754 7034")).toBe(true);
  });
});

describe("formaterIban", () => {
  it("regroupe par quatre, quelle que soit la saisie", () => {
    expect(formaterIban("FR7618206002666025200001733")).toBe(
      "FR76 1820 6002 6660 2520 0001 733",
    );
    expect(formaterIban("fr76 18206002666025200001733")).toBe(
      "FR76 1820 6002 6660 2520 0001 733",
    );
  });
});
