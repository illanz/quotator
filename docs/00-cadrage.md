# Quotator — cadrage projet

Outil de gestion commerciale MadCityZen (MAD CORP) : catalogue, grille tarifaire, devis,
PDF, envoi client, suivi, puis facturation via facturation.pro.

Ce document est la mémoire du projet : décisions prises, règles métier extraites des
sources, et points encore ouverts. Il est mis à jour à chaque décision.

---

## 1. Décisions prises

| Sujet | Décision |
|---|---|
| Périmètre v1 | Devis de bout en bout, sans intégrations : corpus (catalogue, grille, animateurs, template) → création devis → numérotation → PDF → lien client → email. Pipedrive en étape 2, facturation.pro en étape 3. |
| Maîtrise du devis | L'outil est maître du devis et de sa numérotation. facturation.pro n'intervient qu'à la facture, et garde la numérotation légale des factures. |
| Utilisateurs | Petite équipe commerciale (2-5), avec rôles : admin (grille, catalogue, remises) vs commercial (devis). |
| Stack | Next.js + Postgres managé, hébergement UE. Stockage objet pour les PDF. |
| Grille tarifaire | L'Excel reste la source de vérité. L'outil l'importe et le versionne. |
| Catalogue | ~100 produits FP, dont ~50 vendus régulièrement. Textes complétés au cas par cas → l'outil doit permettre l'édition libre d'une désignation. |

## 2. Sources analysées

