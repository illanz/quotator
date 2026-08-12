/**
 * Identification de l'animation vendue a partir du libelle d'une ligne de
 * facture.
 *
 * Quinze ans de facturation, 737 libelles distincts, ecrits a la main et sans
 * convention stable : « Question Box », « Animation Boite à Questions » et
 * « Boîte à Questions » designent la meme animation. Seule une ligne sur quatre
 * porte une reference produit exploitable.
 *
 * Le rapprochement se fait donc par alias. Deux garde-fous :
 *
 * - les lignes accessoires (deplacement, stationnement, impression,
 *   personnalisation) sont reconnues comme telles, jamais confondues avec une
 *   animation ni comptees comme non identifiees ;
 * - une ligne qui ne correspond a rien reste `null`. Un historique commercial
 *   sert a etayer un argument aupres d'un client : une attribution approximative
 *   y est pire qu'une absence.
 */

export type FamilleAnimation =
  | "Art et créativité"
  | "Musique et expression"
  | "Olympiades et défis"
  | "Éco-responsable"
  | "Jeux de piste et enquêtes"
  | "Quiz"
  | "Original et insolite"
  | "High tech"
  | "À distance"
  | "Zen et bien-être"
  | "Audiovisuel et cinéma";

export type AnimationConnue = {
  /** Cle stable, alignee sur la grille tarifaire quand l'animation y figure. */
  cle: string;
  nom: string;
  famille: FamilleAnimation;
  /** Vrai pour une animation qui n'est plus a la grille : utile pour l'historique. */
  historique?: boolean;
  /**
   * Expressions rencontrees dans les libelles, en minuscules et sans accent.
   * L'alias le plus long l'emporte : « mad burger quiz » avant « quiz ».
   */
  alias: string[];
};

/**
 * Termes qui designent a coup sur un accessoire, ou qu'ils apparaissent dans
 * l'amorce de la ligne.
 */
const ACCESSOIRES_FORTS: RegExp[] = [
  /forfait deplacement|frais de deplacement|deplacement du materiel|trajet/,
  /stationnement|parking/,
  /impression|tirage|figurines format/,
  /personnalisation|bandeau personnalise|fond interieur|fond personnalise/,
  /livraison|manutention|structure de fixation|mise a disposition/,
  /restauration|repas|hebergement|nuitee/,
  /fourniture|goodies|consommables/,
  /animateur supplementaire|artiste supplementaire|coach supplementaire|manutentionnaire/,
  /remise commerciale|acompte|solde|avoir|regularisation/,
];

/**
 * Termes qui ne designent un accessoire que lorsqu'ils ouvrent la ligne.
 *
 * Ils apparaissent aussi au fil de la description d'une vraie animation :
 * « Clip vidéo Animation 1 Cadreur Tournage en Full HD » est bien un Clip Dub,
 * et « Animation Mini U … option validée » reste un Mini U.
 */
const ACCESSOIRES_FAIBLES: RegExp[] = [
  /^montage|^demontage|^installation/,
  /^captation|^reportage photo|^tournage|^enregistrement audio|^post production/,
  /^option|^supplement|^livrable|^logo/,
  /^creation et integration|^mise en place\b/,
];

