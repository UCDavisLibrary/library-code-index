FROM node:22

# Install packages
RUN apt update && apt install -y \
  vim \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl

# prep work for gsutils
RUN curl -O https://packages.cloud.google.com/apt/doc/apt-key.gpg \
    && apt-key add apt-key.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

# prep for postgres
RUN apt-get update && apt-get install -y lsb-release
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -

# Set up init/backup utils
RUN apt-get update && apt-get install -y postgresql-client \
  wait-for-it google-cloud-sdk cron procps

# Set working directory
RUN mkdir /services
WORKDIR /services

COPY services/package.json .
COPY services/package-lock.json .

COPY services/lib ./lib
COPY services/cli ./cli
COPY services/harvester ./harvester

# init/backup utils
RUN mkdir -p deploy-utils/data/backup && \
  mkdir -p deploy-utils/data/init
COPY services/deploy-utils/backup ./deploy-utils/backup
COPY services/deploy-utils/backup/cron /etc/cron.d/backup
RUN chmod 0644 /etc/cron.d/backup
COPY services/deploy-utils/init init

RUN npm install

RUN chmod +x cli/bin/lci.js && npm link

CMD ["bash", "-c", "tail -f /dev/null"]
