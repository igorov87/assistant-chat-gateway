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
    const forward_headers: Record<string, string> = {};


    const authHeader = request.headers['authorization'];
    if (authHeader) {
      forward_headers['Authorization'] = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    }
    getLogger(ctx).debug(`Header ofuscado: ${forward_headers['Authorization']?.substring(0, 5)}****${forward_headers['Authorization']?.substring(forward_headers['Authorization']?.length - 5)}`);
    
    getLogger(ctx).debug('streamQuestion - Enviando petición al backend');
    const response = await agentClient.streamQuestion(payload, forward_headers);
    
    // Retornamos directamente el stream de datos para permitir streaming en tiempo real
    getLogger(ctx).debug('streamQuestion - Stream recibido del backend, retornando stream directo');
    return response.data;
  }
}

export const assistantChatGatewayService = new AssistantChatGatewayService();