- `2026_Tarif_Public_MadCityZen.xlsx` — grille officielle, v. 251215, valable au 01/01/2026.
- `MAD_CORP__Export_Produits.zip` — 102 produits facturation.pro (JSON).
- `devis_zip.rar` — 238 devis JSON (236 lisibles, 2 corrompus à l'extraction).
- `260809_Devis_Madcityzen_YOUSIGNSAS_Anne_200Pax.pdf` — devis de référence pour la mise en page.
- Skill `mcz-devis-workflow` — conventions de titre, table des animateurs, nommage des PDF.

## 3. Ce que dit le corpus

### 3.1 Volume et cycle

- **236 devis du 17/04/2026 au 12/08/2026**, soit ~60/mois.
- Numéros (`quote_ref`) **19565 → 19802** : compteur global continu, sans remise à zéro annuelle.
- Validité : **30 jours** (`term_on` = `invoiced_on` + 30j), confirmé par le PDF.
- Statuts observés : 209 à `quote_status=0`, 27 à `1`. 21 devis `fully_invoiced`.
- Montants HT : min 890 €, médiane 2 987 €, max 14 050 €.
- 207 clients distincts sur 236 devis → activité très majoritairement en nouveaux comptes.
- Langue : 100 % `fr` sur la période (les devis EN existent mais sont rares).

### 3.2 Structure d'un devis

Les lignes portent un `style` qui pilote le rendu :

| `style` | Rôle | Occurrences |
|---|---|---|
| `title` | Ligne de titre de l'événement, TVA 0, PU 0, qté 0 | 225 |
| `null` | Ligne normale (animation, option, remise, frais) | 587 |
| `new_page` | Saut de page, ligne vide | 45 |

- **3,6 lignes par devis en moyenne** (max 12).
- Lignes payantes par devis : 1 → 72 devis, 2 → 100, 3 → 34, 4 → 10, 5 → 7, 6 → 2.
- **63 devis (27 %) comportent au moins une ligne optionnelle**, 161 lignes optionnelles au total.

**Motif multi-animations** (confirmé sur le devis 19584) : la 1re animation est ferme, chaque
animation suivante est précédée d'un `new_page` et marquée `optional` — elle et sa ligne de
remise. Les lignes optionnelles sont **exclues du total** : le devis 19584 affiche 2 961 € HT
(3 290 − 329) alors qu'il présente 4 animations. C'est délibéré : ne pas effrayer un client qui
parcourt le devis en quelques secondes.

### 3.3 Remises

Contrairement à ce qu'on pourrait croire, la remise n'est pas marginale :
**97 devis sur 236 (41 %) en comportent une.**

- Taux observés : **10 % (100 lignes)**, 15 % (2), 100 % (2).
- Le champ `rebate_percentage` de facturation.pro est **toujours à 0** : la remise est saisie
  comme une **ligne négative** dédiée (produit `A_REMISE`, PU = −10 % du PU de la ligne
  précédente), juste après la ligne qu'elle remise.
- Une remise sur une animation optionnelle est elle-même marquée `optional`.
- Mention parfois portée dans la ligne de titre : « Remise 10% incluse, réservée aux agences ».

→ Le moteur doit gérer la remise **au niveau de la ligne**, pas du devis, et la matérialiser en
ligne négative visible pour rester fidèle au rendu actuel.

### 3.4 Catalogue produits

102 produits, dont des **produits utilitaires** qui ne sont pas des animations :

| Ref | Usage |
|---|---|
| `TITRE` (29428) | Ligne de titre, placeholder `Animations XXXXXX / XXXXX 2026 / xxx Pax / Paris / Vacation XX` |
| `A_REMISE` (411991) | Remise commerciale de 10 % |
| `VHR - FRAIS DEPLACEMENT` (28824) | Frais de déplacement à définir |
| `Frais déplacement Train` (406133) | Forfait Paris > X > Paris, X staff |
| `Stationnement Paris` (410604) | 80 € HT, véhicule utilitaire 5-6 h |
| `Option Photo & Vidéo` (409115) | Reportage photo / captation |

Points structurants :

- Les désignations contiennent du **HTML** (`<b>`, `<u>`, `<i>`, `<font size="12">`) et des
  **retours chariot `\r\n`**. Le générateur PDF doit rendre ce balisage.
- Elles contiennent des **placeholders à remplacer** : `XX participants`, `Base XX pax`,
  `Quiz XXX`, `Paris > X > Paris - X staff`.
- Le `unit_price` du catalogue est **à 0 pour 60 % des produits** et faux pour les autres :
  confirmation que la grille Excel est la seule source de prix.
- Doublons / variantes à arbitrer : `MAD GAMES` et `OBJECTIF TOTEM` (même animation, même prix),
  `Fresque Libre Accès` vs `FRESQUE CLASSIQUE`, `Test Rédact Mini U` (produit de test à purger).

### 3.5 Grille tarifaire

- 10 paliers : 1-9 / 10-19 / 20-29 / 30-49 / 50-79 / 80-119 / 120-159 / 160-199 / 200-239 / 240+.
- ~40 animations à prix par palier, **~25 en tarif forfaitaire décrit en texte libre** dans la
  cellule (ex. « 1 590 € + prix des goodies. Capacité 12 participants en simultané. Artiste supp
  = + 800 € »). Ces cellules ne sont pas parsables mécaniquement : elles seront importées comme
  **règle textuelle** à afficher au commercial au moment du choix, avec saisie manuelle du prix.
- Valeurs spéciales à gérer : `Nous consulter`, `sur demande`, `-`, `x`, cellule vide.
- Colonne 240+ = « Nous consulter » quasi systématiquement.

**Règles de bas de grille** (lignes 68-79) :

- Frais de déplacement inclus en Île-de-France, hors stationnement Paris intra-muros.
- Option captation vidéo pro + 800 € / reportage photo pro + 500 €, limitée à la durée de l'activité.
- Toutes les animations disponibles en français ou en anglais **sans surcoût**.
- **Week-end et jours fériés majorés de 10 %.**
- Repas staff à prévoir.
- Libre accès : démarrage dans la foulée du montage. Montage veille + 600 €, montage 4 h à
  l'avance + 400 €.
- **Province** : tarif animation identique, mais supplément immobilisation **250 € HT/staff/8 h
  ouvrées**, transport **1 € HT/km départ et retour Courbevoie (92)**, restauration **25 € HT/repas/
  staff**, hébergement **150 € HT/nuitée/staff**.

### 3.6 Mise en page du devis (PDF de référence)

- En-tête : logo, `MAD CORP — 14, Avenue de l'Opéra — 75001 PARIS`, `DEVIS N° <ref>`, date.
- Colonnes : Désignation | % TVA | PU HT | Qté | Total HT.
- Pied de page légal : `MAD CORP - SARL au capital de 10000 € - 509675088 RCS Paris -
  N° TVA : FR17509675088 - APE : 8230Z - Web : www.madcityzen.fr - Email : info@madcityzen.fr -
  Tél : 01 84 20 40 20 - Fax : 01 84 16 60 22`.
- Totaux : Total HT / TVA 20,0 % / TOTAL TTC.
- Mentions : validité, date limite de règlement à réception, pénalités (taux BCE + 10 points),
  indemnité forfaitaire 40 €, escompte aucun.
- Mention créneaux d'installation/démontage et restauration de l'équipe.
- **Acompte 70 % du TTC à l'acceptation**, prestation confirmée à réception de l'acompte.
- Coordonnées bancaires Crédit Agricole (IBAN/BIC).
- Pagination `Page n/N`, en-tête et pied répétés sur chaque page.

### 3.7 Page publique du devis (maquette fournie)

Le client doit disposer d'un panneau d'actions clair, sur le modèle transmis :

- **La proposition correspond** → `Continuer vers la réservation` (action principale, mise en avant).
- **La proposition pourrait correspondre** → `Demander une modification (quantité/tarif)`.
- **La proposition ne correspond pas** → `Décliner la proposition` / `Modifier ou annuler ma demande`.
- **Besoin de plus d'informations** → `Contacter l'établissement`, avec nom et téléphone du
  commercial en charge.
- Accès à l'`Historique` des échanges.

Chaque action doit notifier le commercial et tracer un événement sur le devis.

---

## 4. Points à trancher

### 4.1 Contradictions entre sources — bloquant

| Sujet | Source A | Source B | À trancher |
|---|---|---|---|
| Majoration week-end | Illan : **+15 %** | Grille (ligne 71) : **+10 %** | Quel taux fait foi ? |
| Départ des frais km | Illan : **75001** | Grille (ligne 76) : **Courbevoie (92)** ; PDF YOUSIGN : **Paris 1er** | Quel point de départ ? |
| Périmètre inclus | Grille : **toute l'Île-de-France** | PDF : **Paris + 75/92/93/94** | Petite couronne ou IdF entière ? |

### 4.2 Questions ouvertes

1. **Numérotation** : continuer la série FP (19803…) ou repartir sur un format annuel ?
2. **Import de la grille** : bouton d'import manuel avec écran de validation des écarts, ou
   synchro Dropbox automatique ?
3. **Envoi email** : service dédié (`devis@madcityzen.fr`, SPF/DKIM à poser sur le DNS OVH) ou
   génération d'un brouillon Outlook pour rester dans le fil existant ?
4. **Frais de province** : calculés automatiquement (staff × 8 h + repas + nuitées + km) ou
   saisis à la main comme aujourd'hui (cf. devis 13823420 : « Trajet Paris > Lyon > Paris »,
   forfait 300 €) ?
5. **Km** : saisie manuelle du kilométrage, ou calcul automatique depuis la ville ?
6. **Remise agence** : attribut permanent du client (case « agence/revendeur » sur la fiche) ou
   décision ponctuelle à chaque devis ?
7. **Statuts et relances** : quel cycle de vie, quelle cadence de relance automatique ?
8. **Versions** : gérer une V2 d'un devis modifié, ou écraser ?
9. **Historique** : reprendre les 238 devis et les clients existants, ou démarrer à vide ?
10. **Dropbox** : conserver la copie automatique des PDF dans `Commercial\Clients\Active\<Client>\` ?
11. **Domaine** et accès DNS.
12. **Logo** : fichier vectoriel (SVG/AI) ou PNG haute définition à fournir.
