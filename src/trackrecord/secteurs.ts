/**
 * Classement sectoriel des clients, a partir de leur raison sociale.
 *
 * L'export facturation.pro ne porte aucune information de secteur, et 90 % des
 * clients factures n'ont pas de SIRET exploitable : l'annuaire des entreprises
 * ne peut donc pas etre interroge pour la majorite d'entre eux. Le classement
 * se fait par mots-cles sur le nom, ce qui donne une premiere passe fiable sur
 * les cas evidents et laisse le reste a classer a la main.
 *
 * Un point de methode important pour l'usage commercial : une part notable du
 * chiffre d'affaires passe par des **agences**, qui commandent pour un client
 * final dont le secteur n'apparait nulle part. Elles sont donc classees comme
 * agences, et non rangees dans un secteur : dire a un prospect industriel
 * « nous avons deja travaille pour une agence » n'a aucune valeur d'argument.
 */

export type Secteur =
  | "Agence événementielle"
  | "Lieu partenaire"
  | "Banque, assurance, finance"
  | "Santé, pharmacie"
  | "Industrie, énergie"
  | "Tech, numérique, télécom"
  | "Conseil, audit, juridique"
  | "Immobilier, construction"
  | "Distribution, grande conso"
  | "Transport, logistique"
  | "Média, publicité, communication"
  | "Luxe, mode, beauté"
  | "Secteur public, collectivité"
  | "Association, fondation"
  | "Éducation, formation"
  | "Hôtellerie, restauration, tourisme"
  | "Automobile"
  | "Non classé";

type Regle = { secteur: Secteur; motifs: RegExp };

/**
 * L'ordre compte : la premiere regle qui correspond l'emporte. Les agences sont
 * testees en premier, car beaucoup portent dans leur nom un mot appartenant a
 * un autre secteur (« BNP Paribas Events » est une agence interne, pas une
 * banque cliente).
 */
