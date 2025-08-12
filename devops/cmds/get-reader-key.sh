#! /bin/bash

###
# download the reader key from the secret manager
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"
cd "$ROOT_DIR"

echo "Downloading bucket reader key from gc secret manager..."
mkdir -p ./secrets
gcloud --project=digital-ucdavis-edu secrets versions access latest --secret=itis-backup-reader-key > ./secrets/gc-reader-key.json
echo "Bucket reader key has been downloaded"
