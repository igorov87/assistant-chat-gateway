# Configuraciones del Backend - Assistant Chat Gateway

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Variables de Entorno](#variables-de-entorno)
- [Configuración por Ambiente](#configuración-por-ambiente)
- [Configuración del Servidor](#configuración-del-servidor)
- [Integraciones Externas](#integraciones-externas)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Configuración de Docker](#configuración-de-docker)
- [Validación de Configuraciones](#validación-de-configuraciones)

---

## Descripción General

El **Assistant Chat Gateway** es un API Gateway que gestiona los flujos conversacionales de la plataforma de Asistentes. Este documento describe todas las configuraciones necesarias para su correcto funcionamiento en diferentes ambientes.

### Arquitectura de Configuración

```
assistant-chat-gateway/
├── .env                    # Variables de entorno (NO versionar)
├── .env.example           # Plantilla de variables de entorno
├── src/utils/environment.ts  # Gestión centralizada de variables
└── docs/configurations.md  # Este documento
```

---

## Variables de Entorno

Todas las variables de entorno se gestionan de manera centralizada en el archivo `src/utils/environment.ts`. Para configurar el proyecto:

1. Copiar el archivo `.env.example` a `.env`
2. Configurar las variables según el ambiente
3. **NUNCA** versionar el archivo `.env` en Git

### Variables Requeridas

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `LOG_LEVEL` | string | Nivel de logging (debug, info, warn, error) | `info` |
| `HOST` | string | Host del servidor | `localhost` |
| `PORT` | number | Puerto del servidor | `8080` |
| `LLM_API_BASE_URL` | string | URL base del servicio LLM Agent | `http://localhost:8000` |
| `GOOGLE_PROJECT_ID` | string | ID del proyecto de Google Cloud/Firebase | `my-project-12345` |

### Variables Opcionales

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `HTTP_TIMEOUT` | number | `60000` | Timeout para requests HTTP (ms) |
| `ENABLE_CORS` | boolean | `true` | Habilitar CORS |
| `CORS_ORIGINS` | string | `*` | Orígenes permitidos para CORS |
| `MAX_PAYLOAD_SIZE` | number | `1048576` | Tamaño máximo del body (bytes) |

---

## Configuración por Ambiente

### Desarrollo Local

```bash
# .env para desarrollo
LOG_LEVEL=debug
HOST=localhost
PORT=8080
LLM_API_BASE_URL=http://localhost:8000
GOOGLE_PROJECT_ID=dev-project-12345
```

**Ejecutar en desarrollo:**

```bash
npm run dev
```

### Ambiente de QA/Testing

```bash
# .env para QA
LOG_LEVEL=info
HOST=0.0.0.0
PORT=8080
LLM_API_BASE_URL=https://api-llm-agent-qa.interseguro.com
GOOGLE_PROJECT_ID=qa-project-12345
```

### Ambiente de Staging

```bash
# .env para Staging
LOG_LEVEL=info
HOST=0.0.0.0
PORT=8080
LLM_API_BASE_URL=https://api-llm-agent-staging.interseguro.com
GOOGLE_PROJECT_ID=staging-project-12345
```

### Ambiente de Producción

```bash
# .env para Producción
LOG_LEVEL=warn
HOST=0.0.0.0
PORT=8080
LLM_API_BASE_URL=https://api-llm-agent.interseguro.com
GOOGLE_PROJECT_ID=prod-project-12345
```

---

## Configuración del Servidor

### Servidor Hapi.js

El servidor se configura en `src/index.ts` con las siguientes características:

```typescript
const server = Hapi.server({
  port: process.env.PORT || 8080,
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: ["*"]
    }
  }
});
```

#### Health Checks

El servidor expone dos endpoints para health checks:

- **Liveness**: `GET /liveness` - Verifica que el servidor está corriendo
- **Readiness**: `GET /readiness` - Verifica que el servidor está listo para recibir tráfico

Estos endpoints son utilizados por Kubernetes para monitorear el estado del servicio.

### Logging

El sistema de logging se gestiona a través de `src/utils/logger.ts` usando la biblioteca **Pino**.

**Niveles de logging:**

- `debug`: Información detallada para debugging
- `info`: Información general del flujo de la aplicación
- `warn`: Advertencias que no afectan el funcionamiento
- `error`: Errores que requieren atención

**Uso en el código:**

```typescript
import { getLogger } from '../utils/logger';

getLogger(ctx).debug('Mensaje de debug', { data });
getLogger(ctx).info('Flujo ejecutado correctamente');
getLogger(ctx).warn('Advertencia sobre algo');
getLogger(ctx).error('Error crítico', { error });
```

---

## Integraciones Externas

### API LLM Agent

El gateway se integra con un servicio backend de LLM para procesar las conversaciones.

**Configuración:**

```typescript
// src/integrations/agent.client.ts
export class AgentClient {
  constructor(baseURL: string = LLM_API_BASE_URL) {
    this.httpClient = axios.create({
      baseURL,
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
  }
}
```

**Endpoints disponibles:**

1. **Stream Question** - `POST /v1/llm/stream/question`
   - Envía preguntas y recibe respuestas en streaming
   - Timeout: 120 segundos
   - Streaming en tiempo real con SSE

2. **Get History** - `GET /v1/llm/history/{idUsuario}`
   - Obtiene el historial de conversaciones
   - Timeout: 30 segundos

**Configuración de timeouts:**

```typescript
// Para streaming
timeout: 120000  // 2 minutos

// Para requests normales
timeout: 30000   // 30 segundos
```

---

## Autenticación y Seguridad

### Firebase Authentication

El sistema utiliza **Firebase Authentication** para validar tokens JWT de usuarios.

#### Configuración

```bash
# Variable requerida
GOOGLE_PROJECT_ID=your-project-id
```

La inicialización se realiza automáticamente usando **Application Default Credentials (ADC)** de Google Cloud.

#### Credenciales en Diferentes Ambientes

**Desarrollo Local:**

1. Instalar Google Cloud SDK
2. Ejecutar: `gcloud auth application-default login`
3. O configurar: `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

**Kubernetes/GCP:**

Las credenciales se obtienen automáticamente desde el **Workload Identity** del cluster.

**Docker:**

Montar el archivo de credenciales como volumen:

```bash
docker run -v /path/to/credentials.json:/app/credentials.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json \
  assistant-chat-gateway
```

#### Middleware de Autenticación

```typescript
// src/middleware/auth.middleware.ts
export const validateFirebaseToken = async (request: Request, h: ResponseToolkit) => {
  // Extrae y valida el token Bearer
  const authHeader = request.headers.authorization;
  const token = authHeader.substring(7); // Remover "Bearer "
  
  // Valida con Firebase Admin SDK
  const user = await firebaseAuthMiddleware.validateToken(ctx, token);
  
  // Agrega información del usuario al request
  (request.app as AuthenticatedRequestApplicationState).user = user;
  
  return h.continue;
}
```

#### Uso en Rutas

```typescript
server.route({
  method: 'POST',
  path: '/api/v1/chat/stream',
  options: {
    pre: [{ method: validateFirebaseToken }],
    validate: {
      payload: chatRequestSchema
    }
  },
  handler: chatController.streamQuestion
});
```

### Validación de Requests

Todas las rutas implementan validación usando **Joi**:

```typescript
const chatRequestSchema = Joi.object({
  idUsuario: Joi.string().uuid().required(),
  pregunta: Joi.string().min(1).max(1000).required(),
  idConversacion: Joi.string().uuid().optional()
});
```

---

## Configuración de Docker

### Dockerfile

El proyecto incluye un `Dockerfile` optimizado para producción:

```dockerfile
FROM node:20-alpine3.19
WORKDIR /application
COPY dist dist/
COPY package*.json .
RUN npm ci --only=production
EXPOSE 8080
CMD ["npm", "start"]
```

### Build de Imagen

```bash
# Build
./build.sh

# O manualmente
npm run build
docker build -t assistant-chat-gateway:latest .
```

### Ejecutar Contenedor

```bash
docker run -d \
  -p 8080:8080 \
  -e LOG_LEVEL=info \
  -e LLM_API_BASE_URL=http://llm-service:8000 \
  -e GOOGLE_PROJECT_ID=my-project \
  --name assistant-chat-gateway \
  assistant-chat-gateway:latest
```

### Docker Compose (Desarrollo)

```yaml
version: '3.8'
services:
  assistant-chat-gateway:
    build: .
    ports:
      - "8080:8080"
    environment:
      - LOG_LEVEL=debug
      - LLM_API_BASE_URL=http://llm-agent:8000
      - GOOGLE_PROJECT_ID=${GOOGLE_PROJECT_ID}
    volumes:
      - ./credentials.json:/app/credentials.json
    env_file:
      - .env
```

---

## Validación de Configuraciones

### Validación al Inicio

El sistema valida las configuraciones críticas al iniciar:

```typescript
// src/middleware/auth.middleware.ts
if (!GOOGLE_PROJECT_ID) {
  throw new Error('GOOGLE_PROJECT_ID is required for authentication');
}
```

### Script de Validación

Crear un script `validate-config.sh` para validar configuraciones:

```bash
#!/bin/bash

# Verificar que existe .env
if [ ! -f .env ]; then
  echo "❌ Error: Archivo .env no encontrado"
  echo "💡 Ejecuta: cp .env.example .env"
  exit 1
fi

# Verificar variables requeridas
required_vars=("LOG_LEVEL" "PORT" "LLM_API_BASE_URL" "GOOGLE_PROJECT_ID")

for var in "${required_vars[@]}"; do
  if ! grep -q "^${var}=" .env; then
    echo "❌ Error: Variable ${var} no configurada en .env"
    exit 1
  fi
done

echo "✅ Configuraciones validadas correctamente"
```

### Checklist de Configuración

- [ ] Archivo `.env` creado desde `.env.example`
- [ ] Variable `GOOGLE_PROJECT_ID` configurada
- [ ] Variable `LLM_API_BASE_URL` apunta al servicio correcto
- [ ] Credenciales de Google Cloud configuradas (ADC o service account)
- [ ] Puerto `8080` disponible
- [ ] Health checks `/liveness` y `/readiness` funcionando
- [ ] Tests de integración pasando

### Probar Configuración

```bash
# 1. Iniciar servidor
npm run dev

# 2. Verificar health checks
curl http://localhost:8080/liveness
curl http://localhost:8080/readiness

# 3. Verificar autenticación (con token válido)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/v1/chat/history/test-user-id

# 4. Ejecutar tests
npm test
```

---

## Troubleshooting

### Error: "GOOGLE_PROJECT_ID is required"

**Solución:** Configurar la variable en `.env`:

```bash
GOOGLE_PROJECT_ID=your-project-id
```

### Error: "Firebase authentication failed"

**Solución:** Verificar credenciales de Google Cloud:

```bash
# Desarrollo local
gcloud auth application-default login

# O configurar service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Error: "Connection refused to LLM_API_BASE_URL"

**Solución:** Verificar que el servicio LLM está corriendo y la URL es correcta:

```bash
# Verificar conectividad
curl http://localhost:8000/health

# Actualizar .env si es necesario
LLM_API_BASE_URL=http://correct-url:port
```

### Error: "Port 8080 already in use"

**Solución:** Cambiar el puerto en `.env`:

```bash
PORT=3000
```

---

## Referencias

- [Documentación de Hapi.js](https://hapi.dev/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Cloud ADC](https://cloud.google.com/docs/authentication/application-default-credentials)
- [Joi Validation](https://joi.dev/api/)
- [Pino Logger](https://getpino.io/)

---

## Contacto

Para soporte o consultas sobre configuraciones:

- **Autor:** Ernesto Laura
- **Proyecto:** Assistant Chat Gateway
- **Versión:** 1.0.0

