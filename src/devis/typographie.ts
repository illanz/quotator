/**
 * Normalisation typographique des textes herites.
 *
 * Quinze ans de saisie dans un champ sans mise en forme ont laisse des
 * conventions anglo-saxonnes dans des textes francais : guillemets droits,
 * apostrophes verticales, deux-points colles au mot precedent, montants sans
 * espace avant l'euro. Rien de tout cela ne se voit a la saisie ; tout se voit
 * une fois compose sur un devis.
 *
 * Ces regles sont celles de la typographie francaise courante, appliquees
 * mecaniquement et sans exception : elles ne changent pas le sens, seulement
 * la tenue.
 */

/** Espace fine insecable : avant ; : ! ? et dans les montants. */
const FINE = " ";
/** Espace insecable : entre un nombre et son unite. */
const INSECABLE = " ";

/** Milliers d'un montant, reperes a l'euro qui les suit. */
const MILLIERS = new RegExp(`\\b(\\d{1,3})(\\d{3})(?=${INSECABLE}?€)`, "g");

/**
 * Remplace les guillemets droits par des guillemets francais.
 *
 * Les paires sont traitees ensemble pour ne pas transformer une apostrophe
 * isolee en guillemet ouvrant : « Street Art "Graffiti » n'a pas de fermante,
 * et doit rester tel quel plutot que de produire un guillemet orphelin.
 */
function guillemets(texte: string): string {
  return texte.replace(/"([^"]+)"/g, `«${FINE}$1${FINE}»`);
}

export function normaliserTypographie(texte: string): string {
  return (
    guillemets(texte)
      // Apostrophe typographique, sauf dans un mot deja compose.
      .replace(/'/g, "’")
      // Espace fine insecable avant la ponctuation double, sauf dans une URL.
      .replace(/\s*:(?!\/\/)/g, `${FINE}:`)
      .replace(/\s*([;!?])/g, `${FINE}$1`)
      // Les montants et pourcentages ne se separent pas de leur signe.
      .replace(/(\d)\s*€/g, `$1${INSECABLE}€`)
      .replace(/(\d)\s*%/g, `$1${INSECABLE}%`)
      // « 1€HT/Km » : l'unite se detache, et le kilometre ne prend pas de
      // majuscule.
      .replace(/€(HT|TTC)/gi, `€${INSECABLE}$1`)
      .replace(/\/\s*Km\b/g, "/km")
      // Separateur de milliers dans les montants a quatre chiffres et plus.
      .replace(MILLIERS, `$1${INSECABLE}$2`)
      // Un tiret entre deux mots est un tiret demi-cadratin, pas un signe moins.
      .replace(/ - /g, " – ")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}

/**
 * Met une majuscule initiale sans toucher au reste.
 *
 * Les intitules du catalogue arrivent parfois tout en capitales : les abaisser
 * entierement casserait les noms propres et les sigles.
 */
export function majusculeInitiale(texte: string): string {
  if (texte === "") return texte;
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/**
 * Intitule de section presentable.
 *
 * Le catalogue ecrit « FRAIS DE DEPLACEMENT » ; un devis compose n'a pas besoin
 * de crier. Les capitales sont rendues par le style, pas par le texte.
 */
export function intituleSection(texte: string): string {
  const sansAccent = texte.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const toutCapitales = sansAccent === sansAccent.toUpperCase();
  return majusculeInitiale(toutCapitales ? texte.toLowerCase() : texte);
}
