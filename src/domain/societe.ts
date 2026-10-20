/**
 * Identite legale de la societe emettrice.
 *
 * Ces valeurs ne sont pas des reglages : elles figurent au pied de chaque devis
 * depuis des annees et sont reprises telles quelles du devis de reference
 * (`260809_Devis_Madcityzen_YOUSIGNSAS_Anne_200Pax.pdf`). Les porter en
 * constantes plutot qu'en base evite qu'une ligne de parametres mal remplie
 * produise un document sans mentions legales.
 *
 * Ce qui varie reellement — coordonnees bancaires, adresses d'envoi, prochain
 * numero — reste dans `Parametres`.
 */

export const SOCIETE = {
  raisonSociale: "MAD CORP",
  /** Nom commercial, celui que connait le client. */
  marque: "MadCityZen",
  formeJuridique: "SARL",
  capitalEuros: 10000,
  adresse: "14, Avenue de l'Opéra",
  codePostal: "75001",
  ville: "PARIS",
  rcs: "509675088 RCS Paris",
  numeroTVA: "FR17509675088",
  codeAPE: "8230Z",
  siteWeb: "www.madcityzen.fr",
  email: "info@madcityzen.fr",
  telephone: "01 84 20 40 20",
  fax: "01 84 16 60 22",
} as const;

/** Pied de page legal, en une ligne, tel qu'il est imprime. */
export const PIED_LEGAL = [
  `${SOCIETE.raisonSociale} — ${SOCIETE.formeJuridique} au capital de ${SOCIETE.capitalEuros} €`,
  SOCIETE.rcs,
  `N° TVA : ${SOCIETE.numeroTVA}`,
  `APE : ${SOCIETE.codeAPE}`,
  SOCIETE.siteWeb,
  SOCIETE.email,
  `Tél : ${SOCIETE.telephone}`,
].join(" — ");

/**
 * Mentions de reglement, obligatoires entre professionnels.
 *
 * Le taux de penalite suit l'article L441-10 du code de commerce : taux de
 * refinancement de la BCE majore de dix points. L'indemnite forfaitaire de
 * 40 € pour frais de recouvrement est due de plein droit.
 */
export const MENTIONS_REGLEMENT = [
  "Règlement à réception de facture, par virement bancaire.",
  "Pas d'escompte pour paiement anticipé.",
  "Tout retard de paiement entraîne de plein droit des pénalités au taux de refinancement de la Banque centrale européenne majoré de 10 points, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement.",
] as const;

/**
 * Conditions d'exploitation rappelees au client.
 *
 * Elles figurent sur les devis actuels et conditionnent la faisabilite : sans
 * creneau de montage ni repas pour l'equipe, la prestation annoncee ne tient
 * pas. Les ecrire sur le devis evite de les decouvrir la veille.
 */
export const CONDITIONS_EXPLOITATION = [
  "Un créneau d'installation et de démontage doit être réservé aux équipes de part et d'autre de l'animation.",
  "La restauration de l'équipe d'animation est à prévoir par le client lorsque la prestation couvre un repas.",
  "Responsabilité civile organisateur incluse dans nos prestations.",
] as const;
