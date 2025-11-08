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
}

export const assistantChatGatewayService = new AssistantChatGatewayService();