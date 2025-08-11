FROM node:22

# Install packages
RUN apt update && apt install -y \
  vim \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl \
  lsb-release \
  postgresql-client

# Set working directory
RUN mkdir /services
WORKDIR /services

COPY services/package.json .
COPY services/package-lock.json .

COPY services/lib ./lib
COPY services/cli ./cli
COPY services/harvester ./harvester

RUN npm install

RUN chmod +x cli/bin/lci.js && npm link

CMD ["bash", "-c", "tail -f /dev/null"]
