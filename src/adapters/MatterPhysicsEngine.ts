import Matter from 'matter-js';
import { Vector2 } from '../core/physics/Vector2';
import { BodyConfig, CollisionEvent, IPhysicsBody, Team } from '../core/physics/types';
import { IPhysicsEngine } from '../core/physics/IPhysicsEngine';

/**
 * Physics body wrapper that implements IPhysicsBody using matter.js.
 */
class MatterBody implements IPhysicsBody {
  readonly id: string;
  readonly radius: number;
  readonly team: Team;
  readonly speed: number;
  readonly mass: number;
  active: boolean = true;

  private _matterBody: Matter.Body;
  private _targetPosition: Vector2 | null = null;

  constructor(config: BodyConfig, matterBody: Matter.Body) {
    this.id = config.id;
    this.radius = config.radius;
    this.team = config.team;
    this.speed = config.speed;
    this.mass = config.mass ?? 1;
    this._matterBody = matterBody;
  }

  get matterBody(): Matter.Body {
    return this._matterBody;
  }

  get position(): Vector2 {
    return new Vector2(this._matterBody.position.x, this._matterBody.position.y);
  }

  set position(value: Vector2) {
    Matter.Body.setPosition(this._matterBody, { x: value.x, y: value.y });
  }

  get velocity(): Vector2 {
    return new Vector2(this._matterBody.velocity.x, this._matterBody.velocity.y);
  }

  set velocity(value: Vector2) {
    Matter.Body.setVelocity(this._matterBody, { x: value.x, y: value.y });
  }

  get targetPosition(): Vector2 | null {
    return this._targetPosition;
  }

  setTarget(target: Vector2 | null): void {
    this._targetPosition = target;
  }
}

/**
 * Physics engine implementation backed by matter.js.
 * Provides the IPhysicsEngine interface for game logic while
 * leveraging matter.js for actual physics simulation.
 */
export class MatterPhysicsEngine implements IPhysicsEngine {
  private engine: Matter.Engine;
  private bodies: Map<string, MatterBody> = new Map();
  private collisionCallbacks: ((event: CollisionEvent) => void)[] = [];

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      this.handleCollisions(event.pairs);
    });
  }

  private handleCollisions(pairs: Matter.Pair[]): void {
    for (const pair of pairs) {
      const bodyA = this.findBodyByMatter(pair.bodyA);
      const bodyB = this.findBodyByMatter(pair.bodyB);

      if (bodyA && bodyB) {
        const overlap = pair.collision.depth;
        this.emitCollision({ bodyA, bodyB, overlap });
      }
    }
  }

  private findBodyByMatter(matterBody: Matter.Body): MatterBody | undefined {
    for (const body of this.bodies.values()) {
      if (body.matterBody === matterBody) {
        return body;
      }
    }
    return undefined;
  }

  private emitCollision(event: CollisionEvent): void {
    for (const callback of this.collisionCallbacks) {
      callback(event);
    }
  }

  createBody(config: BodyConfig): IPhysicsBody {
    const matterBody = Matter.Bodies.circle(config.position.x, config.position.y, config.radius, {
      label: config.id,
      frictionAir: 0.1,
      friction: 0.05,
      restitution: 0.2,
      mass: config.mass ?? 1,
    });

    Matter.Composite.add(this.engine.world, matterBody);

    const body = new MatterBody(config, matterBody);
    this.bodies.set(config.id, body);
    return body;
  }

  removeBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      Matter.Composite.remove(this.engine.world, body.matterBody);
      this.bodies.delete(id);
    }
  }

  getBody(id: string): IPhysicsBody | undefined {
    return this.bodies.get(id);
  }

  getAllBodies(): IPhysicsBody[] {
    return Array.from(this.bodies.values()).filter((b) => b.active);
  }

  getBodiesByTeam(team: Team): IPhysicsBody[] {
    return this.getAllBodies().filter((b) => b.team === team);
  }

  step(delta: number): void {
    // Update velocities toward targets
    for (const body of this.bodies.values()) {
      if (!body.active) continue;
      this.updateBodyMovement(body);
    }

    // Step the matter.js engine (expects milliseconds)
    Matter.Engine.update(this.engine, delta * 1000);
  }

  private updateBodyMovement(body: MatterBody): void {
    const target = body.targetPosition;
    if (!target) {
      Matter.Body.setVelocity(body.matterBody, { x: 0, y: 0 });
      return;
    }

    const direction = target.subtract(body.position);
    const distance = direction.magnitude();

    if (distance < 5) {
      Matter.Body.setVelocity(body.matterBody, { x: 0, y: 0 });
      return;
    }

    const velocity = direction.normalize().multiply(body.speed);
    Matter.Body.setVelocity(body.matterBody, { x: velocity.x, y: velocity.y });
  }

  getBodiesInRange(position: Vector2, range: number, excludeId?: string): IPhysicsBody[] {
    return this.getAllBodies().filter((body) => {
      if (excludeId && body.id === excludeId) return false;
      const effectiveRange = range + body.radius;
      const distSquared = body.position.distanceSquaredTo(position);
      return distSquared <= effectiveRange * effectiveRange;
    });
  }

  getNearestBody(position: Vector2, team?: Team, excludeId?: string): IPhysicsBody | undefined {
    let nearest: IPhysicsBody | undefined;
    let nearestDistSq = Infinity;

    for (const body of this.getAllBodies()) {
      if (excludeId && body.id === excludeId) continue;
      if (team && body.team !== team) continue;

      const distSq = body.position.distanceSquaredTo(position);
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = body;
      }
    }

    return nearest;
  }

  moveToward(body: IPhysicsBody, target: Vector2): void {
    const matterBody = this.bodies.get(body.id);
    if (matterBody) {
      matterBody.setTarget(target);
    }
  }

  stopMovement(body: IPhysicsBody): void {
    const matterBody = this.bodies.get(body.id);
    if (matterBody) {
      matterBody.setTarget(null);
      Matter.Body.setVelocity(matterBody.matterBody, { x: 0, y: 0 });
    }
  }

  onCollision(callback: (event: CollisionEvent) => void): void {
    this.collisionCallbacks.push(callback);
  }

  clear(): void {
    Matter.Composite.clear(this.engine.world, false);
    this.bodies.clear();
  }
}