export const ANIMATIONS: AnimationConnue[] = [
  // ---------------------------------------------------------- Art et créativité
  { cle: "FRESQUE", nom: "Fresque", famille: "Art et créativité", alias: ["fresque patchwork", "atelier fresque", "fresque classique", "fresque sur mesure", "fresque"] },
  { cle: "GRAFFITI", nom: "Graffiti", famille: "Art et créativité", alias: ["graffiti street art", "atelier graffiti", "graff' it", "graffiti digital", "graffiti"] },
  { cle: "GRAFFWALL", nom: "GraffWall", famille: "Art et créativité", alias: ["graffwall"] },
  { cle: "MOSAIQUE", nom: "Mosaïque", famille: "Art et créativité", alias: ["oeuvre en mosaique", "atelier team building mosaique", "mosaique"] },
  { cle: "LIVE PAINTING", nom: "Live Painting", famille: "Art et créativité", alias: ["live painting"] },
  { cle: "PIXEL PAINTING", nom: "Pixel Painting", famille: "Art et créativité", historique: true, alias: ["pixel painting"] },
  { cle: "CUSTOM PARTY", nom: "Custom Party", famille: "Art et créativité", alias: ["custom party", "personnalisation d'objets"] },
  { cle: "ORIGAMI", nom: "Origami", famille: "Art et créativité", historique: true, alias: ["origami"] },
  { cle: "CREATION PARFUMS", nom: "Création de parfums", famille: "Art et créativité", alias: ["creation de parfum", "creation parfums", "atelier parfum"] },

  // ------------------------------------------------------ Musique et expression
  { cle: "BATUCADA", nom: "Batucada", famille: "Musique et expression", alias: ["batucada", "samba do brazil"] },
  { cle: "BODY PERCUSSION", nom: "Body Percussion", famille: "Musique et expression", alias: ["body perc"] },
  { cle: "TEAM HAKA", nom: "Team Haka", famille: "Musique et expression", alias: ["team haka", "haka"] },
  { cle: "TAP TAP", nom: "Tap Tap", famille: "Musique et expression", alias: ["tap tap"] },
  { cle: "FLASH MOB", nom: "Flash Mob", famille: "Musique et expression", alias: ["flash mob", "flashmob"] },
  { cle: "CHANT", nom: "Chant", famille: "Musique et expression", alias: ["animation chant", "la voix du succes"] },
  { cle: "THEATRE", nom: "Théâtre", famille: "Musique et expression", alias: ["team theatre", "atelier theatre"] },
  { cle: "OPEROCK", nom: "OpeRock", famille: "Musique et expression", historique: true, alias: ["operock"] },
  { cle: "BOITE A CHANSONS", nom: "Boîte à Chansons", famille: "Musique et expression", alias: ["boite a chansons", "cabine karaoke"] },

  // ------------------------------------------------------ Audiovisuel et cinéma
  { cle: "DOUBLAGE", nom: "Doublage de films", famille: "Audiovisuel et cinéma", alias: ["doublage de films", "atelier doublage", "doublage"] },
  { cle: "COURTS METRAGES", nom: "Courts métrages", famille: "Audiovisuel et cinéma", alias: ["court metrage", "courts metrages", "spots2pub", "cinema court metrage"] },
  { cle: "CLIP DUB", nom: "Clip Dub", famille: "Audiovisuel et cinéma", alias: ["clip dub", "lip dub", "clip video"] },
  { cle: "ZAPPING", nom: "Zapping", famille: "Audiovisuel et cinéma", historique: true, alias: ["animation zapping"] },
  { cle: "HOME STORY", nom: "Home Story", famille: "Audiovisuel et cinéma", alias: ["home story", "interview selfie"] },
  { cle: "SLEEVE FACE", nom: "Sleeve Face", famille: "Audiovisuel et cinéma", historique: true, alias: ["sleeve face"] },

  // -------------------------------------------------------- Olympiades et défis
  { cle: "OLYMPIADES", nom: "Olympiades", famille: "Olympiades et défis", alias: ["olympiades", "mad games", "objectif totem"] },
  { cle: "LEGO MANIA", nom: "Lego Mania", famille: "Olympiades et défis", alias: ["lego mania", "lego"] },
  { cle: "CREATION DE COCKTAILS", nom: "Création de cocktails", famille: "Olympiades et défis", alias: ["creation de cocktails", "cocktail gagnant", "cocktail challenge"] },
  { cle: "PATISSERIE", nom: "Pâtisserie", famille: "Olympiades et défis", alias: ["patisserie", "decoration cupcakes", "cupcakes"] },
  { cle: "SUSHIS", nom: "Sushis", famille: "Olympiades et défis", alias: ["sushi"] },
  { cle: "EXTREME DEFIS", nom: "Extrême Défis", famille: "Olympiades et défis", alias: ["extreme defis", "team vs wild"] },

  // ------------------------------------------------------------ Éco-responsable
  { cle: "CREACYCLE", nom: "CreaCycle", famille: "Éco-responsable", alias: ["creacycle", "atelier recyclage"] },
  { cle: "GREEN TAG", nom: "Green Tag", famille: "Éco-responsable", alias: ["green tag", "fresque vegetale", "graffiti vegetal"] },
  { cle: "MINI JARDINS", nom: "Mini Jardins", famille: "Éco-responsable", alias: ["mini jardin"] },
  { cle: "D-TOX", nom: "D-TOX", famille: "Éco-responsable", historique: true, alias: ["d-tox", "atelier dtox"] },

  // -------------------------------------------------- Jeux de piste et enquêtes
  { cle: "RALLYE INTERACTIF", nom: "Rallye Interactif", famille: "Jeux de piste et enquêtes", alias: ["rallye interactif", "rallye smartphone", "rallye 3.0", "rallye"] },
  { cle: "ESCAPE GAME SPACE K", nom: "Escape Game Space K", famille: "Jeux de piste et enquêtes", alias: ["escape game space k", "space k", "escape game"] },
  { cle: "MURDER PARTY", nom: "Murder Party", famille: "Jeux de piste et enquêtes", alias: ["murder party", "mystere de montrouge"] },

  // ------------------------------------------------------------------------ Quiz
  { cle: "MAD BURGER", nom: "Mad Burger Quiz", famille: "Quiz", alias: ["mad burger quiz", "burger quiz", "mad burger"] },
  { cle: "QUIZ MCZ", nom: "Quiz MadCityZen", famille: "Quiz", alias: ["superquiz", "quiz cine series", "blind test musical", "quiz personnalise", "team building quiz", "animation quiz", "quiz"] },
  { cle: "QUIZ RACE", nom: "Quiz Race", famille: "Quiz", alias: ["quiz race", "team connect"] },

  // ------------------------------------------------------- Original et insolite
  { cle: "BOITE A QUESTIONS", nom: "Boîte à Questions", famille: "Original et insolite", alias: ["boite a questions", "boite a question", "question box"] },
  { cle: "SECRET DEFIS", nom: "Secret Défis", famille: "Original et insolite", alias: ["secret defis"] },
  { cle: "DESTRUCTION CONSTRUCTIVE", nom: "Destruction Constructive", famille: "Original et insolite", alias: ["destruction constructive", "rage room", "autosmash"] },
  { cle: "POSTER BOX", nom: "Poster Box", famille: "Original et insolite", alias: ["poster box"] },
  { cle: "PHOTOCALL", nom: "PhotoCall", famille: "Original et insolite", alias: ["photocall on the ground", "photocall poster", "photocall", "photo on the ground"] },
  { cle: "PHOTO MOSAIC WALL", nom: "Photo Mosaic Wall", famille: "Original et insolite", alias: ["photo mosaique wall", "photo mosaic wall"] },
  { cle: "LIGHT PAINTING", nom: "Light Painting", famille: "Original et insolite", alias: ["light painting", "big picture"] },
  { cle: "MAGIC MIRROR", nom: "Magic Mirror", famille: "Original et insolite", historique: true, alias: ["magic mirror"] },
  { cle: "DECOR PENCHE", nom: "Décor Penché", famille: "Original et insolite", historique: true, alias: ["decor penche"] },
  { cle: "DEGUSTATION INSECTES", nom: "Dégustation d'insectes", famille: "Original et insolite", alias: ["degustation d'insectes", "insectes"] },
  { cle: "STUDIO LIVE", nom: "Studio Live", famille: "Original et insolite", historique: true, alias: ["studio live"] },
  { cle: "TRUCK TRUCK STUDIO", nom: "Truck Truck Studio", famille: "Original et insolite", alias: ["truck truck studio"] },

  // -------------------------------------------------------------------- High tech
  { cle: "MINI U", nom: "Mini U", famille: "High tech", alias: ["mini u for you", "mini u cristal", "mini u", "figurine 3d"] },
  { cle: "RETRO GAMES", nom: "Retro Games", famille: "High tech", alias: ["retro games"] },
  { cle: "REALITE VIRTUELLE", nom: "Réalité virtuelle", famille: "High tech", alias: ["realite virtuelle", "virtual reality", "meta quest", "360 vive total immersion", "vr"] },
  { cle: "PAC MAN VR", nom: "Pac Man VR", famille: "High tech", alias: ["pac man xperience", "pac man"] },
  { cle: "SIMULATEUR 4D", nom: "Simulateur 4D", famille: "High tech", alias: ["simulateur 4d", "360 video xperience", "video 4d"] },
  { cle: "ROBOTS MAKERS", nom: "Robots Makers", famille: "High tech", alias: ["robots makers", "construction de robots"] },
  { cle: "ROBOTS FOOT", nom: "Robots Foot", famille: "High tech", alias: ["robots foot"] },
  { cle: "ROBOTS BOXE", nom: "Robots Boxe", famille: "High tech", alias: ["robots boxe"] },
  { cle: "ROBOT DANSE", nom: "Robots danseurs", famille: "High tech", alias: ["robots danseurs", "robot danse"] },
  { cle: "DIGIBEERPONG", nom: "DigiBeer Pong", famille: "High tech", alias: ["digibeer pong", "digibeerpong", "beer pong"] },
  { cle: "FAB BAR", nom: "Fab Bar", famille: "High tech", alias: ["fab bar", "fab lab"] },
  { cle: "CLICK & MEET", nom: "Click & Meet", famille: "High tech", alias: ["click & meet", "click and meet", "qui est qui"] },
  { cle: "TEAM RACE", nom: "Team Race", famille: "High tech", alias: ["team race", "bubble board", "course digitale"] },
  { cle: "PILOT WARS", nom: "Pilot Wars", famille: "High tech", historique: true, alias: ["pilot wars", "flying experience", "ar drone"] },
  { cle: "TRON PARTY", nom: "Tron Party", famille: "High tech", historique: true, alias: ["tron party"] },
  { cle: "SELFIE GRAFF IT", nom: "Selfie Graff'it", famille: "High tech", alias: ["pimp my selfie", "selfie graff"] },

  // ------------------------------------------------------------------ À distance
  { cle: "ESCAPE GAME VISIO", nom: "Escape Game Visio", famille: "À distance", alias: ["escape game visio"] },
  { cle: "HOME COOKING", nom: "Home Cooking", famille: "À distance", alias: ["home cooking"] },
  { cle: "HOME CHALLENGE", nom: "Home Challenge", famille: "À distance", alias: ["home challenge"] },
  { cle: "DIGITAL MOSAIC", nom: "Digital Mosaic", famille: "À distance", alias: ["digital mosaic"] },
  { cle: "RELAX AT HOME", nom: "Relax@Home", famille: "À distance", historique: true, alias: ["relax@home", "relax at home"] },

  // ------------------------------------------------------------ Zen et bien-être
  { cle: "YOGA", nom: "Yoga", famille: "Zen et bien-être", alias: ["initiation au yoga", "yoga"] },
  { cle: "QI GONG", nom: "Qi Gong", famille: "Zen et bien-être", alias: ["qi gong"] },
  { cle: "MASSAGE", nom: "Massage AMMA", famille: "Zen et bien-être", alias: ["massage amma", "massage"] },
];

