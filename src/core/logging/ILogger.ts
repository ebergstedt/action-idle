/**
 * Logger Interface
 *
 * Platform-agnostic logging interface for Godot portability.
 * Core modules should use this instead of console directly.
 *
 * Godot equivalent: Use print(), push_warning(), push_error()
 */

/**
 * Log level for filtering messages.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger interface for platform-agnostic logging.
 * Implementations can write to console, file, or custom handlers.
 */
export interface ILogger {
  /**
   * Log a debug message (verbose, development only).
   */
  debug(message: string, ...args: unknown[]): void;

  /**
   * Log an info message (general information).
   */
  info(message: string, ...args: unknown[]): void;

  /**
   * Log a warning message (non-critical issue).
   */
  warn(message: string, ...args: unknown[]): void;

  /**
   * Log an error message (critical issue).
   */
  error(message: string, ...args: unknown[]): void;
}
