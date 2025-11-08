import * as dotenv from 'dotenv';
dotenv.config();


export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const HOST = process.env.HOST || 'localhost';
export const PORT = process.env.PORT || 3000;

// Variables de entorno
export const LLM_API_BASE_URL = process.env.LLM_API_BASE_URL || 'http://localhost:8080';

// Variables de autenticación Firebase Authentication
export const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;