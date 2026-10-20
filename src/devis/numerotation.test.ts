import { describe, expect, it } from "vitest";
import { controlerEmission, type CandidatEmission } from "./numerotation";

function devis(partiel: Partial<CandidatEmission> = {}): CandidatEmission {
  return { statut: "BROUILLON", numero: null, totalHTCents: 319000, prestations: 1, ...partiel };
}

describe("controlerEmission", () => {
  it("laisse partir un brouillon chiffré", () => {
    expect(controlerEmission(devis())).toBeNull();
  });

  it("refuse de renuméroter un devis déjà émis", () => {
    // Deux numéros pour une même affaire, c'est une série incohérente et une
    // ambiguïté à la facturation.
    expect(controlerEmission(devis({ numero: 19803, statut: "ENVOYE" }))).toBe("DEJA_EMIS");
    // Même sans numéro, un devis qui n'est plus brouillon a déjà suivi son cours.
    expect(controlerEmission(devis({ statut: "ACCEPTE" }))).toBe("DEJA_EMIS");
    // Un numéro sans changement de statut trahit une émission interrompue :
    // le numéro est consommé, il ne faut pas en prendre un second.
    expect(controlerEmission(devis({ numero: 19803 }))).toBe("DEJA_EMIS");
  });

  it("refuse un devis sans prestation ferme", () => {
    expect(controlerEmission(devis({ prestations: 0 }))).toBe("SANS_PRESTATION");
  });

  it("refuse un total nul, qui est toujours une erreur de saisie", () => {
    expect(controlerEmission(devis({ totalHTCents: 0 }))).toBe("MONTANT_NUL");
    expect(controlerEmission(devis({ totalHTCents: -1000 }))).toBe("MONTANT_NUL");
  });

  it("signale l'absence de prestation avant le montant nul", () => {
    // Un devis vide a un total nul : le motif utile est celui qui dit quoi faire.
    expect(controlerEmission(devis({ prestations: 0, totalHTCents: 0 }))).toBe("SANS_PRESTATION");
  });
});
