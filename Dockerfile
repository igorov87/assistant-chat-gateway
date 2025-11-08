# Establecer la imagen base
FROM node:20-alpine3.19

# Crear el directorio de trabajo
WORKDIR /application

# Copiar los archivos de artefacto y los archivos necesarios
COPY dist dist/
COPY package*.json .

# Instalar las dependencias de producción
RUN npm ci --only=production

# Exponer el puerto 8080
EXPOSE 8080

# Iniciar la aplicación
CMD ["npm", "start"]
