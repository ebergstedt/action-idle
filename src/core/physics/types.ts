import { Vector2 } from './Vector2';

export type Team = 'player' | 'enemy';

export interface BodyConfig {
  id: string;
  position: Vector2;
  radius: number;
  team: Team;
  speed: number;
  mass?: number;
}

export interface CollisionEvent {
  bodyA: IPhysicsBody;
  bodyB: IPhysicsBody;
  overlap: number;
}

export interface IPhysicsBody {
  readonly id: string;
  position: Vector2;
  velocity: Vector2;
  readonly radius: number;
  readonly team: Team;
  readonly speed: number;
  readonly mass: number;
  active: boolean;
}
