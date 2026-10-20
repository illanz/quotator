import { describe, expect, it } from "vitest";
import { creerJeton, empreinte, empreintesEgales, etatJeton, expirationLien } from "./jeton";
import { creerSession, lireSession, secretSession } from "./session";

const SECRET = "un-secret-de-test-assez-long-pour-passer-le-controle";

describe("jetons de connexion", () => {
  it("produit un jeton imprévisible à chaque appel", () => {
    const jetons = new Set(Array.from({ length: 200 }, creerJeton));
    expect(jetons.size).toBe(200);
    // 32 octets en base64url : 43 caractères, sans remplissage.
    expect([...jetons][0]).toMatch(/^[\w-]{43}$/);
  });

  it("ne conserve qu'une empreinte, stable et non réversible", () => {
    const jeton = creerJeton();
    expect(empreinte(jeton)).toBe(empreinte(jeton));
    expect(empreinte(jeton)).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinte(jeton)).not.toContain(jeton);
  });

  it("compare des empreintes sans fuite de longueur", () => {
    const a = empreinte("a");
    expect(empreintesEgales(a, a)).toBe(true);
    expect(empreintesEgales(a, empreinte("b"))).toBe(false);
    expect(empreintesEgales(a, "trop court")).toBe(false);
  });

  it("date l'expiration à un quart d'heure", () => {
    const depuis = new Date("2026-10-20T09:00:00Z");
    expect(expirationLien(depuis).toISOString()).toBe("2026-10-20T09:15:00.000Z");
  });
});

describe("etatJeton", () => {
  const maintenant = new Date("2026-10-20T09:00:00Z");
  const plusTard = new Date("2026-10-20T09:10:00Z");
  const plusTot = new Date("2026-10-20T08:50:00Z");

  it("accepte un jeton vivant et jamais utilisé", () => {
    expect(etatJeton({ expireLe: plusTard, utiliseLe: null }, maintenant)).toBe("VALIDE");
  });

  it("refuse un jeton expiré", () => {
    expect(etatJeton({ expireLe: plusTot, utiliseLe: null }, maintenant)).toBe("EXPIRE");
    // L'échéance exacte est déjà passée : un lien ne vaut pas à la seconde près.
    expect(etatJeton({ expireLe: maintenant, utiliseLe: null }, maintenant)).toBe("EXPIRE");
  });

  it("signale un lien rejoué, même encore valide", () => {
    // C'est le cas qui mérite une explication : le lien a déjà servi, souvent
    // parce qu'un antivirus de messagerie l'a ouvert avant le destinataire.
    expect(etatJeton({ expireLe: plusTard, utiliseLe: plusTot }, maintenant)).toBe("DEJA_UTILISE");
    expect(etatJeton({ expireLe: plusTot, utiliseLe: plusTot }, maintenant)).toBe("DEJA_UTILISE");
  });
});

describe("session signée", () => {
  it("relit ce qu'elle a écrit", () => {
    const cookie = creerSession("utilisateur-1", SECRET);
    expect(lireSession(cookie, SECRET)?.utilisateurId).toBe("utilisateur-1");
  });

  it("rejette une charge modifiée", () => {
    const cookie = creerSession("utilisateur-1", SECRET);
    const charge = Buffer.from(JSON.stringify({ utilisateurId: "admin", expire: 9e9 })).toString(
      "base64url",
    );
    const forge = `${charge}.${cookie.slice(cookie.lastIndexOf(".") + 1)}`;
    expect(lireSession(forge, SECRET)).toBeNull();
  });

  it("rejette une signature faite avec un autre secret", () => {
    const cookie = creerSession("utilisateur-1", "un-autre-secret-tout-aussi-long-que-le-vrai");
    expect(lireSession(cookie, SECRET)).toBeNull();
  });

  it("rejette une session échue", () => {
    const cookie = creerSession("utilisateur-1", SECRET, new Date("2026-01-01T00:00:00Z"));
    // 30 jours plus tard, elle ne vaut plus.
    expect(lireSession(cookie, SECRET, new Date("2026-03-01T00:00:00Z"))).toBeNull();
    expect(lireSession(cookie, SECRET, new Date("2026-01-15T00:00:00Z"))).not.toBeNull();
  });

  it("rejette ce qui n'a pas la forme d'une session", () => {
    for (const mauvais of [undefined, "", "sans-point", ".", "a.b", "YQ.YQ"]) {
      expect(lireSession(mauvais, SECRET)).toBeNull();
    }
  });
});

describe("secretSession", () => {
  it("refuse de démarrer sans secret utilisable", () => {
    // Pas de repli silencieux : une session signée avec un secret vide n'est
    // pas une session.
    expect(() => secretSession({})).toThrow(/AUTH_SECRET/);
    expect(() => secretSession({ AUTH_SECRET: "trop-court" })).toThrow();
    expect(secretSession({ AUTH_SECRET: SECRET })).toBe(SECRET);
  });
});
