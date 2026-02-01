import { Vector2 } from './Vector2';
import { BodyConfig, CollisionEvent, IPhysicsBody, Team } from './types';

/**
 * Interface for physics engine implementations.
 * This abstraction allows the game to use different physics backends
 * (custom JS, matter.js, Godot physics, etc.) with minimal changes.
 */
export interface IPhysicsEngine {
  /**
   * Creates a new physics body and adds it to the simulation.
   */
  createBody(config: BodyConfig): IPhysicsBody;

  /**
   * Removes a body from the simulation.
   */
  removeBody(id: string): void;

  /**
   * Gets a body by its ID.
   */
  getBody(id: string): IPhysicsBody | undefined;

  /**
   * Gets all active bodies.
   */
  getAllBodies(): IPhysicsBody[];

  /**
   * Gets all bodies belonging to a team.
   */
  getBodiesByTeam(team: Team): IPhysicsBody[];

  /**
   * Steps the physics simulation forward.
   * @param delta - Time elapsed in seconds
   */
  step(delta: number): void;

  /**
   * Finds all bodies within range of a position.
   * @param position - Center point to search from
   * @param range - Maximum distance to search
   * @param excludeId - Optional body ID to exclude from results
   */
  getBodiesInRange(position: Vector2, range: number, excludeId?: string): IPhysicsBody[];

  /**
   * Finds the nearest body to a position, optionally filtering by team.
   */
  getNearestBody(position: Vector2, team?: Team, excludeId?: string): IPhysicsBody | undefined;

  /**
   * Commands a body to move toward a target position.
   * The body will use its configured speed.
   */
  moveToward(body: IPhysicsBody, target: Vector2): void;

  /**
   * Stops a body's movement.
   */
  stopMovement(body: IPhysicsBody): void;

  /**
   * Registers a callback for collision events.
   */
  onCollision(callback: (event: CollisionEvent) => void): void;

  /**
   * Clears all bodies from the simulation.
   */
  clear(): void;
}
