/**
 * Simple 2D vector class for physics calculations.
 * Pure math, no dependencies - portable to Godot.
 */
export class Vector2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static from(v: { x: number; y: number }): Vector2 {
    return new Vector2(v.x, v.y);
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2 {
    if (scalar === 0) return Vector2.zero();
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return Vector2.zero();
    return this.divide(mag);
  }

  distanceTo(v: Vector2): number {
    return this.subtract(v).magnitude();
  }

  distanceSquaredTo(v: Vector2): number {
    return this.subtract(v).magnitudeSquared();
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  lerp(target: Vector2, t: number): Vector2 {
    return new Vector2(this.x + (target.x - this.x) * t, this.y + (target.y - this.y) * t);
  }

  equals(v: Vector2, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  toString(): string {
    return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
