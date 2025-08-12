#! /bin/bash

###
# download the writer key from the secret manager
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"
cd "$ROOT_DIR"

echo "Downloading bucket writer key from gc secret manager..."
mkdir -p ./secrets
gcloud --project=digital-ucdavis-edu secrets versions access latest --secret=itis-backup-writer-key > ./secrets/gc-writer-key.json
echo "Bucket writer key has been downloaded"
