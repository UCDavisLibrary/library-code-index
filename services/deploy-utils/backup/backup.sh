#! /bin/bash

source /etc/profile
DATA_DIR=/services/deploy-utils/data/backup

if [[ -z $BACKUP_DATA_ENV ]]; then
  echo "BACKUP_DATA_ENV variable is required."
  exit 1
fi

if [[ -z $GC_BACKUP_BUCKET ]]; then
  echo "GC_BACKUP_BUCKET variable is required."
  exit 1
fi

if [[ -z $BACKUP_FILE_NAME ]]; then
  echo "BACKUP_FILE_NAME variable is required."
  exit 1
fi

if [[ -z $GOOGLE_APPLICATION_CREDENTIALS ]]; then
  echo "GOOGLE_APPLICATION_CREDENTIALS variable is required."
  exit 1
fi

# dump pg data
echo "Generating sqldump file"
pg_dump | gzip > $DATA_DIR/$BACKUP_FILE_NAME
echo "uploading sql dump file to cloud bucket gs://${GC_BACKUP_BUCKET}/${BACKUP_DATA_ENV}/${BACKUP_FILE_NAME}"
gcloud auth login --quiet --cred-file=${GOOGLE_APPLICATION_CREDENTIALS}
gsutil cp $DATA_DIR/$BACKUP_FILE_NAME "gs://${GC_BACKUP_BUCKET}/${BACKUP_DATA_ENV}/${BACKUP_FILE_NAME}"
rm $DATA_DIR/$BACKUP_FILE_NAME

if [[ -n $BACKUP_LOG_TABLE ]]; then
  echo "BACKUP_LOG_TABLE is set to $BACKUP_LOG_TABLE"
  psql -c "CREATE TABLE IF NOT EXISTS $BACKUP_LOG_TABLE (
    id SERIAL PRIMARY KEY,
    backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_bucket TEXT,
    backup_env TEXT
  );"
  psql -c "INSERT INTO $BACKUP_LOG_TABLE (backup_bucket, backup_env) VALUES ('${GC_BACKUP_BUCKET}', '${BACKUP_DATA_ENV}');"

  echo "Backup log entry created in table $BACKUP_LOG_TABLE"
else
  echo "BACKUP_LOG_TABLE is not set, skipping log entry creation."
fi

echo "backup complete"
