import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as http from 'http';
import * as https from 'https';
import { LLM_API_BASE_URL } from '../utils/environment';
import { QuestionInput } from './models/agent.models';

export class AgentClient {
  private httpClient: AxiosInstance;

  constructor(baseURL: string = LLM_API_BASE_URL) {
    this.httpClient = axios.create({
      baseURL,
      timeout: 60000,
      // Configuraciones adicionales para streaming sin buffering
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
  }

  /**
   * Envía la pregunta al backend LLM y retorna un stream de texto/eventos.
   * Configurado para streaming en tiempo real.
   */
  async streamQuestion(input: QuestionInput, headers: Record<string, string>) {
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      responseType: 'stream',
      // Desactivar buffering para streaming en tiempo real
      decompress: false,
      // Timeout más largo para streams largos
      timeout: 120000,
      // Configuración específica para evitar buffering del HTTP Agent
      httpAgent: new http.Agent({
        keepAlive: true,
        // Evitar buffering a nivel de socket
        timeout: 0
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        // Evitar buffering a nivel de socket  
        timeout: 0
      })
    };

    return this.httpClient.post(`/v1/llm/stream/question`, input, config);
  }
}

export const agentClient = new AgentClient();