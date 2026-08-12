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
interrogé pour la plupart d'entre eux.

Le classement combine trois sources, par ordre de fiabilité décroissante.

**1. La mention de tarif agence, portée par la facturation elle-même.** Les
devis vendus à un intermédiaire portent « Remise 10 % incluse, réservée aux
agences » ou « Tarification Agences ». C'est une preuve, pas une interprétation :
elle identifie **358 clients, 49 % du chiffre d'affaires**. Sans elle, la moitié
de l'activité serait mal attribuée, car les agences événementielles françaises —
Sagarmatha, Auditoire, Epoka, Roadbook, Oh Yes, 3P1C — portent des noms qui ne
disent rien de leur métier.

**2. Un dictionnaire d'enseignes reconnues.** Aucune règle ne devinera qu'Ubisoft
fait du jeu vidéo ou que Chateauform' est un lieu partenaire. Ces noms sont donc
listés explicitement. Le dictionnaire n'accueille que ce qui est su, jamais ce
qui est supposé : les noms opaques — SWAN, JAM, HELP, OZONEX — en sont absents,
même quand le contexte suggère une agence.

**3. Des règles de mots-clés** sur la raison sociale, pour les cas évidents
(« MAIRIE DE », « BANQUE », « PHARMA », « AGENCE »).

Une catégorie **Lieu partenaire** complète le dispositif : Chateauform', le
Pavillon d'Armenonville et le Chalet du Lac apportent de l'affaire comme les
agences, et leur secteur ne dit rien du client final.

## 2. Ce que la donnée dit

### Répartition

| | Clients | Événements | CA HT | Part |
|---|---|---|---|---|
| Intermédiaires (agences, lieux) | 358 | 1 062 | 4 032 208 € | 49 % |
| Clients directs classés | 406 | 775 | 2 729 679 € | 33 % |
| Clients directs non classés | 502 | 648 | 1 510 138 € | 18 % |

**La moitié de l'activité passe par des intermédiaires.** C'est le fait le plus
structurant de l'historique, et il était invisible avant cette reconstruction.

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

Clients directs uniquement — les intermédiaires en sont exclus.

| Secteur | Clients | Événements | CA HT |
|---|---|---|---|
| Banque, assurance, finance | 93 | 222 | 753 516 € |
| Tech, numérique, télécom | 57 | 106 | 380 423 € |
| Industrie, énergie | 41 | 79 | 379 636 € |
| Conseil, audit, juridique | 38 | 83 | 279 330 € |
| Distribution, grande conso | 19 | 34 | 152 370 € |
| Secteur public, collectivité | 23 | 33 | 138 691 € |
| Santé, pharmacie | 27 | 45 | 127 466 € |
| Éducation, formation | 16 | 30 | 104 999 € |
| Transport, logistique | 19 | 29 | 98 800 € |

Et ce qu'il achète — la table qui alimente l'argument de réassurance dans les
relances :

| Secteur | Top 3 |
|---|---|
| Banque, assurance, finance | Doublage (20), Home Cooking (19), Mini U (13) |
| Tech, numérique, télécom | Mad Burger (9), Quiz Race (9), Escape Game Visio (7) |
| Conseil, audit, juridique | Home Challenge (11), Escape Game Visio (10), Graffiti (7) |
| Industrie, énergie | Mini U (8), Fresque (3), Réalité virtuelle (3) |
| Immobilier, construction | Mini U (5), Réalité virtuelle (5), Team Haka (4) |

La banque et l'assurance sont, de loin, le premier secteur : 222 événements et
754 k€ pour 93 clients — le double du suivant.

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

- **18 % du chiffre d'affaires reste non classé** (502 clients, 1,51 M€), contre
  47 % avant l'affinage. Le reliquat est une vraie longue traîne : les 100 plus
  gros ne pèsent que 8 % du CA total, les 200 plus gros 12 %. Trois voies pour le
  réduire, décrites au § 6.
- **Les dates sont des dates de facture, pas des dates d'événement.** L'écart
  est de quelques semaines : la saisonnalité est fiable en tendance, pas au jour
  près. La date réelle figure dans la ligne de titre et pourra être extraite plus
  finement.
- **17 % des événements n'ont aucune animation identifiée** : essentiellement
  des prestations sur mesure et des animations disparues du catalogue.
- **Pour les 1 062 événements passés par un intermédiaire — la moitié de
  l'activité — le client final est inconnu.** C'est la principale perte
  d'information, et elle est irréversible sur l'historique.

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

1 062 événements et 4,03 M€ passent par des intermédiaires, souvent à tarif
remisé — la moitié de l'activité. La
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

## 6. Réduire encore le « non classé »

Le reliquat représente 502 clients et 1,51 M€. Trois leviers, du plus durable au
plus artisanal.

### 6.1 Interroger l'annuaire des entreprises — la vraie solution

L'API publique de recherche d'entreprises accepte une **raison sociale**, pas
seulement un SIRET, et renvoie le code APE officiel. Une table de correspondance
APE → secteur classerait automatiquement la majorité des 502 clients restants,
sans supposition et avec une source faisant autorité.

Cette API n'est pas joignable depuis l'environnement de développement utilisé ici
— le réseau y est restreint — mais elle le sera depuis l'application. C'est à
prévoir au moment de la migration des clients (`02-migration-clients.md`), qui
prévoit déjà un enrichissement par SIRET : les deux se font en un seul passage.

Effet attendu : le classement devient une donnée officielle, mise à jour, et
non plus une heuristique.

### 6.2 Un écran de classement manuel

Il restera toujours des cas — sociétés dissoutes, noms tronqués, filiales
étrangères. Un écran listant les clients à classer par chiffre d'affaires
décroissant, avec le secteur proposé et les animations déjà vendues comme
contexte, permet d'en traiter beaucoup en peu de temps. Chaque décision est
enregistrée, marquée comme manuelle, et ne sera plus jamais écrasée par le
classement automatique.

### 6.3 Saisir le secteur à la création du client

Pour l'avenir, le problème ne doit pas se reposer : le secteur devient un champ
de la fiche client, proposé automatiquement et confirmé par le commercial au
premier devis. Le coût est de trois secondes, une fois par client.
