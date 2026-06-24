import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
  constructor() {
    super(AppLogger.name);
  }

  protected formatMessage(
    logLevel: 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal',
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const output = this.stringifyMessage(message, logLevel);
    pidMessage = this.colorize(pidMessage, logLevel);
    formattedLogLevel = this.colorize(formattedLogLevel, logLevel);
    return `${pidMessage}${formattedLogLevel} ${contextMessage}${output}${timestampDiff}\n`;
  }

  log(message: any, meta?: any) {
    super.log(this.buildMessage(message, meta));
  }

  error(message: any, trace?: string, meta?: any) {
    const normalized = this.normalizeErrorInput(message, trace, meta);
    super.error(this.stringifyValue(normalized));
  }

  warn(message: any, meta?: any) {
    super.warn(this.buildMessage(message, meta));
  }

  debug(message: any, meta?: any) {
    super.debug(this.buildMessage(message, meta));
  }

  verbose(message: any, meta?: any) {
    super.verbose(this.buildMessage(message, meta));
  }

  private buildMessage(message: any, meta?: any): string {
    if (meta === undefined) {
      return this.stringifyValue(message);
    }

    if (typeof message === 'string') {
      return `${message} ${this.stringifyValue(meta)}`;
    }

    return this.stringifyValue({
      message,
      meta,
    });
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private normalizeErrorInput(message: any, trace?: unknown, meta?: any) {
    const payload: Record<string, unknown> = {};

    if (typeof message === 'string') {
      payload.message = message;
    } else if (message instanceof Error) {
      payload.message = message.message;
      payload.errorName = message.name;
      payload.at = this.getStackPreview(message.stack);
    } else {
      payload.message = this.stringifyValue(message);
    }

    const traceData = this.extractTraceData(trace);
    if (traceData.errorName && !payload.errorName) {
      payload.errorName = traceData.errorName;
    }
    if (traceData.errorMessage && payload.message === 'Error') {
      payload.message = traceData.errorMessage;
    }
    if (traceData.errorMessage && typeof message === 'string') {
      payload.error = traceData.errorMessage;
    }
    if (traceData.at) {
      payload.at = traceData.at;
    }

    if (meta !== undefined) {
      payload.meta = meta;
    }

    return payload;
  }

  private extractTraceData(trace: unknown) {
    if (!trace) {
      return {};
    }

    if (trace instanceof Error) {
      return {
        errorName: trace.name,
        errorMessage: trace.message,
        at: this.getStackPreview(trace.stack),
      };
    }

    if (typeof trace !== 'string') {
      return {
        errorMessage: this.stringifyValue(trace),
      };
    }

    const normalizedTrace = trace.trim();
    if (!normalizedTrace) {
      return {};
    }

    const lines = normalizedTrace.split('\n').map((line) => line.trim());
    const firstLine = lines.find((line) => line.length > 0);
    const atLine = lines.find((line) => line.startsWith('at '));

    return {
      errorMessage: firstLine,
      at: atLine,
    };
  }

  private getStackPreview(stack?: string): string | undefined {
    if (!stack) {
      return undefined;
    }

    return stack
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('at '));
  }
}