const REGLES: Regle[] = [
  {
    secteur: "Agence événementielle",
    motifs:
      /\bagence\b|\bevent|\bmice\b|incentive|seminaire|receptif|dmc\b|traiteur|voyages? d'affaires|business travel|\btravel\b|congres|convention|roadshow|team ?building|animation|evenement|evenementiel|\\bmeeting\\b|\\bprod\\b|production evenement|mci group|publicis event|cwt|hogg robinson|carlson wagonlit|ideal meetings|funbooker|lever de rideau|novabox|creative spirit|wmh project|capdel|one experience|7eme sud|awakit|agora voyages|mktg|digital day|gp explorer|egg\b/i,
  },
  {
    secteur: "Média, publicité, communication",
    motifs:
      /\bmedia|\bpresse\b|publicit|\bcom'?\b|communication|\bpub\b|editions?\b|television|\btv\b|radio|journal|magazine|havas|omnicom|dentsu|tbwa|ogilvy|\bbbdo\b/i,
  },
  {
    secteur: "Banque, assurance, finance",
    motifs:
      /banque|\bbank\b|\bbnp\b|societe generale|credit agricole|\bca\b consumer|caisse d'epargne|\bbpce\b|\blcl\b|\bhsbc\b|natixis|amundi|\bcic\b|banque populaire|assurance|assureur|\baxa\b|allianz|generali|\bmaif\b|\bmacif\b|matmut|\bmma\b|groupama|\bmutuelle|\bcnp\b|swiss ?life|\bapicil\b|malakoff|\bag2r\b|klesia|\bagirc|prevoyance|gestion d'actifs|asset management|\bfinance|\bfintech|courtage|\bbourse\b|\bcredit\b/i,
  },
  {
    secteur: "Santé, pharmacie",
    motifs:
      /pharma|\bsante\b|\bmedic|hopital|\bchu\b|clinique|laboratoire|\blabo\b|biotech|\bsanofi|novartis|pfizer|roche\b|\bmsd\b|astrazeneca|\bbayer\b|servier|ipsen|biogen|\bglaxo|\bgsk\b|\bmerck|\bboiron|\bdiagnostic|\bortho|dentaire|\bvet\b|veterinaire|\behpad\b|\bmutualite\b/i,
  },
  {
    secteur: "Tech, numérique, télécom",
    motifs:
      /\bsoftware|\bsaas\b|\bcloud\b|\bdigital\b|\bnumerique\b|informatique|\bit services|\btelecom|\borange\b|\bsfr\b|bouygues telecom|\bfree\b|\bnokia\b|ericsson|\bibm\b|microsoft|\bgoogle\b|\bamazon\b|\bapple\b|\boracle\b|\bsap\b|\bcisco\b|\bdell\b|\bintel\b|\batos\b|capgemini|\bsopra|\binetum|\bcgi\b|\bdevoteam|\bopen\b|\bsii\b|\balten\b|\bakka\b|\bexpleo\b|\btech\b|\bdata\b|\bcyber|\bstartup|\bplatform|\bsystem|\bsolutions?\b|\bnetwork|\bhosting|\bhebergeur|\badista\b|\bovh\b|\bscaleway|\bdocaposte|\byousign|\bdoctolib|\bblablacar|\bcriteo|\bdailymotion/i,
  },
  {
    secteur: "Conseil, audit, juridique",
    motifs:
      /\bconseil\b|consulting|\bconsultant|\baudit\b|\bavocat|\bcabinet\b|\bnotaire|expertise comptable|expert-?comptable|\bkpmg\b|\bdeloitte\b|\bey\b|ernst ?& ?young|\bpwc\b|\bmazars\b|\bgrant thornton|\bbcg\b|mckinsey|\bbain\b|accenture|\bwavestone|\beurogroup|\bsia partners|\bstrategy\b|\brh\b|ressources humaines|recrutement|\bstaffing/i,
  },
  {
    secteur: "Immobilier, construction",
    motifs:
      /immobilier|\bimmo\b|\bfoncier|\bpromotion\b|\bbtp\b|construction|batiment|\btravaux\b|\barchitect|\bbouygues\b|\bvinci\b|\beiffage\b|\bspie\b|\bcolas\b|\bnexity\b|\bkaufman|\bicade\b|\bgecina\b|\bunibail|\bklepierre|\bfoncia\b|\bnexta|\bsyndic|\bhlm\b|\bhabitat\b|\blogement/i,
  },
  {
    secteur: "Distribution, grande conso",
    motifs:
      /\bcarrefour|\bauchan\b|\bleclerc\b|\bintermarche|\bcasino\b|\bmonoprix|\bfranprix|\blidl\b|\baldi\b|\bmetro\b|\bpicard\b|\bdecathlon|\bfnac\b|\bdarty\b|\bboulanger|\bikea\b|\bleroy merlin|\bcastorama|\bbricorama|\bconforama|\bdistribution\b|\bretail\b|\bgrande surface|\bsupermarch|\bhypermarch|\bmagasins?\b|\bfranchise\b|\bdanone\b|\bnestle\b|\bunilever|\bmars\b|\bferrero|\bpepsi|\bcoca|\bheineken|\bpernod|\bbel\b|\blactalis|\bsodebo|\bbonduelle|\bpomona\b|\bagroaliment/i,
  },
  {
    secteur: "Luxe, mode, beauté",
    motifs:
      /\bluxe\b|\blvmh\b|\bkering\b|\bchanel\b|\bdior\b|\bhermes\b|\bcartier\b|\bvuitton|\bguerlain|\bsephora|\bloreal\b|\bl'oreal|\byves rocher|\bclarins|\bestee|\bmode\b|\bcouture\b|\bpret-a-porter|\bmaroquinerie|\bjoaillerie|\bhorlogerie|\bparfum|\bcosmetique|\bbeaute\b/i,
  },
  {
    secteur: "Automobile",
    motifs:
      /\bautomobile|\bauto\b|\brenault|\bpeugeot|\bcitroen|\bstellantis|\bvolkswagen|\btoyota\b|\bnissan\b|\bbmw\b|\bmercedes|\baudi\b|\bford\b|\bvaleo\b|\bfaurecia|\bmichelin|\bplastic omnium|\bconcession|\bgarage\b/i,
  },
  {
    secteur: "Transport, logistique",
    motifs:
      /\btransport|\blogistique|\bsupply chain|\bfret\b|\bmessagerie|\bsncf\b|\bratp\b|\bair france|\btransavia|\bgeodis\b|\bdhl\b|\bups\b|\bfedex\b|\bchronopost|\bla poste\b|\bstef\b|\bxpo\b|\bkuehne|\bbollore|\bcma cgm|\bport\b|\baeroport|\bcompagnie aerienne/i,
  },
  {
    secteur: "Industrie, énergie",
    motifs:
      /\bindustrie|\bindustriel|\busine\b|\bmanufactur|\bedf\b|\bengie\b|\btotal|\bveolia|\bsuez\b|\bsaint-gobain|\bschneider|\bthales\b|\bsafran\b|\bairbus\b|\bdassault|\bnaval group|\barcelor|\balstom\b|\bsiemens|\bgeneral electric|\babb\b|\blegrand\b|\bsomfy\b|\bsolvay|\barkema|\bair liquide|\benergie\b|\bnucleaire|\bpetrole|\bchimie\b|\bmetallurgie|\bplasturgie|\bemballage/i,
  },
  {
    secteur: "Hôtellerie, restauration, tourisme",
    motifs:
      /\bhotel|\bhospitality|\baccor\b|\bmarriott|\bhilton\b|\bibis\b|\bnovotel|\brestaurant|\brestauration|\bbrasserie|\bcafe\b|\btourisme|\bcamping|\bclub med|\bpierre & vacances|\bcasino de\b|\bloisirs\b|\bparc\b/i,
  },
  {
    secteur: "Secteur public, collectivité",
    motifs:
      /\bmairie\b|\bville de\b|\bcommune\b|\bdepartement\b|\bregion\b|\bprefecture|\bministere|\bconseil general|\bconseil departemental|\bconseil regional|\bcommunaute d'agglo|\bmetropole\b|\bccas\b|\bcaf\b|\bcpam\b|\burssaf|\bpole emploi|\bfrance travail|\bonisep|\bcnrs\b|\binserm|\bcea\b|\binra|\bifremer|\bademe|\bbpifrance|\bcaisse des depots|\bagence nationale|\betablissement public|\bprefet|\barmee\b|\bgendarmerie|\bpolice\b|\bpompiers/i,
  },
  {
    secteur: "Association, fondation",
    motifs:
      /\bassociation\b|\basso\b|\bfondation\b|\bong\b|\bcomite d'entreprise|\bcse\b|\bcomite social|\bamicale\b|\bfederation\b|\bsyndicat\b|\bunion\b|\bcroix-rouge|\bsecours populaire|\bunicef|\bwwf\b|\bemmaus|\bapf\b/i,
  },
  {
    secteur: "Éducation, formation",
    motifs:
      /\becole\b|\buniversite|\bcampus\b|\bformation\b|\bacademie\b|\binstitut\b|\bcollege\b|\blycee\b|\bmba\b|\bbusiness school|\bpolytechnique|\bcentrale\b|\bhec\b|\bessec\b|\bescp\b|\bedhec\b|\bsciences po|\bcfa\b|\bapprentissage/i,
  },
];

