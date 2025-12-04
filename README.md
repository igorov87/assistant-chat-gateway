# Assistant Chat Gateway

## Descripción y propósito

Gateway para los flujos conversacionales de la plataforma de Asistentes de IA de Interseguro. Este servicio actúa como punto de entrada seguro para las interacciones con los asistentes conversacionales, proporcionando:

- **Autenticación y seguridad**: Implementa autenticación mediante Firebase Authentication para proteger los endpoints
- **Streaming de respuestas**: Permite obtener respuestas en tiempo real del agente AI mediante Server-Sent Events (SSE)
- **Gestión de historial**: Proporciona endpoints para consultar el historial completo de conversaciones de los usuarios
- **Integración con LLM**: Comunica con el backend de modelos de lenguaje (LLM) de forma transparente y segura
- **Trazabilidad**: Implementa logging contextual con `applicationId` y `transactionId` para seguimiento de operaciones
- **Health checks**: Endpoints de liveness y readiness para integración con Kubernetes/Cloud Run

## Repositorio

```
https://github.com/interseguro/assistant-chat-gateway
```

## Requisitos

Para preparar el ambiente de desarrollo necesitas:

- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **TypeScript**: v4.9.5 (incluido en devDependencies)
- **Variables de entorno**: Archivo `.env` configurado (ver sección Configuración esencial)
- **Cuenta de Firebase**: Proyecto configurado con Firebase Authentication para obtener el `GOOGLE_PROJECT_ID`
- **Acceso al LLM Backend**: URL del servicio backend de modelos de lenguaje

## Estructura del proyecto

```
assistant-chat-gateway/
├── src/                                    # Directorio de código fuente
│   ├── controllers/                        # Controladores de las peticiones HTTP
│   │   └── assistant-chat-gateway.controller.ts  # Controlador principal del gateway
│   ├── entities/                           # Entidades/DTOs para request y response
│   │   └── assistant-chat-gateway.entity.ts      # Entidades del gateway
│   ├── integrations/                       # Capa de integración con APIs externas
│   │   ├── agent.client.ts                 # Cliente HTTP para comunicación con el LLM backend
│   │   └── models/                         # Modelos de request/response de APIs externas
│   │       └── agent.models.ts             # Modelos para el agente AI
│   ├── middleware/                         # Middlewares de la aplicación
│   │   ├── auth.middleware.ts              # Middleware de autenticación con Firebase
│   │   └── context.ts                      # Gestión de contexto de trazabilidad
│   ├── routes/                             # Definición de rutas y validaciones
│   │   └── assistant-chat-gateway.route.ts # Rutas del gateway con validaciones Joi
│   ├── services/                           # Capa de lógica de negocio
│   │   └── assistant-chat-gateway.service.ts     # Servicio principal del gateway
│   ├── utils/                              # Utilidades y helpers
│   │   ├── environment.ts                  # Configuración de variables de entorno
│   │   └── logger.ts                       # Configuración de logger con Pino
│   └── index.ts                            # Punto de entrada principal de la aplicación
├── tests/                                  # Pruebas unitarias
│   └── assistant-chat-gateway.route.test.ts      # Tests de los endpoints
├── test-result/                            # Resultados de las pruebas
│   └── test-report.html                    # Reporte HTML de tests ejecutados
├── docs/                                   # Documentación del proyecto
│   ├── openapi.json                        # Especificación OpenAPI 3.0
│   ├── configurations.md                   # Documentación de configuraciones
│   └── deployment.md                       # Guía de despliegue
├── node_modules/                           # Dependencias de Node.js
├── Dockerfile                              # Configuración para construcción de imagen Docker
├── build.sh                                # Script de construcción para CI/CD
├── runLocal.sh                             # Script para ejecución local en Linux/Mac
├── runLocal.bat                            # Script para ejecución local en Windows
├── nodemon.json                            # Configuración de nodemon para desarrollo
├── tsconfig.json                           # Configuración del compilador TypeScript
├── package.json                            # Dependencias y scripts del proyecto
├── package-lock.json                       # Lock file de dependencias
└── README.md                               # Documentación principal del proyecto
```

## Quickstart

### Instalación de dependencias

```bash
npm install
```

### Ejecución en modo desarrollo (con hot reload)

```bash
npm run dev
```

O usando los scripts del proyecto:

```bash
# Linux/Mac
./runLocal.sh

# Windows
runLocal.bat
```

### Compilación del proyecto

```bash
npm run build
```

### Ejecución en modo producción

```bash
npm start
```

### Ejecución de tests

```bash
npm test
```

El reporte HTML de los tests se generará en `test-result/test-report.html`

## Configuración esencial

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables de entorno:

```bash
# Configuración del servidor
HOST=localhost
PORT=8080
LOG_LEVEL=debug

# URL del backend LLM (Servicio de modelos de lenguaje)
LLM_API_BASE_URL=http://localhost:8080

# Configuración de Firebase Authentication
# ID del proyecto de Google Cloud Platform/Firebase
GOOGLE_PROJECT_ID=your-firebase-project-id
```

### Descripción de las variables

- **HOST**: Host donde se levantará el servidor (por defecto: `localhost`)
- **PORT**: Puerto donde escuchará el servidor (por defecto: `3000`)
- **LOG_LEVEL**: Nivel de logging (`debug`, `info`, `warn`, `error`)
- **LLM_API_BASE_URL**: URL base del servicio backend de modelos de lenguaje (requerido)
- **GOOGLE_PROJECT_ID**: ID del proyecto de Firebase para validación de tokens JWT (requerido)

## Despliegue

**Dónde vive**: GCP Cloud Run

**Ambientes**: Dev / Stg / Prod → docs/deployment.md
