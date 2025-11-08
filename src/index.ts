/**
 * assistant-chat-gateway
 * Gateway para los flujos conversacionales de la plataforma de Asistentes
 *
 * @author Ernesto Laura
 */

// Cargar variables de entorno desde archivo .env
import * as dotenv from 'dotenv';
dotenv.config();

import * as Hapi from "@hapi/hapi";
import { assistantChatGatewayRoutes } from './routes/assistant-chat-gateway.route';
import { contextServerMiddleware, responseHeadersMiddleware } from './middleware/context';
import { HealthPlugin } from 'hapi-k8s-health'

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ["*"]
      }
    }
  });

  // Registra el path /liveness y /readiness para que se puedan hacer pruebas de salud
  await server.register({
    plugin: HealthPlugin,
    options: {
      livenessProbes: {
        status: () => Promise.resolve('OK')
      },
      readinessProbes: {
        // Implementación del rediness según corresponda
        //service: () => Promise.resolve('OK')
      }
    }
  });

  // Contexto de la aplicación
  contextServerMiddleware(server);
  // Headers de respuesta
  responseHeadersMiddleware(server);
  // Inicia los routes
  assistantChatGatewayRoutes(server);
  // Inicia el servidor
  await server.start();
  console.info(`[assistant-chat-gateway] Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