/**
 * Enseignes reconnues, classees explicitement.
 *
 * Cette liste n'accueille que ce qui est su, jamais ce qui est suppose. Les
 * agences aux noms opaques — Sagarmatha, Oh Yes, Roadbook — n'y figurent pas :
 * elles sont reperees par la mention de tarification agence portee sur leurs
 * propres factures, ou restent a classer.
 *
 * Aucune regle de mots-cles ne devinera qu'« Ubisoft » est une entreprise de
 * jeu video ou que « Sagarmatha » est une agence evenementielle. Ces noms sont
 * donc listes, sur la base de ce que montre l'historique de facturation.
 *
 * Le rapprochement se fait sur le nom normalise complet ou son debut, jamais
 * par inclusion : « SIMPLE » ne doit pas attraper « SIMPLEXITY ».
 */
const ENSEIGNES: Array<[string, Secteur]> = [
  // Agences evenementielles et prestataires intermediaires
  ["auditoire", "Agence événementielle"],
  ["epoka", "Agence événementielle"],
  ["hopscotch", "Agence événementielle"],
  ["comexposium", "Agence événementielle"],
  ["banks sadler", "Agence événementielle"],
  ["la fonderie", "Agence événementielle"],

  // Lieux partenaires
  ["chateauform", "Lieu partenaire"],
  ["nouveau chalet du lac", "Lieu partenaire"],
  ["le pavillon d armenonville", "Lieu partenaire"],
  ["pavillon d armenonville", "Lieu partenaire"],

  // Tech et numerique
  ["ubisoft", "Tech, numérique, télécom"],
  ["prestashop", "Tech, numérique, télécom"],
  ["kaspersky", "Tech, numérique, télécom"],
  ["stordata", "Tech, numérique, télécom"],
  ["comuto", "Tech, numérique, télécom"],
  ["intescia", "Tech, numérique, télécom"],
  ["wivetix", "Tech, numérique, télécom"],
  ["syloa", "Tech, numérique, télécom"],
  ["agap2", "Tech, numérique, télécom"],
  ["altran", "Tech, numérique, télécom"],
  ["gva", "Tech, numérique, télécom"],
  ["delta process", "Tech, numérique, télécom"],

  // Industrie et energie
  ["lafarge", "Industrie, énergie"],
  ["imerys", "Industrie, énergie"],
  ["hilti", "Industrie, énergie"],
  ["manitou", "Industrie, énergie"],
  ["goodyear", "Industrie, énergie"],
  ["raja", "Industrie, énergie"],
  ["phoenix contact", "Industrie, énergie"],
  ["saipem", "Industrie, énergie"],
  ["derichebourg", "Industrie, énergie"],
  ["ppg france", "Industrie, énergie"],
  ["jt international", "Industrie, énergie"],
  ["raboni", "Industrie, énergie"],
  ["groupe lemoine", "Industrie, énergie"],
  ["lassarat", "Industrie, énergie"],
  ["erdf", "Industrie, énergie"],
  ["enedis", "Industrie, énergie"],
  ["dalkia", "Industrie, énergie"],
  ["areva", "Industrie, énergie"],
  ["andra", "Industrie, énergie"],
  ["enertrag", "Industrie, énergie"],
  ["amplitude laser", "Industrie, énergie"],
  ["white birch", "Industrie, énergie"],
  ["scael", "Industrie, énergie"],

  // Banque, assurance, finance
  ["boursorama", "Banque, assurance, finance"],
  ["transactis", "Banque, assurance, finance"],
  ["rsa luxembourg", "Banque, assurance, finance"],
  ["willis towers watson", "Banque, assurance, finance"],
  ["humanis", "Banque, assurance, finance"],
  ["gie humanis", "Banque, assurance, finance"],
  ["renee costes", "Banque, assurance, finance"],
  ["terre invest", "Banque, assurance, finance"],
  ["athlon car lease", "Automobile"],

  // Sante
  ["biocodex", "Santé, pharmacie"],
  ["gedeon richter", "Santé, pharmacie"],
  ["diaconesses", "Santé, pharmacie"],
  ["mgen", "Santé, pharmacie"],
  ["gie imsa", "Santé, pharmacie"],

  // Conseil et etudes
  ["ekimetrics", "Conseil, audit, juridique"],
  ["kantar", "Conseil, audit, juridique"],
  ["optimind", "Conseil, audit, juridique"],
  ["epsa", "Conseil, audit, juridique"],
  ["db&a", "Conseil, audit, juridique"],
  ["groupe tgs", "Conseil, audit, juridique"],
  ["catalina marketing", "Conseil, audit, juridique"],
  ["csbl", "Conseil, audit, juridique"],

  // Distribution et grande conso
  ["printemps", "Distribution, grande conso"],
  ["scamark", "Distribution, grande conso"],
  ["animalis", "Distribution, grande conso"],
  ["compagnie des fromages", "Distribution, grande conso"],
  ["home shopping service", "Distribution, grande conso"],
  ["oeuf cocotte", "Distribution, grande conso"],

  // Secteur public
  ["sipperec", "Secteur public, collectivité"],
  ["anfh", "Secteur public, collectivité"],
  ["autorite des marches financiers", "Secteur public, collectivité"],
  ["eppdcsi", "Secteur public, collectivité"],
  ["service facturier cnam", "Secteur public, collectivité"],
  ["cnam", "Secteur public, collectivité"],

  // Transport et voyage
  ["joubert voyages", "Transport, logistique"],
  ["voyages emile weber", "Transport, logistique"],
  ["aftral", "Éducation, formation"],
];

