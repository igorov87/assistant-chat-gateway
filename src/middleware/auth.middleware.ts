import { Request, ResponseToolkit } from '@hapi/hapi';
import * as admin from 'firebase-admin';
import * as Boom from '@hapi/boom';
import { GOOGLE_PROJECT_ID } from '../utils/environment';
import { getLogger } from '../utils/logger';
import { Context, ContextRequestApplicationState } from './context';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}

export interface AuthenticatedRequestApplicationState extends ContextRequestApplicationState {
  user: AuthenticatedUser;
}

export class FirebaseAuthMiddleware {
  private firebaseApp: admin.app.App;

  constructor() {
    if (!GOOGLE_PROJECT_ID) {
      throw new Error('GOOGLE_PROJECT_ID is required for authentication');
    }

    // Inicializar Firebase Admin SDK
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        projectId: GOOGLE_PROJECT_ID,
      });
    } else {
      this.firebaseApp = admin.app();
    }
  }

  /**
   * Valida token JWT de Firebase Authentication usando Firebase Admin SDK
   * @param ctx - Contexto de la aplicación para trazabilidad
   * @param token - Token Bearer sin el prefijo "Bearer "
   * @returns Datos del usuario autenticado
   * @throws Error si el token es inválido
   */
  async validateToken(ctx: Context, token: string): Promise<AuthenticatedUser> {
    getLogger(ctx).debug('Validando token de Firebase Authentication con Admin SDK');
    getLogger(ctx).debug('Token recibido', { tokenLength: token.length, tokenPrefix: token.substring(0, 20) + '...' });

    try {
      // Verificar el token ID usando Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      getLogger(ctx).debug('Token validado correctamente', { 
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        iss: decodedToken.iss,
        aud: decodedToken.aud,
        auth_time: decodedToken.auth_time,
        exp: decodedToken.exp
      });

      // Extraer información del usuario
      const user: AuthenticatedUser = {
        sub: decodedToken.uid,
        email: decodedToken.email!,
        name: decodedToken.name,
        email_verified: decodedToken.email_verified
      };

      getLogger(ctx).info(`Usuario autenticado exitosamente: ${user.email}`, { 
        userId: user.sub,
        authTime: decodedToken.auth_time,
        expiration: decodedToken.exp
      });
      
      return user;

    } catch (error: any) {
      getLogger(ctx).error(`Error validando token de Firebase: ${error.code || 'unknown'} - ${error.message}`, {
        errorCode: error.code,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      
      // Mapear errores específicos de Firebase
      if (error.code === 'auth/id-token-expired') {
        throw new Error('Token expired');
      } else if (error.code === 'auth/id-token-revoked') {
        throw new Error('Token revoked');
      } else if (error.code === 'auth/invalid-id-token') {
        throw new Error('Invalid token format');
      } else {
        throw new Error('Invalid Firebase ID token');
      }
    }
  }
}

// Instancia singleton del middleware
const firebaseAuthMiddleware = new FirebaseAuthMiddleware();

/**
 * Middleware de Hapi para validar tokens de Firebase Authentication
 */
export const validateFirebaseToken = async (request: Request, h: ResponseToolkit) => {
  const ctx = (request.app as ContextRequestApplicationState).context;
  
  try {
    // Extraer token del header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      getLogger(ctx).warn('Missing or invalid Authorization header');
      throw Boom.unauthorized('Missing or invalid Authorization header', 'Bearer');
    }

    const token = authHeader.substring(7); // Remover "Bearer "
    getLogger(ctx).debug('Token', { token });
    
    // Validar el token con Firebase
    const user = await firebaseAuthMiddleware.validateToken(ctx, token);
    
    // Agregar información del usuario al request
    (request.app as AuthenticatedRequestApplicationState).user = user;
    
    return h.continue;
    
  } catch (error: any) {
    getLogger(ctx).warn('Firebase authentication failed', { error: error.message });
    
    if (error.isBoom) {
      throw error;
    }
    
    throw Boom.unauthorized('Invalid Firebase token', 'Bearer');
  }
};

/**
 * Función helper para obtener el usuario autenticado desde el request
 */
export const getAuthenticatedUser = (request: Request): AuthenticatedUser => {
  return (request.app as AuthenticatedRequestApplicationState).user;
};
