# Historique commercial

Quinze ans de facturation transformés en base exploitable, et ce qu'on peut en
faire.

## 1. Ce qui a été reconstruit

À partir de l'export facturation.pro : **4 169 factures de 2012 à 2026**,
ramenées à **2 485 événements**, **1 266 clients**, **8,27 M€ HT**.

### La maille est l'événement, pas la facture

Une prestation donne lieu à un acompte puis à un solde, qui se complètent :
70 % et 30 % du même montant. Compter les factures doublerait les volumes et
fausserait les montants. Les factures d'une même prestation sont donc regroupées
par leur devis d'origine — 1 423 événements sont dans ce cas.

C'est aussi ce qui règle le problème des factures d'acompte, qui ne portent
aucune trace de l'animation vendue : l'information vient de la facture
descriptive du même événement.

### Identification des animations

Quinze ans de saisie manuelle, sans convention stable : « Question Box »,
« Animation Boite à Questions » et « Boîte à Questions » désignent la même
animation, et seule une ligne sur quatre porte une référence produit.

Le rapprochement se fait par alias, avec deux garde-fous :

- les lignes accessoires — déplacement, stationnement, impression,
  personnalisation — sont reconnues comme telles, jamais comptées comme des
  animations ni comme des échecs d'identification ;
- ce qui n'est pas reconnu reste inconnu. Un historique sert à étayer un
  argument devant un client : une attribution approximative y est pire qu'une
  absence.

**Résultat : 83 % des événements portent au moins une animation identifiée**,
75 animations distinctes rencontrées, 5 % de lignes non reconnues.

### Classement sectoriel

L'export ne porte aucune information de secteur, et 90 % des clients facturés
n'ont pas de SIRET exploitable : l'annuaire des entreprises ne peut pas être
interrogé pour la plupart d'entre eux. Le classement se fait donc par mots-clés
sur la raison sociale.

Pour les agences, la donnée offre un signal bien meilleur que le nom : la
**mention d'une tarification agence** sur les factures. Elle identifie 339
clients représentant 44 % du chiffre d'affaires, là où les noms d'agences
événementielles françaises — Auditoire, Epoka, Roadbook, Oh Yes, Sagarmatha —
ne portent aucun mot-clé exploitable.

## 2. Ce que la donnée dit

### Répartition

| | Événements | CA HT |
|---|---|---|
| Clients directs | 1 866 | 5 803 558 € |
| Agences | 619 | 2 468 467 € |

