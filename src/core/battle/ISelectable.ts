/**
 * Minimal interface for selectable/draggable entities.
 *
 * This interface contains only the fields needed for selection and drag logic.
 * It's platform-agnostic and avoids coupling core modules to render data types.
 *
 * Godot equivalent: Could be a base class or interface for selectable nodes.
 */

import { Vector2 } from '../physics/Vector2';
import type { UnitTeam } from './units/types';
import type { GridFootprint } from './grid/GridTypes';

/**
 * Minimal interface for entities that can be selected or dragged.
 * Used by SelectionManager, DragController, and BoxSelectController.
 */
export interface ISelectable {
  /** Unique identifier */
  id: string;
  /** Position in world space */
  position: Vector2;
  /** Size for hit detection and overlap */
  size: number;
  /** Unit type identifier (e.g., 'warrior', 'archer') */
  type: string;
  /** Team the entity belongs to */
  team: UnitTeam;
  /** Squad identifier for group selection */
  squadId: string;
  /** Grid footprint for deployment positioning */
  gridFootprint: GridFootprint;
}
