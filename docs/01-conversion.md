# Conversion : cycle de vie, relances et copy

Proposition de dispositif pour maximiser le taux de transformation des devis.
À valider et à ajuster — le copy est rédigé pour être utilisé tel quel.

## 1. Point de départ mesuré

Sur les 236 devis d'avril à août 2026 : **27 acceptés (11,4 %)**, dont 21 facturés (8,9 %).
Ce chiffre est un plancher — une partie des devis récents est encore en cours de décision — mais
il fixe la référence à battre. L'outil doit rendre ce taux mesurable en continu, par animation,
par palier de participants, par présence ou non de remise, et par délai de réponse.

Deux constats du corpus orientent tout le dispositif :

- **Le devis est le premier contact commercial dans 88 % des cas** (207 clients distincts pour
  236 devis) : le mail d'accompagnement ne s'adresse presque jamais à un habitué. Il doit porter
  seul la crédibilité de MadCityZen.
- **73 % des devis ne présentent qu'une animation ferme sans alternative optionnelle.** Or les
  devis qui en proposent donnent au client une décision « laquelle ? » plutôt que « oui ou non ? ».
  C'est le levier le plus immédiat.

## 2. Cycle de vie du devis

| Statut | Déclencheur | Effet |
|---|---|---|
| `brouillon` | Création | Modifiable librement, pas de numéro attribué |
| `envoyé` | Envoi du mail | Numéro attribué, PDF figé, séquence de relance armée |
| `vu` | Première ouverture du lien public | Notification au commercial, adaptation de la relance |
| `en_discussion` | Le client demande une modification | Relances suspendues, tâche créée pour le commercial |
| `accepté` | Clic « Continuer vers la réservation » | Horodatage, nom et fonction du signataire, IP. Déclenche la facture d'acompte |
| `refusé` | Clic « Décliner » | Motif capturé (voir 4.3), relances arrêtées |
| `expiré` | Date de validité dépassée sans action | Passage automatique, mail de clôture |
| `annulé` | Action interne | Sortie des statistiques |

Le passage en `accepté` ne bloque pas le devis : une V2 reste possible (les versions antérieures
sont conservées), auquel cas le devis repasse en `envoyé` avec un nouveau cycle.

## 3. Séquence de relance

Calée sur la validité de 30 jours. Chaque relance s'arrête dès que le client agit (réponse mail,
clic sur une action de la page, acceptation, refus) ou dès que le commercial reprend la main.

| Moment | Condition | Objet du message |
|---|---|---|
| **T0** | Envoi | Le devis |
| **J+2** | Non ouvert | Vérification que le lien est bien arrivé |
| **J+4** | Ouvert, sans action | Proposition de répondre aux questions |
| **J+8** | Toujours sans action | Apport de valeur : cas comparable, réponse à l'objection la plus fréquente |
| **J+15** | Toujours sans action | Disponibilité de la date |
| **J+25** | Toujours sans action | Dernière relance avant expiration (J-5) |
| **J+31** | Expiré | Clôture ouverte, porte laissée ouverte |
| **J+90** | Expiré sans reprise | Réactivation saisonnière (optionnelle, à activer par le commercial) |

Trois principes :

1. **Jamais plus d'un mail non lu en attente.** Si la relance J+4 n'est pas ouverte, J+8 est
   décalée plutôt qu'empilée.
2. **Chaque relance apporte quelque chose de neuf** — une information, une réponse, une échéance.
   Aucune ne se contente de « je me permets de revenir vers vous ».
3. **Le prix n'apparaît jamais dans le corps d'un mail**, conformément à la règle en vigueur. Il
   reste sur le PDF et la page du devis.

## 4. Leviers sur la page publique

### 4.1 Options interactives

Le client coche et décoche les animations optionnelles, le total se recalcule sous ses yeux.
Cela transforme la lecture passive d'un PDF en projection active, et exploite le motif déjà en
place dans les devis actuels — où les options sont exclues du total pour ne pas effrayer.