/** Retire accents, balises et ponctuation pour comparer des libelles ecrits a la main. */
export function normaliser(libelle: string): string {
  return libelle
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export type Identification =
  | { type: "ANIMATION"; animation: AnimationConnue }
  | { type: "ACCESSOIRE" }
  | { type: "INCONNU"; libelle: string };

/** Index alias -> animation, trie du plus long au plus court. */
const INDEX: Array<{ alias: string; animation: AnimationConnue }> = ANIMATIONS.flatMap((a) =>
  a.alias.map((alias) => ({ alias: normaliser(alias), animation: a })),
).sort((x, y) => y.alias.length - x.alias.length);

export function identifierAnimation(libelle: string): Identification {
  const texte = normaliser(libelle);
  if (texte === "") return { type: "ACCESSOIRE" };

  // Seul le debut du libelle designe la prestation : la suite decrit le
  // deroule, et mentionne souvent d'autres animations a titre de comparaison.
  const tete = texte.slice(0, 160);
  // Les tout premiers mots annoncent la nature de la ligne. « Personnalisation
  // du fond interieur type photocall » est un accessoire, meme s'il nomme une
  // animation ; « Animation Mini U … logo socle » reste une animation, meme
  // s'il mentionne un accessoire plus loin.
  const amorce = texte.slice(0, 60);

  if (ACCESSOIRES_FORTS.some((r) => r.test(amorce))) return { type: "ACCESSOIRE" };
  if (ACCESSOIRES_FAIBLES.some((r) => r.test(amorce))) return { type: "ACCESSOIRE" };

  for (const { alias, animation } of INDEX) {
    if (tete.includes(alias)) return { type: "ANIMATION", animation };
  }
  if (ACCESSOIRES_FORTS.some((r) => r.test(tete))) return { type: "ACCESSOIRE" };
  return { type: "INCONNU", libelle: libelle.slice(0, 120) };
}
