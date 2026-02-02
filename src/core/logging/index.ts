/**
 * Logging Module
 *
 * Platform-agnostic logging for Godot portability.
 * Core modules should depend on ILogger interface.
 */

export type { ILogger, LogLevel } from './ILogger';
export { NullLogger, nullLogger } from './NullLogger';
