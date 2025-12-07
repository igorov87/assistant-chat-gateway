import { Request, ResponseToolkit } from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { assistantChatGatewayService } from '../services/assistant-chat-gateway.service';
import { getLogger } from '../utils/logger';
import { Context, ContextRequestApplicationState } from '../middleware/context';
import { QuestionInput } from '../integrations/models/agent.models';
import { getAuthenticatedUser } from '../middleware/auth.middleware';

export const postStreamQuestion = async (request: Request, h: ResponseToolkit) => {
  const ctx = getContext(request);
  const authenticatedUser = getAuthenticatedUser(request);
  
  getLogger(ctx).debug('postStreamQuestion - Inicio', { 
    userEmail: authenticatedUser.email,
    userId: authenticatedUser.sub 
  });
  
  try {
    const payload = request.payload as QuestionInput;
    
    // Usar el raw response de Node.js para bypasear el buffering de Hapi
    const rawResponse = request.raw.res;
    
    // Configurar headers SSE manualmente en el raw response
    rawResponse.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Transfer-Encoding': 'chunked'
    });
    
    getLogger(ctx).debug('postStreamQuestion - Headers SSE configurados en raw response');
    
    // Obtener el stream del backend
    const backendStream = await assistantChatGatewayService.streamQuestion(ctx, payload, request);
    
    // Pipe directo del stream backend al raw response (sin buffering de Hapi)
    backendStream.pipe(rawResponse, { end: true });
    
    // Manejo de errores del stream
    backendStream.on('error', (streamError: any) => {
      getLogger(ctx).error('postStreamQuestion - Stream error:', streamError);
      if (!rawResponse.headersSent) {
        rawResponse.writeHead(500);
      }
      rawResponse.end();
    });

    // Cleanup cuando la conexión del cliente se cierra
    request.events.once('disconnect', () => {
      getLogger(ctx).debug('postStreamQuestion - Cliente desconectado, cerrando stream');
      if (backendStream && typeof backendStream.destroy === 'function') {
        backendStream.destroy();
      }
    });
    
    // Logging cuando el stream se completa
    backendStream.on('end', () => {
      getLogger(ctx).debug('postStreamQuestion - Stream completado');
    });
    
    getLogger(ctx).debug('postStreamQuestion - Stream pipeline configurado correctamente');
    
    // Retornar respuesta abandonada para que Hapi no interfiera
    return h.abandon;
    
  } catch (error: any) {
    getLogger(ctx).error('postStreamQuestion - Error:', error);
    const e = Boom.internal('Error interno');
    e.output.payload.message = 'Error en la consulta';
    return e;
  }
}

export const getHistory = async (request: Request, h: ResponseToolkit) => {
  const ctx = getContext(request);
  const authenticatedUser = getAuthenticatedUser(request);
  const idUsuario = request.params.idUsuario;
  
  getLogger(ctx).debug('getHistory - Inicio', { 
    userEmail: authenticatedUser.email,
    userId: authenticatedUser.sub,
    idUsuario 
  });
  
  try {
    const history = await assistantChatGatewayService.getHistory(ctx, idUsuario, request);
    
    getLogger(ctx).debug('getHistory - Historial obtenido exitosamente');
    return h.response(history);
    
  } catch (error: any) {
    getLogger(ctx).error('getHistory - Error:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      if (statusCode === 404) {
        return Boom.notFound('Historial no encontrado');
      }
      if (statusCode === 401 || statusCode === 403) {
        return Boom.unauthorized('No autorizado');
      }
    }
    
    const e = Boom.internal('Error interno');
    e.output.payload.message = 'Error al obtener el historial';
    return e;
  }
}

const getContext = (request: Request): Context => {
  return (request.app as ContextRequestApplicationState).context;
}