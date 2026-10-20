#!/usr/bin/env bash
#
# Sauvegarde de la base, compressee et datee.
#
# Lancee chaque nuit par `quotator-sauvegarde.timer`, et avant chaque
# deploiement. Quatorze jours sont conserves : assez pour s'apercevoir d'une
# corruption silencieuse et remonter avant elle.
#
# Une sauvegarde qui ne quitte pas la machine ne protege que des erreurs de
# manipulation, pas de la perte du serveur. Renseigner DESTINATION_DISTANTE
# pour la recopier ailleurs — un stockage objet OVH, ou tout ce que rclone
# sait atteindre.
set -euo pipefail

DOSSIER=/var/sauvegardes/quotator
JOURS=14
DESTINATION_DISTANTE="${DESTINATION_DISTANTE:-}"

mkdir -p "$DOSSIER"

# La chaine de connexion vit dans l'environnement du service, pas dans ce
# script : un secret recopie est un secret de plus a faire tourner.
set -a
# shellcheck disable=SC1091
source /opt/quotator/.env
set +a

FICHIER="$DOSSIER/quotator-$(date +%Y%m%d-%H%M%S).sql.gz"

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -9 > "$FICHIER"

# Une sauvegarde vide est un echec silencieux : mieux vaut qu'elle crie.
TAILLE=$(stat -c %s "$FICHIER")
if [[ "$TAILLE" -lt 1024 ]]; then
  echo "Sauvegarde suspecte : $FICHIER ne fait que $TAILLE octets." >&2
  exit 1
fi

find "$DOSSIER" -name 'quotator-*.sql.gz' -mtime "+$JOURS" -delete

if [[ -n "$DESTINATION_DISTANTE" ]]; then
  rclone copy "$FICHIER" "$DESTINATION_DISTANTE"
fi

echo "Sauvegarde : $FICHIER ($((TAILLE / 1024)) Kio)"
