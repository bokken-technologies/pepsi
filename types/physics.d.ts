declare module "bokken/physics" {
    import { Rigidbody2D } from "bokken/gameObject";

    // Opaque handle to a Box2D shape inside the physics world. Returned from
    // queries and embedded in raycast hits; there is no public API on it. The
    // engine frees it when the owning collider is destroyed, and the handle is
    // safe to store across frames while that collider lives.
    export interface ShapeHandle {
        readonly __shapeHandle: never;
    }

    // Result of a raycast or shape cast against the physics world.
    export interface RaycastHit {
        // The shape that was hit.
        shape: ShapeHandle;
        // Hit point in world pixels.
        point: Vector2D;
        // Surface normal at the hit point.
        normal: Vector2D;
        // Hit fraction along the cast in [0, 1].
        fraction: number;
    }

    // Joint type names returned by Joint.type; these match the factory names
    // on Physics.joints.
    export type JointType =
        | "distance"
        | "revolute"
        | "prismatic"
        | "weld"
        | "mouse"
        | "motor"
        | "wheel"
        | "filter"
        | "unknown";

    // Live handle to a constraint between two bodies (or one body and the
    // world, for mouse joints), returned from the Physics.joints.* factories.
    // Joints are destroyed automatically when either attached body is
    // destroyed, or explicitly via destroy(); once destroyed, isValid() is
    // false and motor/limit setters are no-ops. Not every type supports every
    // method (e.g. setMotorSpeed on a distance joint is ignored).
    export interface Joint {
        // The joint's type name.
        readonly type: JointType;

        // True while the joint exists in the world.
        isValid(): boolean;

        // Explicitly destroy the joint; safe to call repeatedly.
        destroy(): void;

        // Set angular motor speed in degrees/sec (revolute, wheel).
        setMotorSpeed(speedDegPerSec: number): void;

        // Set max motor torque (revolute, wheel).
        setMaxMotorTorque(torque: number): void;

        // Set max motor force (prismatic).
        setMaxMotorForce(force: number): void;

        // Toggle the motor (revolute, prismatic, wheel).
        enableMotor(enabled: boolean): void;

        // Toggle the joint limit (revolute, prismatic, wheel).
        enableLimit(enabled: boolean): void;

        // Set the lower/upper limit, in degrees (revolute) or pixels
        // (prismatic, wheel).
        setLimits(lower: number, upper: number): void;

        // Set the target position in world pixels (mouse joint only).
        setTarget(targetX: number, targetY: number): void;
    }

    // Joint parameter objects. All fields are optional; anchors and lengths
    // are world pixels, angles are degrees. Soft-constraint values (hertz,
    // dampingRatio) make a joint behave like a spring-damper; leave at the
    // defaults for a rigid constraint.

    export interface DistanceJointParams {
        anchorA?: Vector2D;
        anchorB?: Vector2D;
        // Target distance in pixels; negative uses the current pose.
        length?: number;
        // Lower-bound length in pixels; 0 disables the lower limit.
        minimumLength?: number;
        // Upper-bound length in pixels; negative means same as length (rigid).
        maximumLength?: number;
        collideConnected?: boolean;
        // Soft-constraint spring frequency in Hz; 0 is rigid.
        hertz?: number;
        dampingRatio?: number;
    }

    export interface RevoluteJointParams {
        // World-space pivot point in pixels.
        anchor?: Vector2D;
        collideConnected?: boolean;
        enableLimit?: boolean;
        // Lower/upper angle limits in degrees.
        lowerAngle?: number;
        upperAngle?: number;
        enableMotor?: boolean;
        // Motor speed in degrees/sec.
        motorSpeed?: number;
        maximumMotorTorque?: number;
        // Reference ("zero") angle in degrees.
        referenceAngle?: number;
    }

    export interface PrismaticJointParams {
        // World-space anchor in pixels.
        anchor?: Vector2D;
        // Translation axis; normalised internally, need not be unit-length.
        axis?: Vector2D;
        collideConnected?: boolean;
        enableLimit?: boolean;
        // Lower/upper translation limits in pixels.
        lowerTranslation?: number;
        upperTranslation?: number;
        enableMotor?: boolean;
        // Motor speed in pixels/sec.
        motorSpeed?: number;
        maximumMotorForce?: number;
        // Reference angle in degrees.
        referenceAngle?: number;
    }

    export interface WeldJointParams {
        anchor?: Vector2D;
        collideConnected?: boolean;
        // Linear soft-constraint frequency; 0 is rigid.
        linearHertz?: number;
        linearDampingRatio?: number;
        // Angular soft-constraint frequency; 0 is rigid.
        angularHertz?: number;
        angularDampingRatio?: number;
    }

    export interface MouseJointParams {
        // World-space target in pixels; update every frame to drag.
        target?: Vector2D;
        // Maximum pull force. Default 1000.
        maximumForce?: number;
        // Spring frequency. Default 5.
        hertz?: number;
        // Damping ratio. Default 0.7.
        dampingRatio?: number;
        collideConnected?: boolean;
    }

    export interface MotorJointParams {
        linearOffset?: Vector2D;
        angularOffset?: number;
        maximumForce?: number;
        maximumTorque?: number;
        correctionFactor?: number;
        collideConnected?: boolean;
    }

    export interface WheelJointParams {
        anchor?: Vector2D;
        // Suspension axis, perpendicular to the rolling direction.
        axis?: Vector2D;
        collideConnected?: boolean;
        enableLimit?: boolean;
        lowerTranslation?: number;
        upperTranslation?: number;
        enableMotor?: boolean;
        motorSpeed?: number;
        maximumMotorTorque?: number;
        // Suspension spring frequency. Default 1.
        hertz?: number;
        dampingRatio?: number;
    }

    // Factory functions for creating constraints between bodies. All take two
    // Rigidbody2D arguments (mouse takes one) and optional params, returning a
    // Joint or null if it could not be created (e.g. a body has no Box2D body
    // because it was created outside an active world).
    export interface JointFactories {
        // Keeps two anchor points a fixed distance apart; with hertz > 0 it
        // behaves like a spring rather than a rigid bar.
        distance(a: Rigidbody2D, b: Rigidbody2D, params?: DistanceJointParams): Joint | null;

        // Hinge between two bodies at a shared anchor; optional limits/motor.
        revolute(a: Rigidbody2D, b: Rigidbody2D, params?: RevoluteJointParams): Joint | null;

        // Bodies translate along a shared axis without relative rotation;
        // optional limits/motor.
        prismatic(a: Rigidbody2D, b: Rigidbody2D, params?: PrismaticJointParams): Joint | null;

        // Rigidly attaches two bodies; with linearHertz/angularHertz set it is
        // a soft weld with some give.
        weld(a: Rigidbody2D, b: Rigidbody2D, params?: WeldJointParams): Joint | null;

        // Drags a single body toward a target world point (click-and-drag);
        // update target via setTarget() each frame to follow the cursor.
        mouse(target: Rigidbody2D, params?: MouseJointParams): Joint | null;

        // Drives one body to maintain a relative offset from another; used for
        // AI or vehicle steering controllers.
        motor(a: Rigidbody2D, b: Rigidbody2D, params?: MotorJointParams): Joint | null;

        // Combines a prismatic suspension and revolute rolling joint,
        // parameterised for vehicle wheels.
        wheel(a: Rigidbody2D, b: Rigidbody2D, params?: WheelJointParams): Joint | null;

        // Disables collision between two specific bodies regardless of their
        // categoryBits/maskBits, without burning a category bit.
        filter(a: Rigidbody2D, b: Rigidbody2D): Joint | null;
    }

    // The physics module: world configuration plus the spatial-query and joint
    // surfaces. The world is a singleton, set up before any scripts run; every
    // function here operates on it.
    interface Physics {
        // Set the world gravity vector in pixels/sec².
        setGravity(x: number, y: number): void;

        // Current world gravity vector.
        getGravity(): Vector2D;

        // Set the meter-to-pixel ratio (default 30). Box2D is happiest when
        // typical objects are about 1 meter; this tells the engine how many
        // pixels make a Box2D meter, e.g. setMeter(1) for unit-based games.
        setMeter(pixelsPerMeter: number): void;

        // Current meter-to-pixel ratio.
        getMeter(): number;

        // Set physics sub-steps per fixed update (default 4). Higher trades CPU
        // for more stable contacts and tighter constraints.
        setSubSteps(steps: number): void;

        // Current sub-step count.
        getSubSteps(): number;

        // Cast a ray from the origin along a direction for up to maxDistance
        // pixels, returning every shape hit, sorted by fraction. mask filters
        // by categoryBits; omit to hit everything.
        raycast(
            originX: number, originY: number,
            directionX: number, directionY: number,
            maximumDistance: number,
            mask?: number,
        ): RaycastHit[];

        // Like raycast but returns only the closest hit, or null; cheaper when
        // only the first contact is needed.
        raycastNearest(
            originX: number, originY: number,
            directionX: number, directionY: number,
            maximumDistance: number,
            mask?: number,
        ): RaycastHit | null;

        // Every shape whose AABB overlaps the given pixel-space rectangle.
        overlapAABB(
            lowerX: number, lowerY: number,
            upperX: number, upperY: number,
            mask?: number,
        ): ShapeHandle[];

        // Every shape overlapping the given pixel-space circle.
        overlapCircle(
            centerX: number, centerY: number,
            radius: number,
            mask?: number,
        ): ShapeHandle[];

        // Sweep a circle along a translation and return the first shape hit (or
        // null); useful for thick raycasts and projectile leading-edge tests.
        circleCast(
            centerX: number, centerY: number,
            radius: number,
            translateX: number, translateY: number,
            mask?: number,
        ): RaycastHit | null;

        // Closest distance in pixels between two shapes; -1 if either handle is
        // invalid or the shape type is unsupported.
        distance(a: ShapeHandle, b: ShapeHandle): number;

        // Joint factories under Physics.joints.*.
        readonly joints: JointFactories;
    }

    const Physics: Physics;
    export default Physics;
}
