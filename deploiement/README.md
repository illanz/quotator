# Mise en service

Quotator tourne sur un VPS OVH Debian, derrière Caddy, avec PostgreSQL sur la
même machine. L'ensemble tient sur un VPS à deux cœurs et quatre gigaoctets.

Ce dossier contient de quoi passer d'un serveur nu à l'outil en ligne, et de
quoi le maintenir ensuite sans y penser.

## Ce dont il faut disposer

| Élément | Où |
|---|---|
| VPS Debian 12 ou 13, accès root par SSH | OVHcloud |
| Enregistrement DNS `app.madcityzen.fr` → IP du VPS (type A) | Zone DNS OVH |
| Identifiants SMTP du prestataire d'envoi | Décidé au jalon 2 |

Le domaine doit pointer vers le serveur **avant** la première exécution :
Caddy demande le certificat TLS au démarrage, et la demande échoue si le nom
ne résout pas encore.

## Première mise en service

```bash
# Sur le serveur, en root.
bash preparer-serveur.sh app.madcityzen.fr
```

Le script installe Node 22, PostgreSQL, Caddy, l'utilisateur de service, le
pare-feu et les mises à jour de sécurité automatiques. Il crée la base et
affiche son mot de passe **une seule fois** — le noter à ce moment-là.

Puis :

```bash
git clone https://github.com/illanz/quotator /opt/quotator
cd /opt/quotator
chown -R quotator:quotator /opt/quotator

# Créer /opt/quotator/.env avec les valeurs affichées par le script.
cp deploiement/quotator.service /etc/systemd/system/
cp deploiement/quotator-sauvegarde.service /etc/systemd/system/
cp deploiement/quotator-sauvegarde.timer /etc/systemd/system/
cp deploiement/quotator-cycle.service /etc/systemd/system/
cp deploiement/quotator-cycle.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now quotator quotator-sauvegarde.timer quotator-cycle.timer

bash deploiement/deployer.sh
```

Enfin, créer le premier compte et caler la série de numéros :

```bash
npm run utilisateur -- --email illanz@madcityzen.fr --nom Illan --role ADMIN
npm run serie -- --prochain 19803
npm run banque -- --iban "FR76 …" --bic AGRIFRPP882 \
  --banque "Crédit Agricole d'Île-de-France" --domiciliation "La Garenne-Colombes"
```

La série doit être calée **avant le premier devis émis** : le script refuse
tout recul qui produirait deux devis sous un même numéro.

## Déployer une nouvelle version

```bash
cd /opt/quotator && bash deploiement/deployer.sh
```

Le script sauvegarde la base, récupère la branche, installe, met le schéma à
jour, compile, redémarre, et vérifie que le service a bien repris. Il échoue
bruyamment si ce n'est pas le cas.

## Le cycle quotidien

Chaque matin de semaine à 8 h 12, `quotator-cycle.timer` fait passer les devis
périmés à l'état expiré, puis envoie les relances dues. Il est idempotent : le
rejouer dans la journée n'envoie rien de plus, puisque chaque relance laisse
une trace qui fait avancer la séquence.

Pour voir ce qui partirait sans rien envoyer :

```bash
cd /opt/quotator && npm run cycle -- --blanc
```

L'expiration est **calculée, jamais planifiée** : un serveur arrêté deux jours
ne laisse pas des devis périmés à l'état « envoyé ».

## Sauvegardes

Une sauvegarde par nuit à 3 h 17, quatorze jours conservés, dans
`/var/sauvegardes/quotator`.

**Elles ne quittent pas la machine tant que `DESTINATION_DISTANTE` n'est pas
renseignée.** En l'état elles protègent d'une fausse manœuvre, pas de la perte
du serveur. Pour les recopier vers un stockage objet OVH, installer `rclone`,
le configurer, puis ajouter la destination dans `/opt/quotator/.env`.

Restaurer :

```bash
systemctl stop quotator
gunzip -c /var/sauvegardes/quotator/quotator-AAAAMMJJ-HHMMSS.sql.gz \
  | psql "$DATABASE_URL"
systemctl start quotator
```

## Variables d'environnement

Elles vivent dans `/opt/quotator/.env`, que seul root et l'utilisateur de
service peuvent lire. Voir `.env.example` à la racine du dépôt pour la liste
et ce que chacune fait.

Tant que les variables `SMTP_*` sont incomplètes, les courriers sont écrits
dans `/opt/quotator/.courrier` au lieu d'être envoyés. C'est voulu : un
environnement mal configuré n'écrit jamais à un vrai client par accident.

## Surveiller

```bash
systemctl status quotator
journalctl -u quotator -f
systemctl list-timers quotator-sauvegarde.timer
```

## Ce que ce montage n'apporte pas

Un VPS, c'est un serveur qu'on possède. Par rapport à une offre infogérée :

- **Pas de bascule automatique.** Si la machine tombe, l'outil est hors ligne
  jusqu'à intervention.
- **Les mises à jour de sécurité sont automatiques, pas les montées de
  version.** Debian et PostgreSQL devront être migrés à la main tous les deux
  ou trois ans.
- **La restauration est manuelle**, et mérite d'être répétée une fois à vide
  pour ne pas la découvrir le jour où elle sert.

C'est le prix de l'économie réalisée, et il est acceptable pour un outil
interne à une petite équipe. Il le serait moins si l'outil devenait critique
pour des tiers.