/** Normalise une raison sociale pour la comparaison. */
function normaliser(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9&']+/g, " ")
    .trim();
}

/**
 * Cle de comparaison d'une enseigne : la ponctuation varie d'une saisie a
 * l'autre (« Chateauform' France », « S'CAPE EVENEMENTS »), pas l'identite.
 */
function cleEnseigne(nom: string): string {
  return nom.replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export type ClassementSecteur = {
  secteur: Secteur;
  /** Vrai quand le classement vient d'une regle, faux quand il reste a faire. */
  automatique: boolean;
};

export function classerSecteur(raisonSociale: string | null | undefined): ClassementSecteur {
  if (!raisonSociale) return { secteur: "Non classé", automatique: false };
  const nom = normaliser(raisonSociale);

  // Les enseignes connues priment : elles sont classees a la main, sur la foi
  // de l'historique, et n'ont pas a subir l'approximation d'un mot-cle.
  const cle = cleEnseigne(nom);
  for (const [enseigne, secteur] of ENSEIGNES) {
    const attendu = cleEnseigne(enseigne);
    if (cle === attendu || cle.startsWith(`${attendu} `)) {
      return { secteur, automatique: true };
    }
    // « GH DIACONESSES CROIX SAINT SIMON » : l'enseigne n'ouvre pas toujours la
    // raison sociale. La recherche en position libre n'est autorisee que pour
    // les noms assez longs pour ne pas se confondre avec un mot courant.
    if (attendu.length >= 8 && new RegExp(`\\b${attendu}\\b`).test(cle)) {
      return { secteur, automatique: true };
    }
  }

  for (const regle of REGLES) {
    if (regle.motifs.test(nom)) return { secteur: regle.secteur, automatique: true };
  }
  return { secteur: "Non classé", automatique: false };
}

/**
 * Mention portee sur les devis vendus a tarif agence.
 *
 * C'est le marqueur le plus fiable dont dispose l'historique : il vient de la
 * facturation elle-meme, pas d'une interpretation du nom. Il figure le plus
 * souvent dans la ligne de titre de l'evenement, sous la forme « Remise 10 %
 * incluse, reservee aux agences » ou « Tarification Agences ».
 */
export const MARQUEUR_TARIF_AGENCE =
  /tarification\s+agence|tarif\s+agence|reserv\w*\s+aux\s+agences|remise\s+agence/i;

/** Un secteur qui ne dit rien du metier du client final. */
export function estIntermediaire(secteur: Secteur): boolean {
  return secteur === "Agence événementielle" || secteur === "Lieu partenaire";
}
