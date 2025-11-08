import { pino } from 'pino';
import { pinoCaller } from 'pino-caller';
import moment from 'moment';
import { Context } from '../middleware/context';
import path from 'path';
import { LOG_LEVEL } from './environment';

const options = {
  level: LOG_LEVEL,
  timestamp: () => `,"time":"${moment().format('DD-MM-YYYY HH:mm:ss.SSS')}"`,
  minLength: 4096,
  sync: false,
  formatters: {
    level: (label: any) => ({ level: label }),
    log: (obj: any) => {
      const callerInfo = obj.caller.split(path.sep).pop();
      const callerParts = callerInfo.split(':');
      const file = callerParts[0];
      const line = callerParts[1];
      return {
        ...obj,
        caller: `${file}:${line}`,
        system: 'assistant-chat-gateway'
      };
    }
  }
};

const logger = pinoCaller(pino(options));

export const getLogger = (ctx: Context) => {
  return logger.child({ transactionId: ctx.transactionId }).child({ applicationId: ctx.applicationId });
}