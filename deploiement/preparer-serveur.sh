#!/usr/bin/env bash
#
# Prepare un VPS Debian 12 ou 13 nu pour accueillir Quotator.
#
# A lancer une seule fois, en root, sur un serveur fraichement livre :
#
#     bash preparer-serveur.sh app.madcityzen.fr
#
# Ce qu'il installe : Node, PostgreSQL, Caddy, un utilisateur de service, et
# les mises a jour de securite automatiques. Il n'installe rien d'autre :
# chaque paquet supplementaire est une surface d'attaque de plus sur une
# machine qui porte toute la base clients.
set -euo pipefail

DOMAINE="${1:-}"
if [[ -z "$DOMAINE" ]]; then
  echo "Usage : bash preparer-serveur.sh <domaine>   (ex. app.madcityzen.fr)" >&2
  exit 1
fi

UTILISATEUR=quotator
RACINE=/opt/quotator

echo "==> Mise a jour du systeme"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Mises a jour de securite automatiques"
# Sans cela, le serveur vieillit et personne ne s'en apercoit avant l'incident.
apt-get install -y -qq unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Node.js 22"
apt-get install -y -qq ca-certificates curl gnupg git
install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list
apt-get update -qq
apt-get install -y -qq nodejs

echo "==> PostgreSQL"
apt-get install -y -qq postgresql postgresql-contrib

echo "==> Caddy (TLS automatique, renouvellement compris)"
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
  > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq
apt-get install -y -qq caddy

echo "==> Utilisateur de service"
# L'application ne tourne jamais en root : une faille dans une dependance ne
# doit pas donner la machine.
id -u "$UTILISATEUR" &>/dev/null || useradd --system --create-home --shell /usr/sbin/nologin "$UTILISATEUR"
install -d -o "$UTILISATEUR" -g "$UTILISATEUR" "$RACINE"
install -d -o "$UTILISATEUR" -g "$UTILISATEUR" /var/sauvegardes/quotator

echo "==> Base de donnees"
MOT_DE_PASSE="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='quotator'\"" | grep -q 1 \
  || su - postgres -c "psql -c \"CREATE ROLE quotator LOGIN PASSWORD '$MOT_DE_PASSE'\""
su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='quotator'\"" | grep -q 1 \
  || su - postgres -c "createdb -O quotator quotator"

echo "==> Pare-feu"
apt-get install -y -qq ufw
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
# PostgreSQL n'ecoute que sur la boucle locale : il n'est pas ouvert, et n'a
# pas a l'etre tant que l'application tourne sur la meme machine.
ufw --force enable >/dev/null

echo "==> Caddy"
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAINE {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}
CADDY
systemctl reload caddy

echo
echo "Serveur prêt."
echo
echo "Reste à faire, dans l'ordre :"
echo "  1. Pointer $DOMAINE vers ce serveur dans la zone DNS OVH (enregistrement A)."
echo "  2. Déposer le dépôt dans $RACINE et créer $RACINE/.env :"
echo
echo "     DATABASE_URL=\"postgresql://quotator:$MOT_DE_PASSE@127.0.0.1:5432/quotator?schema=public\""
echo "     AUTH_SECRET=\"$(openssl rand -base64 48 | tr -d '\n')\""
echo "     APP_URL=\"https://$DOMAINE\""
echo
echo "  3. Installer le service et la sauvegarde :"
echo "     cp deploiement/quotator.service /etc/systemd/system/"
echo "     cp deploiement/quotator-sauvegarde.{service,timer} /etc/systemd/system/"
echo "     systemctl daemon-reload"
echo "     systemctl enable --now quotator quotator-sauvegarde.timer"
echo
echo "  4. Déployer : bash deploiement/deployer.sh"
echo
echo "Le mot de passe de la base n'est affiché qu'ici. Le noter maintenant."
