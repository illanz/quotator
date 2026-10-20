#!/usr/bin/env bash
#
# Deploie la version courante du depot.
#
#     cd /opt/quotator && bash deploiement/deployer.sh [branche]
#
# La compilation se fait sur le serveur. C'est le plus simple a tenir pour une
# petite equipe : il n'y a ni chaine d'integration a maintenir, ni artefact a
# transporter, et ce qui tourne est exactement ce qui est dans le depot.
set -euo pipefail

RACINE=/opt/quotator
BRANCHE="${1:-main}"

cd "$RACINE"

echo "==> Sauvegarde avant migration"
# Un schema qui evolue peut perdre des donnees. La sauvegarde precede toujours
# la migration, jamais l'inverse.
bash deploiement/sauvegarder.sh

echo "==> Recuperation de $BRANCHE"
git fetch origin "$BRANCHE"
git checkout "$BRANCHE"
git reset --hard "origin/$BRANCHE"

echo "==> Dependances"
npm ci

echo "==> Schema de base"
npx prisma generate
npx prisma db push

echo "==> Compilation"
npm run build

# Next ne recopie pas les fichiers statiques dans la sortie autonome : ils
# restent la ou la compilation les a laisses.
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

echo "==> Redemarrage"
systemctl restart quotator

# Un redemarrage qui echoue doit se voir ici, pas dans une heure par un client.
sleep 3
if ! systemctl is-active --quiet quotator; then
  echo "Le service n'a pas redemarre :" >&2
  journalctl -u quotator -n 40 --no-pager >&2
  exit 1
fi

echo
echo "Déployé. $(git log --oneline -1)"
