import * as Hapi from '@hapi/hapi';
import { assistantChatGatewayRoutes } from '../src/routes/assistant-chat-gateway.route';
import { contextServerMiddleware } from '../src/middleware/context';

// Mock del servicio para evitar llamadas externas
jest.mock('../src/services/assistant-chat-gateway.service', () => ({
  assistantChatGatewayService: {
    streamQuestion: jest.fn().mockResolvedValue({ data: 'test response' }),
    getHistory: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      conversations: [
        {
          id: 'conv-1',
          timestamp: '2024-01-01T10:00:00Z',
          messages: []
        }
      ]
    })
  }
}));

// Mock del middleware de autenticación de Firebase
jest.mock('../src/middleware/auth.middleware', () => ({
  validateFirebaseToken: jest.fn(async (request: any, h: any) => {
    // Simular usuario autenticado válido por defecto
    const mockUser = {
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      email_verified: true
    };
    request.app.user = mockUser;
    return h.continue;
  }),
  getAuthenticatedUser: jest.fn().mockReturnValue({
    sub: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    email_verified: true
  })
}));

describe('assistant-chat-gateway routes', () => {
  let server: Hapi.Server;

  beforeAll(async () => {
    server = Hapi.server({ port: 0 });
    
    // Aplicar middleware de contexto
    contextServerMiddleware(server);
    
    // Registrar rutas
    assistantChatGatewayRoutes(server);
    
    await server.initialize();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should fail validation for missing required fields', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/v1/llm/stream/question',
      payload: { question: 'hola' },
      headers: { authorization: 'Bearer valid-token' }
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 when Authorization header is missing', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/v1/llm/stream/question',
      payload: { user: '', assistant: '', question: '', assistantName: '' }
    });
    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toContain('Bearer');
  });

  it('should fail when Authorization is not Bearer format', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/v1/llm/stream/question',
      payload: { user: '', assistant: '', question: '', assistantName: '' },
      headers: { authorization: 'Basic abc' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('should handle authentication failure and return 401', async () => {
    // Mock temporal para simular fallo de autenticación
    const Boom = require('@hapi/boom');
    const authMiddleware = require('../src/middleware/auth.middleware');
    
    authMiddleware.validateFirebaseToken.mockImplementationOnce(async () => {
      throw Boom.unauthorized('Invalid token', 'Bearer');
    });

    const res = await server.inject({
      method: 'POST',
      url: '/v1/llm/stream/question',
      payload: { 
        user: 'test-user', 
        assistant: 'test-assistant', 
        question: 'test question', 
        assistantName: 'Test Assistant',
        conversationId: ''
      },
      headers: { authorization: 'Bearer invalid-token' }
    });

    expect(res.statusCode).toBe(401);
  });

  it('should succeed with valid payload and authentication', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/v1/llm/stream/question',
      payload: {
        user: 'test-user',
        assistant: 'test-assistant', 
        question: 'test question',
        assistantName: 'Test Assistant',
        conversationId: '',
        history: '',
        memory: true,
        networkUser: ''
      },
      headers: { authorization: 'Bearer valid-token' }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
  });

  describe('GET /v1/llm/history/{idUsuario}', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/v1/llm/history/test-user-id'
      });
      expect(res.statusCode).toBe(401);
      expect(res.headers['www-authenticate']).toContain('Bearer');
    });

    it('should fail when Authorization is not Bearer format', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/v1/llm/history/test-user-id',
        headers: { authorization: 'Basic abc' }
      });
      expect(res.statusCode).toBe(400);
    });

    it('should handle authentication failure and return 401', async () => {
      // Mock temporal para simular fallo de autenticación
      const Boom = require('@hapi/boom');
      const authMiddleware = require('../src/middleware/auth.middleware');
      
      authMiddleware.validateFirebaseToken.mockImplementationOnce(async () => {
        throw Boom.unauthorized('Invalid token', 'Bearer');
      });

      const res = await server.inject({
        method: 'GET',
        url: '/v1/llm/history/test-user-id',
        headers: { authorization: 'Bearer invalid-token' }
      });

      expect(res.statusCode).toBe(401);
    });

    it('should succeed with valid idUsuario and authentication', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/v1/llm/history/test-user-id',
        headers: { authorization: 'Bearer valid-token' }
      });

      expect(res.statusCode).toBe(200);
      const result = JSON.parse(res.payload);
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('conversations');
      expect(Array.isArray(result.conversations)).toBe(true);
    });

    it('should handle service error and return 500', async () => {
      const assistantService = require('../src/services/assistant-chat-gateway.service');
      
      assistantService.assistantChatGatewayService.getHistory.mockRejectedValueOnce(
        new Error('Backend service error')
      );

      const res = await server.inject({
        method: 'GET',
        url: '/v1/llm/history/test-user-id',
        headers: { authorization: 'Bearer valid-token' }
      });

      expect(res.statusCode).toBe(500);
    });

    it('should handle 404 from backend and return 404', async () => {
      const assistantService = require('../src/services/assistant-chat-gateway.service');
      
      const notFoundError: any = new Error('Not found');
      notFoundError.response = { status: 404 };
      
      assistantService.assistantChatGatewayService.getHistory.mockRejectedValueOnce(
        notFoundError
      );

      const res = await server.inject({
        method: 'GET',
        url: '/v1/llm/history/test-user-id',
        headers: { authorization: 'Bearer valid-token' }
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
