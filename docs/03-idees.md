# Fonctions à considérer

Propositions issues des pratiques CRM et commerce B2B, filtrées par ce que
montrent les données MadCityZen. Rien ici n'est décidé : c'est une liste à
arbitrer, classée par rapport entre l'effort et ce qu'elle rapporte.

Trois chiffres servent de boussole :

- **60 devis par mois**, dont **11,4 % acceptés** — soit une cinquantaine de
  devis mensuels qui ne se concrétisent pas, et autant de temps commercial.
- **88 % des devis partent vers un client qui n'a jamais commandé**, alors que
  **1 267 clients ont déjà été facturés** au moins une fois.
- **41 % des devis portent une remise**, presque toujours de 10 % et destinée
  aux agences.

---

## 1. À faire tôt — effort faible, effet immédiat

### 1.1 Dupliquer un devis

La fonction la plus utilisée de tout outil de devis, et la plus simple. Avec
3,6 lignes en moyenne et un catalogue de cinquante animations récurrentes, la
plupart des devis ressemblent à un devis déjà émis. Dupliquer puis ajuster le
client, la date et le palier prend trente secondes là où la ressaisie en prend
dix minutes.

### 1.2 Modèles de devis par animation

Un modèle par animation courante : titre pré-formaté, désignation complète,
options habituelles, durée standard. Le commercial choisit l'animation et le
palier, tout le reste est déjà écrit. C'est ce qui transforme la création d'un
devis en une opération de trente secondes.

### 1.3 Bibliothèque de paragraphes réutilisables

Les descriptions sont aujourd'hui complétées au cas par cas. Une bibliothèque de
blocs — conditions particulières, contraintes techniques, mentions selon le
lieu — évite de les réécrire et garantit qu'ils sont formulés correctement.

### 1.4 Motifs de perte structurés

Déjà proposé dans `01-conversion.md`, mais il faut insister : c'est la donnée
qui manque le plus. Sans elle, on ignore pourquoi 89 % des devis échouent, et
tout effort d'amélioration se fait à l'aveugle. Quelques cases à cocher au
moment où le devis est déclaré perdu suffisent.

### 1.5 Prochaine action obligatoire

Règle d'or du CRM B2B : toute affaire ouverte porte une prochaine action datée.
Une affaire sans prochaine action est une affaire qui meurt en silence. L'outil
peut l'imposer à la création et alerter quand une affaire reste sans action.

---

## 2. Spécifique au métier — c'est là que se trouve la vraie différence

### 2.1 Charge des équipes et disponibilité

MadCityZen ne vend pas un logiciel dupliquable à l'infini : chaque animation
mobilise des animateurs, du matériel et un véhicule. C'est une activité de
stock, et aucun des outils actuels ne le sait.

Un calendrier de charge qui répond à « combien d'équipes Batucada sont déjà
engagées le 12 décembre ? » sert trois fois :

- il évite de vendre une date qui ne peut pas être tenue ;
- il alimente honnêtement l'argument de relance sur la disponibilité ;
- il révèle les creux de calendrier, sur lesquels une offre ciblée peut être
  poussée.

La table du nombre d'animateurs par animation et par palier existe déjà dans
Notion : elle donne directement le besoin en personnel de chaque devis.

### 2.2 Pré-réservation de date avec expiration

Bloquer la date sans engagement pendant sept jours crée une échéance réelle,
plutôt qu'une pression commerciale artificielle. C'est ce qui remplace
avantageusement la relance insistante, et cela répond à l'objection de l'acompte
de 70 %.

### 2.3 Marge par devis

Le prix de vente est connu, le coût ne l'est pas. En saisissant le coût des
animateurs, du matériel et du déplacement, l'outil affiche la marge de chaque
devis — et permet enfin de savoir si la remise de 10 % accordée aux agences est
rentable, animation par animation. Un CRM B2B mature pilote la marge, pas le
chiffre d'affaires.

C'est aussi la seule façon de répondre à « faut-il continuer à proposer telle
animation ? ».

---

## 3. Faire vivre le portefeuille existant

### 3.1 Relance anniversaire

1 267 clients ont déjà commandé, et l'événementiel d'entreprise est saisonnier :
un séminaire de décembre revient en décembre. Une relance automatique à onze
mois sur les clients gagnés est, en B2B événementiel, le meilleur rapport entre
effort et chiffre d'affaires — bien meilleur que la conquête, où part
aujourd'hui l'essentiel de l'énergie.

### 3.2 Comptes structurés et rôles

Dans une vente B2B, plusieurs personnes interviennent : celle qui demande, celle
qui décide, celle qui paie. C'est particulièrement vrai avec les agences, qui
commandent pour un client final. Noter le rôle de chaque contact évite de
relancer la mauvaise personne.

### 3.3 Suivre le canal « agence » pour lui-même

41 % des devis portent la remise agence : ce n'est pas un cas particulier, c'est
un canal de distribution. Le mesurer comme tel — volume, taux de transformation,
marge après remise, agences les plus productives — permet de décider où investir
et de justifier la remise, ou de la revoir.

---

## 4. Après la vente

### 4.1 Fiche de production

Une fois le devis accepté, l'événement devient un dossier de production :
horaires d'installation, contact sur place, matériel, équipe affectée,
restauration. Le mail de confirmation promet déjà un chef de projet sous 48 h —
autant lui donner le dossier tout prêt, alimenté par le devis.

### 4.2 Retour après l'événement

Une question envoyée trois jours après l'animation : « la recommanderiez-vous ? »
Cela alimente les références clients utiles à la relance (voir `01-conversion.md`,
levier « réassurance »), et signale les insatisfactions avant qu'elles ne
circulent.

---

## 5. Cadre et conformité

### 5.1 Politique de conservation des données

7 551 fiches, dont 83 % jamais facturées, certaines créées il y a plus de dix
ans. Le RGPD demande une durée de conservation définie pour des données de
prospection. Une règle simple — purge ou anonymisation des prospects sans
activité depuis N années — vaut mieux qu'une base qui grossit indéfiniment.

### 5.2 Facturation électronique

La France généralise la facturation électronique entre entreprises, avec
transmission via des plateformes agréées. L'échéance concerne toutes les
entreprises assujetties à la TVA, MadCityZen comprise. **À vérifier avec
l'expert-comptable et avec facturation.pro** : c'est facturation.pro qui devra
être raccordé à une plateforme agréée, et il faut confirmer le calendrier
applicable plutôt que de s'y fier de mémoire. Cela conforte la décision de
laisser la facture chez facturation.pro plutôt que de la reprendre dans l'outil.

### 5.3 Journal d'audit

Déjà prévu au modèle de données. À conserver : savoir qui a modifié un prix et
quand est ce qui permet d'expliquer un devis contesté.

---

## Ce que je ferais, dans l'ordre

1. **Dupliquer un devis** et **modèles par animation** — le gain de temps
   quotidien le plus direct, pour un effort faible.
2. **Motifs de perte** — sans cette donnée, toute la suite se pilote à l'aveugle.
3. **Relance anniversaire** sur les 1 267 clients déjà facturés — le portefeuille
   dormant est l'actif le plus sous-exploité.
4. **Charge des équipes** — ce qu'aucun outil du marché ne fera à la place de
   MadCityZen, et ce qui protège de la survente.
5. **Marge par devis** — pour piloter autre chose que le chiffre d'affaires.

Le reste peut attendre d'avoir vécu quelques mois avec l'outil.
