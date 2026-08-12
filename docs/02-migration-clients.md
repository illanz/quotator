# Migration de la base clients

Analyse de l'export `MAD_CORP__Export_Clients.zip` (7 551 fiches JSON) et plan de reprise.

## 1. État des lieux

**7 551 fiches, aucune supprimée logiquement, créées de 2012 à 2026.** Le rythme de création
culmine en 2021 (910/an) et retombe à 416 en 2025.

### 1.1 La base est très majoritairement composée de prospects, pas de clients

| Segment | Volume | Part |
|---|---|---|
| Facturés au moins une fois | 1 267 | 17 % |
| Jamais facturés | 6 284 | 83 % |
| Créés en 2025-2026 | 617 | 8 % |
| **Périmètre utile** (facturés ∪ récents) | **1 803** | **24 %** |

Autrement dit : trois quarts de la base sont des fiches créées pour un devis qui n'a jamais
abouti, et dont la dernière activité remonte à plusieurs années. Les migrer telles quelles
reviendrait à importer le problème dans le nouvel outil.

### 1.2 Qualité des données

Sur l'ensemble de la base :

| Champ manquant | Volume | Part |
|---|---|---|
| Email | 6 228 | 82 % |
| SIRET | 7 178 | 95 % |
| N° TVA | 7 508 | 99 % |
| Adresse | 6 166 | 82 % |
| Téléphone et mobile | 6 389 | 85 % |

La qualité remonte nettement sur les clients réellement facturés : **4 % seulement sont sans
adresse**, contre 82 % sur l'ensemble. L'email reste manquant pour 64 % d'entre eux, et le SIRET
pour 90 % — ce dernier est de toute façon récupérable automatiquement via l'annuaire des
entreprises, comme le fait déjà facturation.pro.

34 fiches ont un nom vide ou réduit à moins de trois caractères.

Le champ `account_code` (`411AGENCE…`, `411GROUPE…`) est dérivé mécaniquement du nom de la
société : ce n'est pas un marqueur de segment exploitable pour identifier les agences.

### 1.3 Doublons

Sur le nom normalisé (majuscules, accents et formes juridiques retirés) :

- **322 groupes de doublons, couvrant 717 fiches** sur l'ensemble de la base.
- **64 groupes, 156 fiches** si l'on se limite au périmètre utile.
- 7 groupes partagent un même SIRET, 21 un même email.

Cas les plus lourds : BNP Paribas (12 fiches), Meeting Contact (6), Société Générale (5),
Orange (5), AXA (4), Decathlon (4), RATP (4).

Deux motifs distincts se cachent derrière ces doublons, et ils n'appellent pas le même traitement :

- **De vraies redondances** : `BNP PARIBAS`, `BNP PARIBAS SA`, `BNPPARIBAS SA` au même code
  postal — à fusionner.
- **Des établissements distincts d'un même groupe** : `SOCIETE GENERALE` à 94120, 67000 et 75886
  sont trois entités réelles. Les fusionner ferait perdre de l'information.

D'où la structure retenue ci-dessous.

## 2. Modèle cible

Le nouveau modèle sépare ce que facturation.pro mélange dans une fiche unique :

- **Organisation** — la société (nom, SIRET, TVA, type : client direct / agence / revendeur /
  collectivité), avec une organisation mère optionnelle pour rattacher les établissements d'un
  même groupe.
- **Établissement** — l'adresse de facturation, rattachée à une organisation. C'est ce qui permet
  de garder les trois Société Générale sans les confondre.
- **Contact** — la personne (nom, email, téléphone, fonction), rattachée à un établissement.
  Aujourd'hui noyée dans les champs `civility` / `first_name` / `last_name` de la fiche client.

## 3. Plan de reprise

### Étape 1 — Import intégral, sans perte

Les 7 551 fiches sont importées avec leur `id` facturation.pro conservé comme référence externe.
Rien n'est supprimé : la traçabilité vers l'historique comptable doit rester intacte.

### Étape 2 — Segmentation automatique

Chaque fiche est marquée :

- `actif` — facturée au moins une fois, ou créée en 2025-2026 (1 803 fiches) ;
- `dormant` — le reste (5 748 fiches), masqué par défaut dans la recherche mais retrouvable.

Le commercial travaille ainsi sur une base de 1 800 fiches pertinentes au lieu de 7 500, sans
qu'aucune donnée ne soit perdue.

### Étape 3 — Dédoublonnage assisté

Le rapprochement automatique s'appuie, par ordre de fiabilité décroissante :

1. SIRET identique → fusion automatique.
2. Email identique → fusion automatique.
3. Nom normalisé **et** code postal identiques → fusion automatique.
4. Nom normalisé identique, code postal différent ou absent → **file de revue manuelle**,
   avec proposition de rattacher les fiches à une organisation mère commune plutôt que de les
   fusionner.

Sur le périmètre actif, cela représente 64 groupes à examiner — quelques heures de travail, pas
plus, et concentrées là où ça compte. Les 258 groupes restants sur les fiches dormantes sont
traités en tâche de fond, ou jamais.

L'écran de revue affiche les fiches côte à côte avec leur historique de facturation, et permet
de choisir la fiche maîtresse champ par champ.

### Étape 4 — Enrichissement

- Récupération automatique du SIRET, de la forme juridique et de l'adresse officielle via
  l'annuaire des entreprises, pour les fiches actives sans SIRET (1 134 fiches).
- Signalement des 34 fiches à nom invalide pour correction manuelle.
- L'email manquant se complète naturellement à l'usage : le premier devis envoyé depuis l'outil
  exige une adresse.

### Étape 5 — Rapport

Un rapport de migration est produit et conservé : volumes importés, fusions automatiques
appliquées, cas envoyés en revue, anomalies. C'est la pièce qui permet de vérifier qu'aucun
client n'a disparu au passage.

## 4. Point d'attention

La reprise des **238 devis** existants n'est utile que pour l'historique et les statistiques :
ils ne pourront pas être régénérés au nouveau format PDF, puisque leurs prix et leurs
désignations sont figés dans l'export. Ils seront importés en lecture seule, rattachés aux
clients dédoublonnés, avec le lien vers le PDF d'origine hébergé chez facturation.pro.
