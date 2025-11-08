#!/bin/bash

# Verifica si se proporcionó el número de versión
if [ -z "$1" ]; then
  echo "Uso: $0 <version>"
  exit 1
fi

# Variables
VERSION=$1
IMAGE_NAME="assistant-chat-gateway"
TAG="us-central1-docker.pkg.dev/is-poc-ia/repo-docker/${IMAGE_NAME}:alpha${VERSION}"

# Construir la imagen
docker build -t ${TAG} .

# Publicar la imagen
docker push ${TAG}

echo "Imagen ${TAG} publicada exitosamente."


#docker build -t ai-contractual-documents-api:x1
# docker tag ai-contractual-documents-api:x1 us-central1-docker.pkg.dev/is-poc-ia/repo-docker/ai-contractual-documents-api:x1
# docker push us-central1-docker.pkg.dev/is-poc-ia/repo-docker/ai-contractual-documents-api:x1
