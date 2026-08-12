# Quotator

Outil de gestion commerciale MadCityZen (MAD CORP) : catalogue, grille
tarifaire, devis, PDF, envoi client, suivi, puis facturation via
facturation.pro.

Le cadrage du projet vit dans [`docs/`](docs/) :

| Document | Contenu |
|---|---|
| [`00-cadrage.md`](docs/00-cadrage.md) | Décisions prises, règles extraites des sources, questions ouvertes par jalon |
| [`01-conversion.md`](docs/01-conversion.md) | Cycle de vie du devis, séquence de relance, copy des mails |
| [`02-migration-clients.md`](docs/02-migration-clients.md) | Analyse des 7 551 fiches clients et plan de reprise |

## Démarrer

```sh
npm install
cp .env.example .env   # renseigner DATABASE_URL
npm test               # la suite tourne sans base de données
```

| Commande | Rôle |
|---|---|
| `npm test` | Suite de tests (Vitest) |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:validate` | Validation du schéma Prisma |
| `npm run db:push` | Applique le schéma à la base |
| `npm run dev` | Serveur de développement Next.js |

## Ce qui est construit

Le socle : modèle de données, import de la grille tarifaire, moteur de prix.

```
prisma/schema.prisma      Modèle de données
src/domain/               Règles et primitives métier
  money.ts                Arithmétique en centimes entiers
  paliers.ts              Les dix tranches de participants
  calendrier.ts           Dates d'événement, week-ends, jours fériés
  regles.ts               Règles commerciales arbitrées
src/tarifs/               Grille tarifaire
  parse-grille.ts         Lecture du fichier Excel officiel
  diff.ts                 Écarts entre deux millésimes, à valider avant import
src/pricing/              Moteur de prix
  engine.ts               Calcul d'un devis complet
  frais.ts                Frais de déplacement
fixtures/                 Grille 2026, utilisée par les tests
```

### Trois partis pris

**Les montants sont des entiers de centimes.** Un devis enchaîne majorations,
remises et sommes de lignes ; en flottant, ces opérations laissent des résidus
qui finissent par décaler le total affiché du total recalculé.

**La grille est versionnée, et son import est validé.** L'Excel reste la source
de vérité, mais un import qui s'applique sans relecture propage une faute de
frappe sur tous les devis à venir. `comparerGrilles` produit les écarts —
animations ajoutées ou retirées, prix modifiés palier par palier avec leur
variation, changements de régime, notes de bas de grille — que le commercial
valide avant remplacement.

**Le moteur est une fonction pure.** Mêmes entrées, mêmes sorties : un devis se
recalcule à l'identique des mois plus tard, et chaque règle se teste isolément.

### Ce que le moteur sait faire

- Prix par palier de participants, avec détection des fourchettes à cheval sur
  deux tranches (« 25-40 pax » n'a pas de prix évident : on demande plutôt que
  de deviner).
- Majoration de 15 % les week-ends et jours fériés, jours fériés mobiles
  compris — Pâques, Ascension, Pentecôte sont calculés, pas codés en dur.
- Remise en ligne négative rattachée à la prestation qu'elle remise, calculée
  sur le prix majoré, et optionnelle si la prestation l'est.
- Convention multi-animations : la première ferme, les suivantes présentées en
  option et précédées d'un saut de page, exclues du total.
- Frais de déplacement à 1 € HT du kilomètre aller-retour au départ de
  Courbevoie, hors 75/92/93/94.
- Ventilation de la TVA par taux, total TTC, acompte de 70 %.
- Avertissements plutôt que chiffres silencieux : une prestation sans prix ou un
  kilométrage manquant sont signalés, jamais facturés à zéro.

### Vérifié sur les données réelles

Les tests s'exécutent sur la grille 2026 officielle et rejouent deux devis
réellement émis :

- **19800** (YOUSIGN, Batucada 200 pax) — 6 560 € HT, 7 872 € TTC.
- **19584** (quatre animations, remise agence) — 2 961 € HT affichés, les trois
  animations optionnelles restant hors total.

Les deux se recalculent au centime près.