Panier moyen : **3 329 €**. Le pic d'activité est 2022 (930 k€), le pic de
volume 2021 (361 événements, panier de 1 969 € — l'année du distanciel).

### Les dix animations les plus vendues

| Animation | Événements | CA HT |
|---|---|---|
| Boîte à Questions | 187 | 838 301 € |
| Mini U | 172 | 444 823 € |
| Réalité virtuelle | 136 | 211 366 € |
| Escape Game Visio | 114 | 158 300 € |
| Doublage de films | 107 | 268 334 € |
| Mad Burger Quiz | 106 | 191 872 € |
| Lego Mania | 90 | 287 698 € |
| Team Haka | 88 | 397 461 € |
| Quiz MadCityZen | 86 | 194 443 € |
| Batucada | 84 | 311 347 € |

### Ce que chaque secteur achète

Clients directs uniquement — c'est la table qui alimente l'argument de
réassurance dans les relances.

| Secteur | Événements | Clients | Top 3 |
|---|---|---|---|
| Banque, assurance, finance | 207 | 89 | Doublage (20), Home Cooking (19), Mini U (13) |
| Tech, numérique, télécom | 83 | 48 | Mad Burger (9), Quiz Race (9), Escape Game Visio (7) |
| Conseil, audit, juridique | 74 | 30 | Home Challenge (11), Escape Game Visio (10), Graffiti (7) |
| Média, publicité | 39 | 18 | Boîte à Questions (6), Mini U (5), GraffWall (3) |
| Industrie, énergie | 38 | 21 | Mini U (8), Fresque (3), Réalité virtuelle (3) |
| Immobilier, construction | 33 | 21 | Mini U (5), Réalité virtuelle (5), Team Haka (4) |

La banque et l'assurance sont, de loin, le premier secteur : 207 événements et
693 k€ pour 89 clients.

### Fidélité

**438 clients sur 1 266 ont commandé plus d'une fois (35 %), et ils
représentent 5,43 M€ sur 8,27 M€** — soit 66 % du chiffre d'affaires pour 35 %
des clients.

### Saisonnalité

| Mois | Événements | CA HT |
|---|---|---|
| janvier | 262 | 891 749 € |
| février | 135 | 446 741 € |
| mars | 207 | 593 964 € |
| avril | 165 | 597 427 € |
| mai | 199 | 700 894 € |
| juin | 237 | 633 119 € |
| juillet | 160 | 631 193 € |
| **août** | **85** | 377 560 € |
| septembre | 210 | 713 243 € |
| octobre | 225 | 806 268 € |
| **novembre** | **314** | 979 297 € |
| décembre | 286 | 900 570 € |

Deux pics — novembre-décembre et janvier — et deux creux nets, août et février.

## 3. Limites, énoncées franchement

- **45 % du CA direct reste non classé sectoriellement** (768 clients,
  3,7 M€). Classer à la main les 200 plus gros couvrirait 60 % de ce montant,
  les 300 plus gros 73 %. C'est quelques heures de travail, à faire une fois.
- **Les dates sont des dates de facture, pas des dates d'événement.** L'écart
  est de quelques semaines : la saisonnalité est fiable en tendance, pas au jour
  près. La date réelle figure dans la ligne de titre et pourra être extraite plus
  finement.
- **17 % des événements n'ont aucune animation identifiée** : essentiellement
  des prestations sur mesure et des animations disparues du catalogue.
- **Pour les 619 événements passés par une agence, le client final est
  inconnu.** C'est la principale perte d'information, et elle est irréversible
  sur l'historique.

## 4. Valoriser cette donnée

### 4.1 La réassurance dans les relances — l'idée d'origine

Le mail J+8 peut désormais s'appuyer sur un fait : « nous avons animé 207
événements pour 89 entreprises du secteur bancaire ». Pour une banque qui
hésite sur du Doublage de films, on sait que vingt de ses consœurs l'ont déjà
fait. C'est un argument vérifiable, pas une formule.

À encadrer : ne jamais nommer un client sans son accord, et ne compter que les
clients directs — « nous avons travaillé pour une agence » ne prouve rien au
prospect.

### 4.2 Recommander la bonne animation

À la création d'un devis, quand le secteur du prospect est connu, proposer en
premier ce que son secteur achète réellement. Un prospect du conseil se voit
proposer Home Challenge et Escape Game Visio plutôt que le catalogue par ordre
alphabétique.

### 4.3 Cadrer un prix avec l'historique

Pour une animation et une jauge données, l'historique donne le montant
réellement facturé : médiane, écart, remise moyenne selon le canal. De quoi
défendre un prix face à une demande de geste commercial, et repérer les dérives
tarifaires.

### 4.4 Piloter la saisonnalité

Août et février sont deux creux structurels, novembre et janvier deux pics. Les
creux appellent une offre ciblée sur le portefeuille existant ; les pics
appellent une pré-réservation anticipée et une vérification de la disponibilité
des équipes.

### 4.5 Chiffrer la relance anniversaire

35 % des clients recommandent et pèsent les deux tiers du chiffre d'affaires.
Le délai médian entre deux commandes d'un même client donne la date de relance
optimale — et permet de dresser, chaque mois, la liste nominative des clients à
recontacter, avec le montant qu'ils ont déjà dépensé.

### 4.6 Repérer l'attrition

Un client qui commandait chaque année et n'a rien commandé depuis dix-huit mois
est un client perdu qui s'ignore. La liste est immédiate à produire, et chaque
ligne porte un montant : c'est la file de reconquête, triée par enjeu.

### 4.7 Décider quoi garder au catalogue

L'historique par année montre le cycle de vie de chaque animation : lancement,
pic, déclin. Il dit lesquelles ne se vendent plus — Zapping, Décor Penché, Pilot
Wars — et lesquelles montent. Une décision de catalogue s'appuie alors sur des
volumes, pas sur une impression.

### 4.8 Mesurer ce que rapporte le canal agence

619 événements et 2,47 M€ passent par des agences, souvent à tarif remisé. La
base permet de comparer la valeur vie d'un client direct et celle d'une agence,
et de décider où porter l'effort commercial.

### 4.9 Prévoir la charge

Croiser saisonnalité, secteur et animation donne une prévision de la demande par
mois — donc du besoin en animateurs et en matériel. C'est ce qui rend
exploitable la fonction « charge des équipes » proposée dans `03-idees.md`.

## 5. Ce qu'il faudrait changer pour l'avenir

**Saisir le client final sur les devis passant par une agence.** C'est la seule
information manquante qui ne se rattrapera jamais sur l'historique, et elle
disparaît à chaque nouvel événement tant qu'un champ ne l'accueille pas. Un
champ « client final » sur le devis, et le secteur redevient connu sur 100 % de
l'activité.

Deux compléments utiles au même moment : la **date réelle de l'événement**
comme donnée à part entière, et le **nombre de participants**, aujourd'hui
enfouis dans une ligne de titre en texte libre.
