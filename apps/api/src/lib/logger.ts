type Level = 'info' | 'warn' | 'error';

function write(level: Level, message: string, details?: unknown): void {
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (details === undefined) {
    output(line);
  } else {
    output(line, details);
  }
}

/** Minimal timestamped logger (project rule: every log line has date and time). */
export const logger = {
  info: (message: string, details?: unknown) => {
    write('info', message, details);
  },
  warn: (message: string, details?: unknown) => {
    write('warn', message, details);
  },
  error: (message: string, details?: unknown) => {
    write('error', message, details);
  },
};
