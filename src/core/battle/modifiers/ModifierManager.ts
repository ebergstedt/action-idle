/**
 * Modifier Manager
 *
 * Manages temporary modifiers (buffs/debuffs) for battle entities.
 * Extracted from UnitEntity for reuse across different entity types.
 *
 * Godot equivalent: Component that can be attached to any Node2D.
 */

import { UnitTeam } from '../units/types';
import { ModifierRenderData } from '../types';
import { TemporaryModifier, PendingModifier } from './TemporaryModifier';

/**
 * Manages temporary modifiers for an entity.
 * Handles applying, ticking, queuing, and cleansing modifiers.
 */
export class ModifierManager {
  private activeModifiers: TemporaryModifier[] = [];
  private pendingModifiers: PendingModifier[] = [];
  private ownerTeam: UnitTeam;

  constructor(ownerTeam: UnitTeam) {
    this.ownerTeam = ownerTeam;
  }

  /**
   * Get all active modifiers.
   */
  getActiveModifiers(): readonly TemporaryModifier[] {
    return this.activeModifiers;
  }

  /**
   * Get all pending modifiers.
   */
  getPendingModifiers(): readonly PendingModifier[] {
    return this.pendingModifiers;
  }

  /**
   * Apply a modifier immediately.
   * If a modifier with the same sourceId exists, it refreshes the duration instead of stacking.
   */
  applyModifier(modifier: TemporaryModifier): void {
    // Check for existing modifier from same source
    const existing = this.activeModifiers.find((m) => m.sourceId === modifier.sourceId);
    if (existing) {
      // Refresh duration instead of stacking
      existing.remainingDuration = Math.max(existing.remainingDuration, modifier.remainingDuration);
      return;
    }
    this.activeModifiers.push(modifier);
  }

  /**
   * Queue a modifier to be applied after a delay.
   */
  queueModifier(modifier: TemporaryModifier, delay: number): void {
    this.pendingModifiers.push({ modifier, delay });
  }

  /**
   * Tick all active modifiers, removing expired ones.
   * Call this every frame.
   */
  tickActiveModifiers(delta: number): void {
    for (let i = this.activeModifiers.length - 1; i >= 0; i--) {
      this.activeModifiers[i].remainingDuration -= delta;
      if (this.activeModifiers[i].remainingDuration <= 0) {
        this.activeModifiers.splice(i, 1);
      }
    }
  }

  /**
   * Tick pending modifiers, applying those whose delay has expired.
   * Call this every frame.
   */
  tickPendingModifiers(delta: number): void {
    for (let i = this.pendingModifiers.length - 1; i >= 0; i--) {
      const pending = this.pendingModifiers[i];
      pending.delay -= delta;
      if (pending.delay <= 0) {
        this.applyModifier(pending.modifier);
        this.pendingModifiers.splice(i, 1);
      }
    }
  }

  /**
   * Tick all modifiers (convenience method that calls both tick functions).
   */
  tick(delta: number): void {
    this.tickActiveModifiers(delta);
    this.tickPendingModifiers(delta);
  }

  /**
   * Get movement speed multiplier from all active modifiers.
   * @returns Multiplier to apply to base moveSpeed (e.g., 0.5 = 50% of original)
   */
  getMoveSpeedMultiplier(): number {
    let mult = 1;
    for (const mod of this.activeModifiers) {
      mult *= 1 + mod.moveSpeedMod;
    }
    return Math.max(0, mult);
  }

  /**
   * Get damage multiplier from all active modifiers.
   * @returns Multiplier to apply to damage dealt (e.g., 0.5 = 50% damage)
   */
  getDamageMultiplier(): number {
    let mult = 1;
    for (const mod of this.activeModifiers) {
      mult *= 1 + mod.damageMod;
    }
    return Math.max(0, mult);
  }

  /**
   * Get collision size multiplier from all active modifiers.
   * @returns Multiplier to apply to collision box (e.g., 1.3 = 130% collision size)
   */
  getCollisionSizeMultiplier(): number {
    let mult = 1;
    for (const mod of this.activeModifiers) {
      mult *= 1 + mod.collisionSizeMod;
    }
    return Math.max(0.1, mult); // Minimum 10% size
  }

  /**
   * Check if a modifier from a specific source is active.
   */
  hasModifierFromSource(sourceId: string): boolean {
    return this.activeModifiers.some((m) => m.sourceId === sourceId);
  }

  /**
   * Clear all enemy debuffs (keeps friendly buffs).
   * A debuff is any modifier where sourceTeam differs from the owner's team.
   */
  clearEnemyDebuffs(): void {
    this.activeModifiers = this.activeModifiers.filter((m) => m.sourceTeam === this.ownerTeam);
    this.pendingModifiers = this.pendingModifiers.filter(
      (p) => p.modifier.sourceTeam === this.ownerTeam
    );
  }

  /**
   * Clear only pending modifiers.
   */
  clearPending(): void {
    this.pendingModifiers = [];
  }

  /**
   * Get render data for the active modifiers.
   */
  toRenderData(): ModifierRenderData[] {
    return this.activeModifiers.map((m) => ({
      id: m.id,
      sourceId: m.sourceId,
      remainingDuration: m.remainingDuration,
    }));
  }
}