### 4.2 Réassurance immédiate

- Photos et vidéos de l'animation intégrées directement dans la page, sans lien sortant
  (aujourd'hui, le client doit ouvrir un lien Notion externe pour se projeter).
- Nom, photo et téléphone direct du commercial, comme sur la maquette fournie.
- Mentions déjà présentes sur le devis mais peu visibles : assurance RC organisateur incluse,
  matériel et encadrement inclus.
- Références clients comparables (secteur ou taille d'équipe similaire).

### 4.3 Capture de l'objection

« Demander une modification » et « Décliner » ouvrent un formulaire court avec des motifs
pré-cochés : budget, date indisponible, nombre de participants différent, autre animation
souhaitée, projet reporté, choix d'un concurrent, autre. C'est la donnée qui manque aujourd'hui
complètement : sans elle, on ne sait pas pourquoi 89 % des devis ne se concrétisent pas.

### 4.4 Réservation de date sans engagement

Levier à arbitrer : proposer au client de bloquer gratuitement la date pendant 7 jours, sans
acompte. Cela crée une échéance réelle plutôt qu'une pression commerciale artificielle, et cela
répond à l'objection principale d'un acompte de 70 % du TTC — élevé pour une première commande.
Alternative à considérer : abaisser l'acompte à 30-40 % pour les nouveaux clients, le solde à
J-7 de l'événement.

## 5. Copy des mails

Variables : `{{prenom}}`, `{{societe}}`, `{{animation}}`, `{{date_event}}`, `{{pax}}`, `{{ville}}`,
`{{lien_devis}}`, `{{numero_devis}}`, `{{date_validite}}`, `{{commercial}}`, `{{tel_commercial}}`.

Les blocs entre crochets sont à personnaliser par le commercial ou à générer à partir du contexte
du lead : ils font la différence entre un envoi générique et une proposition qui se projette dans
le projet du client.

---

### 5.1 T0 — Envoi du devis

**Objet** : `Votre devis {{animation}} par MadCityZen`

```
Bonjour {{prenom}},

Merci pour votre demande. Voici notre proposition pour votre événement du
{{date_event}} à {{ville}}.

[1 à 2 phrases reliant le déroulé de l'animation au besoin exprimé : objectif de
l'événement, profil des participants, contrainte de lieu ou de durée.]

Le détail figure dans le devis joint, sur une base de {{pax}} participants.

Vous pouvez le consulter en ligne, ajuster les options qui vous intéressent et
nous donner votre accord directement ici :
{{lien_devis}}

Ce devis est valable jusqu'au {{date_validite}}.

Une question sur le déroulé, le matériel ou la logistique ? Répondez simplement à
ce message, ou appelez-moi au {{tel_commercial}}.

Bien à vous,
{{commercial}}
```

Pièces jointes : le devis PDF et la fiche descriptive de chaque animation proposée.

---

### 5.2 J+2 — Non ouvert

**Objet** : `Votre devis {{numero_devis}} vous est bien parvenu ?`

```
Bonjour {{prenom}},

Je m'assure simplement que notre proposition pour le {{date_event}} vous est bien
arrivée — les pièces jointes se perdent parfois dans les filtres.

Vous pouvez la consulter directement en ligne : {{lien_devis}}

Bien à vous,
{{commercial}}
```

---

### 5.3 J+4 — Ouvert, sans action

**Objet** : `Des questions sur votre animation {{animation}} ?`

```
Bonjour {{prenom}},

Vous avez pu parcourir notre proposition — je reste à votre disposition si un point
mérite d'être précisé : déroulé, matériel, adaptation au lieu, ou ajustement du
nombre de participants.

Si vous préférez en parler de vive voix, dites-moi simplement quel créneau vous
arrange cette semaine.

{{lien_devis}}

Bien à vous,
{{commercial}}
```

---

### 5.4 J+8 — Apport de valeur

**Objet** : `{{animation}} : comment ça se passe concrètement`

```
Bonjour {{prenom}},

Je reviens vers vous avec un élément qui aide souvent à se décider : [cas concret
d'un événement comparable — secteur, taille d'équipe, contexte — et ce qu'il en est
ressorti].

[Ou, à défaut : réponse à l'objection la plus fréquente sur cette animation — espace
nécessaire, contraintes techniques, adaptation aux participants peu à l'aise.]

Si le projet a évolué de votre côté (date, nombre de participants, budget), nous
pouvons ajuster la proposition très rapidement.

{{lien_devis}}

Bien à vous,
{{commercial}}
```

---

### 5.5 J+15 — Disponibilité de la date

**Objet** : `Votre date du {{date_event}} — point de disponibilité`

```
Bonjour {{prenom}},

Un mot sur le calendrier : nos équipes d'animation se réservent au fur et à mesure,
et la période autour du {{date_event}} commence à se remplir.

Si votre projet se confirme, le plus simple est de nous le dire dès maintenant :
nous bloquons vos animateurs, sans que cela vous engage définitivement.

{{lien_devis}}

Et si la date a bougé, dites-le moi, je regarde ce qui reste ouvert.

Bien à vous,
{{commercial}}
```

---

### 5.6 J+25 — Dernière relance

**Objet** : `Votre devis {{numero_devis}} expire le {{date_validite}}`

```
Bonjour {{prenom}},

Votre devis arrive à échéance le {{date_validite}}. Passé cette date, les tarifs
devront être revus en fonction de nos disponibilités.

S'il vous manque un élément pour décider, dites-le moi — un appel de cinq minutes
suffit généralement.

{{lien_devis}}

Bien à vous,
{{commercial}}
```

---

### 5.7 J+31 — Clôture

**Objet** : `On garde votre projet de côté`

```
Bonjour {{prenom}},

Sans retour de votre part, je clôture ce devis — sans aucun souci.

Votre projet reste dans nos dossiers : si l'occasion revient, un message suffit et
je vous refais une proposition à jour, sans repartir de zéro.

Et si vous avez retenu une autre solution, je serais sincèrement curieux de savoir
ce qui a fait la différence : cela nous aide à progresser.

Bien à vous,
{{commercial}}
```

---

### 5.8 Accusé de réception d'une demande de modification

**Objet** : `Votre demande sur le devis {{numero_devis}}`

```
Bonjour {{prenom}},

J'ai bien reçu votre demande d'ajustement. Je reviens vers vous avec une proposition
mise à jour [aujourd'hui / demain matin].

Bien à vous,
{{commercial}}
```

---

### 5.9 Confirmation d'acceptation

**Objet** : `C'est confirmé — votre animation du {{date_event}}`

```
Bonjour {{prenom}},

Merci pour votre confiance : votre animation {{animation}} du {{date_event}} à
{{ville}} est enregistrée.

La suite :
1. Vous recevez la facture d'acompte dans les minutes qui viennent. La prestation est
   confirmée dès sa réception.
2. Votre chef de projet vous contacte sous 48 h pour caler le déroulé, les horaires
   d'installation et les détails pratiques.

D'ici là, n'hésitez pas si une question vous vient : {{tel_commercial}}.

À très vite,
{{commercial}}
```

## 6. Ce qu'il faut mesurer

Tableau de bord minimum, dès la v1 :

- Taux d'acceptation global et par animation, par palier, avec et sans remise.
- Délai médian entre envoi et acceptation — il détermine le bon calage des relances.
- Taux d'ouverture du lien, et taux d'acceptation des devis ouverts vs non ouverts.
- Effet des options : taux d'acceptation des devis à une seule animation contre ceux qui en
  proposent plusieurs.
- Motifs de refus, par fréquence.
- Rang de la relance qui a déclenché l'acceptation, pour couper les relances inutiles.
