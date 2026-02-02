/**
 * Console Logger
 *
 * Browser/Node.js implementation of ILogger using console.
 * This is the platform-specific implementation for React.
 *
 * Godot equivalent: Create a GodotLogger that uses print()/push_warning()/push_error()
 */

import type { ILogger } from '../core/logging/ILogger';

/**
 * Logger implementation using browser/Node.js console.
 */
export class ConsoleLogger implements ILogger {
  private prefix: string;

  /**
   * Create a console logger.
   * @param prefix - Optional prefix for all messages (e.g., "[SaveManager]")
   */
  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  private formatMessage(message: string): string {
    return this.prefix ? `${this.prefix} ${message}` : message;
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(this.formatMessage(message), ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage(message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage(message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage(message), ...args);
  }
}

/**
 * Default console logger instance for general use.
 */
export const consoleLogger = new ConsoleLogger();
