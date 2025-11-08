import { Server, RequestApplicationState, ResponseObject } from "@hapi/hapi";
import {v4 as uuidv4, v4} from 'uuid';

export interface ContextRequestApplicationState extends RequestApplicationState {
    context: Context
}

export class Context {
    applicationId: string;
    transactionId: string;
}

const transactionIDHeader = "Transaction-ID"
const applicationIDHeader = "Application-ID"

export const contextServerMiddleware = (server: Server) => {
    server.ext({
        type: 'onRequest',
        method: (request, h) => {
            // Obtener los headers
            const headers = request.headers;

            const applicationId = headers[transactionIDHeader] || "";
            const transactionId = headers[applicationIDHeader] || uuidv4();

            // Crear un objeto de contexto y establecer los headers
            const context = {
                applicationId,
                transactionId
            };

            // Establecer el objeto de contexto en el objeto de solicitud
            (request.app as ContextRequestApplicationState).context = context;

            // Continuar con el ciclo de vida de la solicitud
            return h.continue;
        }
    });
};

export const responseHeadersMiddleware = (server: Server) => {
    server.ext('onPreResponse', (request, h) => {
        const ctx = (request.app as ContextRequestApplicationState).context
        const response = request.response as ResponseObject;
        if (response && response.header) {
            response.header(transactionIDHeader, ctx.transactionId);
            response.header(applicationIDHeader, ctx.applicationId);
        } else {
            console.log("No response header")
        }
        return h.continue;
    });
};