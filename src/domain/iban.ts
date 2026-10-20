/**
 * Verification et mise en forme d'un IBAN.
 *
 * Un IBAN faux sur un devis ne provoque aucune erreur visible : il produit un
 * virement rejete quinze jours plus tard, et un acompte qui n'arrive pas. La
 * cle de controle, elle, detecte toute faute de frappe au moment de la saisie.
 *
 * Le calcul est celui de la norme ISO 13616 : les quatre premiers caracteres
 * passent a la fin, les lettres deviennent des nombres (A = 10), et le tout
 * doit valoir 1 modulo 97.
 */

/** Forme comparable : sans espace, en capitales. */
export function ibanNormalise(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

export function ibanValide(iban: string): boolean {
  const compact = ibanNormalise(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(compact)) return false;

  const reordonne = compact.slice(4) + compact.slice(0, 4);
  let reste = 0;
  for (const caractere of reordonne) {
    const valeur = /\d/.test(caractere)
      ? caractere
      : String(caractere.charCodeAt(0) - 55); // A = 10, B = 11, …
    for (const chiffre of valeur) reste = (reste * 10 + Number(chiffre)) % 97;
  }
  return reste === 1;
}

/**
 * IBAN en groupes de quatre, comme sur un releve d'identite bancaire.
 *
 * C'est la presentation sous laquelle le client le recopiera : la lisibilite
 * n'est pas cosmetique, elle evite une erreur de saisie de plus.
 */
export function formaterIban(iban: string): string {
  return ibanNormalise(iban).replace(/(.{4})/g, "$1 ").trim();
}
