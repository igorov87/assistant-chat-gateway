import { Request } from '@hapi/hapi';
import { getLogger } from '../utils/logger';
import { Context } from '../middleware/context';
import { agentClient } from '../integrations/agent.client';
import { QuestionInput } from '../integrations/models/agent.models';

export class AssistantChatGatewayService {
  /**
   * Orquesta la invocación al backend LLM devolviendo el stream directo
   */
  async streamQuestion(ctx: Context, payload: QuestionInput, request: Request) {
    getLogger(ctx).debug(`streamQuestion - Preparando llamada al backend LLM`);

    // Headers a propagar (incluir Authorization si viene)
    const forwardHeaders: Record<string, string> = {};
    const authHeader = request.headers['authorization'];
    if (authHeader) {
      forwardHeaders['Authorization'] = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    }

    getLogger(ctx).debug('streamQuestion - Enviando petición al backend');
    const response = await agentClient.streamQuestion(payload, forwardHeaders);
    
    // Retornamos directamente el stream de datos para permitir streaming en tiempo real
    getLogger(ctx).debug('streamQuestion - Stream recibido del backend, retornando stream directo');
    return response.data;
  }

  /**
   * Obtiene el historial de conversaciones de un usuario del backend LLM
   * @param ctx - Application context for tracing
   * @param idUsuario - Identificador del usuario
   * @param request - Request de Hapi para obtener headers
   * @returns Historial de conversaciones del usuario
   */
  async getHistory(ctx: Context, idUsuario: string, request: Request) {
    getLogger(ctx).debug(`getHistory - Obteniendo historial para usuario: ${idUsuario}`);

    // Headers a propagar (incluir Authorization si viene)
    const forwardHeaders: Record<string, string> = {};
    const authHeader = request.headers['authorization'];
    if (authHeader) {
      forwardHeaders['Authorization'] = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    }

    getLogger(ctx).debug('getHistory - Enviando petición al backend');
    const response = await agentClient.getHistory(idUsuario, forwardHeaders);
    
    getLogger(ctx).debug('getHistory - Historial obtenido exitosamente');
    return response.data;
  }
}

export const assistantChatGatewayService = new AssistantChatGatewayService();