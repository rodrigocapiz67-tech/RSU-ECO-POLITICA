type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: unknown;
}

function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return { errorMessage: error.message, errorName: error.name, stack: error.stack };
  }
  return { errorMessage: String(error) };
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

/** Logger estructurado (JSON por línea) para que los logs sean parseables por herramientas externas. */
export const logger = {
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, error?: unknown, fields?: LogFields) =>
    write('error', message, { ...(error !== undefined ? serializeError(error) : {}), ...fields }),
};
