import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  correlationId: string;
  message: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || randomUUID();
  }

  // Strategy Question 4: Ensure correlationId persists
  public getCorrelationId(): string {
    return this.correlationId;
  }

  public child(): Logger {
    return new Logger(this.correlationId);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (process.env.JSON_LOGS === 'true') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        correlationId: this.correlationId,
        message,
        context
      };
      console.log(JSON.stringify(entry));
    } else {
      const time = new Date().toISOString();
      const ctxStr = context ? JSON.stringify(context) : '';
      console.log(`[${time}] ${level.toUpperCase()} [${this.correlationId}]: ${message} ${ctxStr}`);
    }
  }

  public debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }
}
