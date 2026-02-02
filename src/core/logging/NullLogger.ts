/**
 * Null Logger
 *
 * A no-op logger that silently discards all messages.
 * Use as a default when no logger is configured.
 *
 * Godot equivalent: Set logging disabled or use a null implementation.
 */

import { ILogger } from './ILogger';

/**
 * Null logger that discards all messages.
 * Thread-safe singleton pattern.
 */
export class NullLogger implements ILogger {
  private static instance: NullLogger | null = null;

  private constructor() {}

  static getInstance(): NullLogger {
    if (!NullLogger.instance) {
      NullLogger.instance = new NullLogger();
    }
    return NullLogger.instance;
  }

  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Get the singleton null logger instance.
 */
export const nullLogger = NullLogger.getInstance();
