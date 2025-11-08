import * as Joi from 'joi';
import { Request, ResponseToolkit, Server } from "@hapi/hapi";
import * as Boom from '@hapi/boom';
import * as assistantChatGatewayController from '../controllers/assistant-chat-gateway.controller';
import { validateFirebaseToken } from '../middleware/auth.middleware';


export const assistantChatGatewayRoutes = (server: Server) => {
  // Definicion de los routes
  server.route({
    method: 'POST',
    path: '/v1/llm/stream/question',
    options: {
      description: 'Obtener respuesta en streaming del agente AI',
      tags: ['api'],
      pre: [
        { method: validateFirebaseToken }
      ],
      validate: {
        headers: Joi.object({
          authorization: Joi.string().pattern(/^Bearer\s+[^\s]+$/i).required()
        }).options({ allowUnknown: true }),
        payload: Joi.object({
          user: Joi.string().required(),
          assistant: Joi.string().required(),
          question: Joi.string().required(),
          assistantName: Joi.string().required(),
          conversationId: Joi.string().allow(null, '').optional(),
          history: Joi.string().allow('').optional(),
          memory: Joi.boolean().optional(),
          networkUser: Joi.string().allow('').optional()
        }),
        failAction: (request: Request, h: ResponseToolkit, err: any) => {
          const details = err?.details || [];
          const missingAuth = details.find((d: any) => d?.path?.[0] === 'authorization' && d?.type === 'any.required');
          if (missingAuth) {
            // 401 cuando falta Authorization
            throw Boom.unauthorized('Missing Authorization header', 'Bearer');
          }
          console.warn('Validation failed', { errors: err?.details });
          throw err;
        }
      }
    },
    handler: assistantChatGatewayController.postStreamQuestion
  });
  
};
