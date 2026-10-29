import type { Align } from "bokken/canvas";

declare module "bokken/gameObject" {
    // Primitive shapes for 2D rendering via Mesh2D.
    export enum Shape2D {
        Empty = "Empty",
        Quad = "Quad",
        Circle = "Circle",
        Triangle = "Triangle",
        Line = "Line",
    }

    // Blend mode for quads, sprites, and particles.
    export enum BlendMode {
        // Standard porter-duff over: src*srcA + dst*(1-srcA).
        Alpha = "Alpha",
        // Brightens what's behind (src*srcA + dst); fire, explosions, magic.
        Additive = "Additive",
        // Subtler than additive (1 - (1-src)*(1-dst)); soft glows.
        Screen = "Screen",
    }

    // Loop behaviour for animation clips.
    export enum AnimationLoopMode {
        // Play once then stop on the final frame.
        None = "None",
        // Restart at frame 0 after the final frame.
        Loop = "Loop",
        // Play forward, then reverse, indefinitely.
        PingPong = "PingPong",
    }

    // Light source type for Light2D.
    //   Point       omnidirectional; range + falloff define brightness, no
    //               direction or cone fields apply.
    //   Spot        directional cone; uses directionDegrees and the inner/outer
    //               cone angles in addition to range and falloff.
    //   Directional infinitely-distant parallel light (sun, moon); uses
    //               directionDegrees only and ignores position/range/falloff/
    //               cone, contributing to every screen tile.
    export enum LightType {
        Point = "Point",
        Spot = "Spot",
        Directional = "Directional",
    }

    // Animation envelope kind for Light2D. Flicker/Pulse/Strobe modulate in
    // [1 - amplitude, 1] (the authored intensity is the peak; the modulator
    // only dims). Use Custom for waveforms that should exceed that ceiling.
    //   Constant no modulation; the light burns at the authored intensity.
    //   Flicker  1D value noise (candles, torches); envelopeFrequency drives
    //            the jitter rate.
    //   Pulse    sinusoidal swing (heartbeats, magic orbs); frequency in Hz.
    //   Strobe   smoothed square wave (alarms); starts "on" at t=0.
    //   Custom   engine leaves intensityModulator alone; scripts write it each
    //            frame, allowing over-bright peaks (e.g. lightning).
    export enum LightEnvelope {
        Constant = "Constant",
        Flicker = "Flicker",
        Pulse = "Pulse",
        Strobe = "Strobe",
        Custom = "Custom",
    }

    // Describes a grid region of a sprite sheet for automatic frame slicing.
    // Passed as the frames field of an animation clip when the engine should
    // carve frames out of the Sprite2D's texture.
    export interface AnimationFrameGrid {
        // Per-clip texture path; overrides the Sprite2D's source.
        source?: string;
        // Size of each frame in pixels.
        frameWidth: number;
        frameHeight: number;
        // Frames to extract; 0 or omitted fills the available space.
        count?: number;
        // Pixel offset from the texture's top-left.
        offsetX?: number;
        offsetY?: number;
        // Gap between frames in pixels.
        paddingX?: number;
        paddingY?: number;
    }

    // Defines a single named animation clip. frames is either an array of
    // TextureCache region-name strings (explicit) or an AnimationFrameGrid that
    // auto-slices the sibling Sprite2D's texture into a uniform grid.
    export interface AnimationClipDefinition {
        // Unique clip name, e.g. "idle", "run", "jump".
        name: string;
        // Frame source: explicit region names or an auto-slice grid.
        frames: string[] | AnimationFrameGrid;
        // Playback speed in frames per second. Default 12.
        framesPerSecond?: number;
        // Loop behaviour. Default Loop.
        loop?: AnimationLoopMode;
    }

    // Base for every functional unit attached to a GameObject. Concrete
    // components extend Component directly (data-only, like Transform2D) or
    // Behaviour (script callbacks, like onUpdate).
    export abstract class Component {
        // The GameObject this component is attached to.
        readonly gameObject: GameObject;
        // When false, the component's per-frame work (rendering, physics,
        // scripted updates) is skipped without destroying it; re-enable by
        // setting true. Default true.
        public enabled: boolean;
    }

    // Defines the viewport and projection for 2D rendering. Exactly one
    // Camera2D renders per frame: the first with isActive true that the scene
    // walk encounters. The owning Transform2D's position centres the view and
    // its rotation rotates the view counter-clockwise.
    export class Camera2D extends Component {
        // View magnification; 1 is unity, >1 zooms in, <1 zooms out. Combines
        // with the owning Transform2D's scale.
        public zoom: number;

        // When true, this is the camera the renderer uses; only one Camera2D
        // should set this at a time.
        public isActive: boolean;

        // Convert a screen-space point to a world-space point through this
        // camera. Returns the world position.
        screenToWorldPoint(x: number, y: number): { x: number; y: number };

        // Convert a world-space point to a screen-space point through this
        // camera. Returns the screen position.
        worldToScreenPoint(x: number, y: number): { x: number; y: number };
    }

    // CPU-side 2D particle emitter. Spawns particles at the owning
    // Transform2D's position, simulates them each frame, and submits coloured
    // quads to the SpriteBatcher.
    export class ParticleEmitter2D extends Component {
        // When true, spawn new particles at emitRate; false stops emission but
        // lets already-spawned particles finish their lifetimes.
        public emitting: boolean;

        // New particles per second.
        public emitRate: number;

        // Bounds of a particle's lifetime in seconds.
        public lifetimeMinimum: number;
        public lifetimeMaximum: number;

        // Bounds of a particle's launch speed in pixels/sec.
        public speedMinimum: number;
        public speedMaximum: number;

        // Pixel size at spawn.
        public sizeStart: number;
        // Pixel size at end-of-life, interpolated by sizeEase.
        public sizeEnd: number;
        // Random size jitter applied to sizeStart at spawn.
        public sizeStartVariance: number;
        // Easing exponent for the size-over-lifetime curve; 1 linear, >1 holds
        // the start size longer, <1 reaches the end size sooner.
        public sizeEase: number;

        // Spread of launch directions in degrees around direction; 0 fires all
        // particles the same way, 360 fires omnidirectionally.
        public spreadAngle: number;
        // Centre of the launch cone in degrees (0 = +X, 90 = +Y).
        public direction: number;

        // Constant downward acceleration in pixels/sec².
        public gravity: number;
        // Per-second velocity damping in [0, 1]; 0 none, 1 stops instantly.
        public damping: number;

        // Bounds of angular velocity in degrees/sec.
        public angularVelocityMinimum: number;
        public angularVelocityMaximum: number;

        // Offset from the emitter origin at spawn.
        public spawnOffsetX: number;
        public spawnOffsetY: number;

        // When true, launch speed scales with the owning rigidbody's speed
        // relative to velocityReferenceSpeed (e.g. jet trails that intensify
        // with vehicle speed).
        public velocityScaleEmission: boolean;
        // Reference speed at which the velocity-scaled emission factor is 1;
        // higher speeds scale linearly.
        public velocityReferenceSpeed: number;

        // Packed 0xRRGGBBAA colour at spawn and at end-of-life.
        public colorStart: number;
        public colorEnd: number;
        // Easing exponent for the alpha fade-out; 1 linear, higher holds
        // opacity longer before fading.
        public alphaEase: number;

        // Submission z-order; higher draws on top within the same sprite stage.
        public zOrder: number;
        // Hard cap on simultaneously-alive particles; new spawns drop once hit.
        public maximumParticles: number;

        // Blend mode for all particles in this emitter.
        public blendMode: BlendMode;

        // Emit count particles now, ignoring the emitRate clock; useful for
        // one-shots like an explosion or damage hit.
        burst(count: number): void;
    }

    // 2D spatial transform: position, rotation (z-axis), scale, and draw order.
    // Carries no visual state; attach a Mesh2D or Sprite2D for that. When a
    // sibling Rigidbody2D exists, prefer writing pose through the rigidbody
    // (positionX/Y, rotation, setVelocity) since direct transform writes are
    // overwritten by the physics step on the next fixed update.
    export class Transform2D extends Component {
        // Local position in world pixels.
        public positionX: number;
        public positionY: number;
        // Rotation in degrees around the z-axis, counter-clockwise.
        public rotation: number;
        // Scale multipliers; 1 is identity.
        public scaleX: number;
        public scaleY: number;
        // Submission z-order; higher draws on top within the same sprite stage.
        public zOrder: number;

        // Move the transform by an offset in one native call; faster than two
        // separate positionX/positionY writes.
        translate(positionX: number, positionY: number): void;

        // Rotate by the given degrees, counter-clockwise.
        rotate(degrees: number): void;
    }

    // Visual representation using solid-colour primitives, separated from
    // Transform2D so invisible objects (triggers, spawners) carry no render
    // state. Use Sprite2D for textured rendering; when both exist on the same
    // GameObject, Sprite2D takes priority.
    export class Mesh2D extends Component {
        // Primitive shape to render.
        public shape: Shape2D;
        // Packed 0xRRGGBBAA fill colour.
        public color: number;
        // Flip around the anchor.
        public flipX: boolean;
        public flipY: boolean;
    }

    // Visual representation using a texture or atlas region. Draws a textured
    // quad from the TextureCache; the texture loads lazily on first use, so
    // just set source to a virtual asset-pack path. When used with
    // Animation2D the controller writes regionName each frame. Takes priority
    // over Mesh2D when both are present.
    export class Sprite2D extends Component {
        // Path to the texture in the asset-pack VFS, e.g.
        // "/textures/player.png".
        public source: string;
        // Named region within the texture; empty string uses the full texture.
        public regionName: string;
        // Tint multiplied with the texture sample, packed 0xRRGGBBAA.
        public tint: number;
        // Overall opacity, multiplied into tint alpha at draw time.
        public opacity: number;
        public flipX: boolean;
        public flipY: boolean;
        // Override draw size in pixels; 0 uses the source region's size.
        public overrideWidth: number;
        public overrideHeight: number;
        // Anchor in [0, 1]; 0.5 is centre (default).
        public anchorX: number;
        public anchorY: number;
        // Blend mode for this sprite.
        public blendMode: BlendMode;
    }

    // In-world text label attached to a game object. Reads the world position
    // from the sibling Transform2D, offsets it, and projects it through the
    // active camera each frame — so the label follows its owner (nameplates,
    // floating damage numbers, world-space UI callouts, etc).
    export class Text2D extends Component {
        // The string to render.
        public text: string;
        // AssetPack-relative path to a .ttf font. Empty uses the engine default.
        public font: string = "fonts/default.ttf";
        // Point size. In world-space mode this is scaled by the camera's zoom;
        // in screen-space mode it's a fixed on-screen size.
        public fontSize: number;
        // Extra spacing added between glyphs, in the same units as fontSize.
        public letterSpacing: number;
        // Line spacing multiplier for wrapped/multi-line text. 1.0 is normal.
        public lineHeight: number;
        // World-space offset added to the owner's position before projecting
        // to screen — e.g. {0, 1} floats the label above the object's origin.
        public offsetX: number;
        public offsetY: number;
        // Packed 0xRRGGBBAA color.
        public color: number;
        // Multiplies the color's alpha. 1.0 is fully opaque.
        public opacity: number;
        // Horizontal alignment of the text relative to its anchor point.
        public align: Align;
        // Enables wrapping into multiple lines at maxWidth.
        public wordWrap: boolean;
        // Content width to wrap into when wordWrap is true. Same worldSpace
        // scaling convention as fontSize.
        public maxWidth: number;
        // If true, fontSize and maxWidth are world units scaled by the
        // camera's zoom, so the text shrinks/grows with the scene. If false,
        // they're fixed screen pixels and only the anchor point follows the
        // world position (billboarded).
        public worldSpace: boolean;
        // Toggles rendering without detaching the component.
        public visible: boolean;
    }

    // Sprite-sheet animation controller. Holds named clips and drives the
    // active clip's frame counter, writing the current frame's region name into
    // the sibling Sprite2D each tick. Requires a Sprite2D on the same
    // GameObject.
    export class Animation2D extends Component {
        // Whether the current clip is actively advancing frames.
        readonly isPlaying: boolean;
        // The name of the currently active clip.
        readonly activeClip: string;
        // The current frame index within the active clip.
        readonly frameIndex: number;
        // The TextureCache region name of the current frame.
        readonly currentRegion: string;

        // Add or replace an animation clip; returns this for chaining.
        addClip(clip: AnimationClipDefinition): this;

        // Start playing a clip from the beginning.
        play(clipName: string): void;
        // Pause on the current frame.
        pause(): void;
        // Resume from where it was paused.
        resume(): void;
        // Stop and reset to the first frame.
        stop(): void;
    }

    // Screen-space distortion effect attached to a game object. Reads the world
    // position from the sibling Transform2D, converts to normalised screen
    // coordinates via the active camera, and pushes shockwaves into the
    // distortion stage of the render pipeline.
    export class Distortion2D extends Component {
        // Expansion rate of the shockwave ring in UV/sec.
        public speed: number;
        // Width of the distortion band.
        public thickness: number;
        // Peak displacement strength.
        public amplitude: number;
        // Auto-remove threshold; the wave is discarded past this radius.
        public maximumRadius: number;
        // If true, a shockwave fires automatically when the component attaches.
        public autoStart: boolean;

        // Fire a shockwave from the current world position; each call makes an
        // independent wave, so it's safe to call repeatedly.
        trigger(): void;
    }

    // A 2D light source. Contributes per-pixel lighting in the lighting pass,
    // optionally casting shadows when castsShadows is true and a shadow stage
    // is installed; position is read from the sibling Transform2D each frame.
    // Point attenuates with distance over range, Spot is a cone using
    // directionDegrees and cone angles, Directional is parallel light like the
    // sun. Optional layers: animation envelopes modulate intensityModulator,
    // shadow casting writes occluder distance sampled with PCF, and cookies
    // project an image onto the light. Lights are CPU-binned into 16x16 tiles
    // each frame; hard caps are 256 lights, 256 shadow-casting lights, 32
    // unique cookies, 32 lights per tile.
    export class Light2D extends Component {
        // Light source kind; see LightType.
        public type: LightType;

        // Packed 0xRRGGBBAA colour, matching Mesh2D.color. The alpha byte is
        // ignored on write and reads back as 0xFF. For HDR colours above 1.0
        // per channel, set colorR/G/B individually; reading color is lossy
        // since HDR values are clamped to [0, 1] first.
        public color: number;

        // Linear-RGB channels; HDR values above 1 are valid.
        public colorR: number;
        public colorG: number;
        public colorB: number;

        // Scalar multiplier on color. Envelopes modulate intensityModulator
        // without changing this; to fade a light, write intensity directly.
        public intensity: number;

        // Pixel radius at which falloff reaches zero; ignored for directional.
        public range: number;

        // Falloff exponent; 1 linear, 2 quadratic (physically accurate
        // inverse-square), higher sharpens the falloff edge.
        public falloff: number;

        // Spot cone half-angles in degrees: full intensity inside inner, then
        // smoothstep falloff between inner and outer.
        public innerConeAngle: number;
        public outerConeAngle: number;

        // Direction for spot/directional lights in degrees (0 = +X, 90 = +Y).
        // For directional lights this is the travel direction.
        public directionDegrees: number;

        // Whether this light writes to the shadow atlas; requires a shadow
        // stage. Slots are assigned per-frame; lights beyond the cap (256)
        // render unshadowed that frame.
        public castsShadows: boolean;

        // PCF kernel radius multiplier for this light's shadow sampling; 1 is
        // the renderer default, larger softens the edge, smaller sharpens it,
        // 0 is effectively hard shadows. Nominal range [0, ~5].
        public shadowSoftness: number;

        // Animation envelope driving intensityModulator each frame (except
        // Custom, which is script-driven); see LightEnvelope.
        public envelope: LightEnvelope;
        // Envelope swing in [0, 1]; 0 no swing, 1 full swing.
        public envelopeAmplitude: number;
        // Envelope cycle rate in Hz.
        public envelopeFrequency: number;
        // Envelope phase offset in seconds; use to desync identical lights.
        public envelopePhase: number;

        // Per-frame intensity modulator written by the envelope, multiplied
        // with intensity at upload. Custom envelopes write this directly each
        // frame. Nominally [0, 1]; engine envelopes never exceed 1.0.
        public intensityModulator: number;

        // Path to the cookie/gobo image in the asset-pack VFS; empty string is
        // no cookie. Loaded lazily into a slot-based atlas (up to 32 unique,
        // FIFO eviction). Sampled in light-relative world space: the light's
        // position is the cookie centre (UV 0.5, 0.5), its range the edges.
        public cookiePath: string;
        // Cookie UV offset; animate over time for scrolling cookies.
        public cookieUVOffsetX: number;
        public cookieUVOffsetY: number;
        // Cookie UV scale; values >1 tile the cookie within the slot.
        public cookieUVScaleX: number;
        public cookieUVScaleY: number;

        // Reset the envelope's phase clock to zero, so e.g. an alarm starts at
        // a known point. No-op for Constant and Custom envelopes.
        resetEnvelope(): void;
    }

    // An explicit polygonal occluder for the 2D lighting system. Attach
    // alongside a Transform2D to make the owning GameObject cast shadows. The
    // outline is local-space pixel vertices, projected to world space each
    // frame. Vertices are relative to the anchor ((0,0) is the anchor), wound
    // counterclockwise in screen space (top-left origin; reversed winding
    // inverts shadows), implicitly closed (don't repeat the first vertex), and
    // need not be convex.
    export class ShadowCaster2D extends Component {
        // Global switch; false skips this caster without removing it (e.g.
        // lights-off cutscenes or an occluder that conditionally appears).
        public castsShadow: boolean;

        // Per-caster softness multiplier. Currently inert: plumbed through the
        // renderer but unused, since sampling uses per-light softness. Reserved
        // for a future per-caster softness path.
        public softness: number;

        // Polygon outline in local-space pixels. Reading returns a fresh copy;
        // mutate and re-assign to update. Entries with non-numeric x/y are
        // dropped so partial data can't corrupt the buffer.
        public outline: { x: number; y: number }[];
    }

    // Tangent-space normal map for the sibling Sprite2D, giving the lighting
    // pass per-pixel normals so flat sprites pick up directional shading.
    // Either point normalMapPath at an authored map, or set autoGenerate to
    // derive one from the sprite's luminance at load time.
    export class NormalMap2D extends Component {
        // Path to the normal map in the asset-pack VFS; ignored when
        // autoGenerate is true.
        public normalMapPath: string;

        // When true, generate a normal map from the sibling Sprite2D's
        // luminance gradient; cheaper than authoring one but flatter, so use
        // autoStrength to compensate.
        public autoGenerate: boolean;

        // Strength multiplier for the auto-generated map; 1 identity, higher
        // exaggerates surface relief.
        public autoStrength: number;

        // Discard the cached normal-map texture and regenerate from source next
        // frame; useful after swapping the sibling Sprite2D's texture.
        invalidate(): void;
    }

    // Plays a sound at the owning GameObject's position, routed through a named
    // audio channel from bokken/audio. Spatial sources attenuate with distance
    // from the active AudioListener2D; non-spatial sources play at uniform
    // volume across the scene.
    export class AudioSource2D extends Component {
        // Asset-pack path to the audio clip.
        public clip: string;
        // Channel name from bokken/audio to route through; "Master" is always
        // valid.
        public channel: string;
        // Linear playback volume in [0, 1].
        public volume: number;
        // Pitch/speed multiplier; 1 native, 2 octave up, 0.5 octave down.
        public pitch: number;
        // When true, the clip restarts as soon as it finishes.
        public loop: boolean;
        // When true, the clip starts as soon as the component attaches.
        public autoPlay: boolean;
        // When true, the source is panned and attenuated by the active
        // listener's position; when false it plays at uniform volume.
        public spatial: boolean;
        // Distance (pixels) below which the source plays at full volume; only
        // relevant when spatial is true.
        public minimumDistance: number;
        // Distance (pixels) at which the source becomes silent and is culled.
        public maximumDistance: number;
        // Falloff exponent for spatial attenuation; 1 linear, 2 inverse-square.
        public rolloff: number;
        // When true, the source's velocity (derived frame-over-frame from its
        // Transform2D) drives a Doppler shift relative to the listener.
        public doppler: boolean;

        // True while the source is producing audio.
        public readonly isPlaying: boolean;

        // Begin playback from the start.
        play(): void;
        // Stop playback; with fadeOutSeconds > 0, ramp to silence first.
        stop(fadeOutSeconds?: number): void;
        // Pause at the current position.
        pause(): void;
        // Resume from the pause point.
        resume(): void;
        // Fire a one-shot voice in parallel with current playback. It doesn't
        // loop, can't be paused, and is culled when it finishes.
        playOneShot(clipOverride?: string): void;
        // Fire a one-shot at an arbitrary world position regardless of the
        // owning GameObject's position (e.g. an explosion at a map point).
        playOneShotAt(
            positionX: number,
            positionY: number,
            clipOverride?: string,
        ): void;
    }

    // Marks a GameObject as the "ear" of the audio scene. Spatial
    // AudioSource2D voices are panned and attenuated relative to the listener's
    // Transform2D position. There should be exactly one active listener; with
    // more than one, the first in scene order wins.
    export class AudioListener2D extends Component {
        // Master gain applied to the listener's mix.
        public gain: number;
    }

    // Body type controlling how a rigidbody participates in the simulation.
    //   static    never moves, infinite mass (walls, floors).
    //   dynamic   fully simulated; forces, gravity, contacts all apply.
    //   kinematic scripted motion; unaffected by forces/contacts but still
    //             pushes dynamic bodies it touches.
    export type Rigidbody2DType = "static" | "dynamic" | "kinematic";

    // Couples a GameObject to the Box2D physics world. Reads/writes the sibling
    // Transform2D's pose each fixed update, so direct transform writes get
    // overwritten by the next physics step. Colliders on the same GameObject
    // provide the shape; without one the body has no contact surface.
    export class Rigidbody2D extends Component {
        // Body type; see Rigidbody2DType.
        public type: Rigidbody2DType;
        // When true, the body never rotates regardless of torque or contacts;
        // useful for always-upright bodies like player characters.
        public fixedRotation: boolean;
        // When true, Box2D uses continuous collision detection for this body,
        // preventing fast projectiles from tunneling thin walls at a CPU cost.
        public isBullet: boolean;
        // Per-second linear and angular velocity damping.
        public linearDamping: number;
        public angularDamping: number;
        // Multiplier on world gravity for this body; 0 floats, 1 full gravity,
        // -1 floats upward.
        public gravityScale: number;
        // When true, the solver may sleep the body when it stops moving;
        // sleeping bodies cost no CPU until touched.
        public allowSleep: boolean;

        // World-space position in pixels.
        public positionX: number;
        public positionY: number;
        // Rotation in degrees, counter-clockwise.
        public rotation: number;
        // Linear velocity components in pixels/sec.
        public velocityX: number;
        public velocityY: number;
        // Angular velocity in degrees/sec.
        public angularVelocity: number;
        // When true, the body is being simulated; sleeping bodies read false,
        // touching one wakes it, and writing true forces a wake-up.
        public awake: boolean;

        // Total mass in Box2D units, derived from collider density.
        readonly mass: number;
        // Moment of inertia in Box2D units.
        readonly inertia: number;

        // Apply a continuous force in world space at a world point; with the
        // point omitted, force is applied at the centre of mass (no torque).
        applyForce(
            forceX: number, forceY: number,
            pointX?: number, pointY?: number,
        ): void;

        // Apply a continuous force at the centre of mass; like applyForce with
        // the point omitted, but cheaper.
        applyForceToCenter(forceX: number, forceY: number): void;

        // Apply a continuous torque around the centre of mass.
        applyTorque(torque: number): void;

        // Apply an instantaneous velocity change (impulse) at a world point;
        // with the point omitted, at the centre of mass.
        applyImpulse(
            impulseX: number, impulseY: number,
            pointX?: number, pointY?: number,
        ): void;

        // Apply an instantaneous velocity change at the centre of mass.
        applyImpulseToCenter(impulseX: number, impulseY: number): void;

        // Apply an instantaneous change in angular velocity.
        applyAngularImpulse(impulse: number): void;

        // Overwrite the linear velocity in one native call; faster than two
        // separate velocityX/velocityY writes.
        setVelocity(velocityX: number, velocityY: number): void;
    }

    // Information about a contact between two bodies, passed to onCollisionEnter
    // callbacks.
    export interface ContactInfo {
        // Contact point in world pixels (the first manifold point).
        point: { x: number; y: number };
        // Surface normal at the contact point.
        normal: { x: number; y: number };
        // Number of manifold points (1 or 2 for 2D).
        pointCount: number;
    }

    // Information about the moment two bodies impact, passed to onCollisionHit
    // callbacks. Unlike ContactInfo it fires once at impact (not continuously
    // while in contact) and includes the approach speed for damage/pitch.
    export interface HitInfo {
        // Impact point in world pixels.
        point: { x: number; y: number };
        // Surface normal at the impact point.
        normal: { x: number; y: number };
        // Approach speed along the contact normal in pixels/sec; drive impact
        // volume or damage from this.
        approachSpeed: number;
    }

    // Base class for every 2D collider. Colliders provide the shape a
    // Rigidbody2D uses for contacts; a collider with no rigidbody is an
    // implicit static body, one with a rigidbody follows its type. The five
    // collision callbacks fire on the owning Behaviour if present and are also
    // exposed here as assignable properties for non-Behaviour scripts; both
    // routes fire, so assign carefully to avoid double-handling.
    export abstract class Collider2D extends Component {
        // Mass per unit area; combines with shape area to set rigidbody mass.
        public density: number;
        // Coulomb friction; 0 frictionless, 1 very grippy. Contact friction is
        // the geometric mean of the two colliders'.
        public friction: number;
        // Bounciness in [0, 1]; 0 no bounce, 1 perfectly elastic.
        public restitution: number;
        // Surface tangent speed in pixels/sec; applied as if the surface were a
        // conveyor belt moving along its local tangent.
        public tangentSpeed: number;
        // When true, the collider is a trigger: fires sensor callbacks on
        // overlap but generates no contacts or impulses.
        public isSensor: boolean;
        // Bitmask of categories this collider belongs to; combines with
        // maskBits for contact filtering.
        public categoryBits: number;
        // Bitmask of categories this collider collides with; a contact occurs
        // iff (a.categoryBits & b.maskBits) != 0 in both directions.
        public maskBits: number;
        // Group index for short-circuit filtering: positive groups always
        // collide with themselves, negative never, zero defers to
        // categoryBits/maskBits.
        public groupIndex: number;

        // Fires the frame two colliders first make contact; contact carries the
        // first manifold point.
        public onCollisionEnter:
            | ((other: GameObject, contact: ContactInfo) => void)
            | null;

        // Fires the frame two colliders separate; other may be null if the
        // other body was destroyed during separation.
        public onCollisionExit:
            | ((other: GameObject | null) => void)
            | null;

        // Fires once at a real impact (not ongoing contact); hit carries the
        // approach speed for damage/audio.
        public onCollisionHit:
            | ((other: GameObject, hit: HitInfo) => void)
            | null;

        // Trigger equivalent of onCollisionEnter; fires when isSensor is true
        // and another collider begins overlapping.
        public onSensorEnter:
            | ((other: GameObject | null) => void)
            | null;

        // Trigger equivalent of onCollisionExit; fires when the overlap ends.
        public onSensorExit:
            | ((other: GameObject | null) => void)
            | null;
    }

    // Axis-aligned (then rotated) rectangle collider.
    export class BoxCollider2D extends Collider2D {
        // Size in pixels.
        public sizeX: number;
        public sizeY: number;
        // Local offset from the GameObject's transform.
        public offsetX: number;
        public offsetY: number;
        // Rotation in degrees around the box's local centre; composes with
        // Transform2D.rotation.
        public angle: number;
    }

    // Circle collider with optional local offset.
    export class CircleCollider2D extends Collider2D {
        // Radius in pixels.
        public radius: number;
        // Local offset from the GameObject's transform.
        public offsetX: number;
        public offsetY: number;
    }

    // Capsule collider: a swept circle between two endpoints; good for
    // character controllers (rounded ends, no corner snags).
    export class CapsuleCollider2D extends Collider2D {
        // Endpoints in local pixels.
        public pointAX: number;
        public pointAY: number;
        public pointBX: number;
        public pointBY: number;
        // Radius of the swept circle in pixels.
        public radius: number;
    }

    // Convex polygon collider. Box2D requires convex polygons with at most 8
    // vertices; split concave shapes across multiple PolygonCollider2D
    // instances or model them with a ChainCollider2D.
    export class PolygonCollider2D extends Collider2D {
        // Vertices in local pixel space, as {x, y} objects or [x, y] tuples.
        public points: { x: number; y: number }[] | [number, number][];
    }

    // Single-edge collider; two points define a segment the body collides
    // against from either side, or one side when oneSided is true.
    export class EdgeCollider2D extends Collider2D {
        // Endpoints in local pixels.
        public pointAX: number;
        public pointAY: number;
        public pointBX: number;
        public pointBY: number;
        // When true, collisions register only from the edge's left-hand side
        // (relative to A→B); useful for one-way platforms.
        public oneSided: boolean;
    }

    // Chain collider: a sequence of connected edges, for static world geometry
    // (terrain outlines, level borders); cheaper than many EdgeCollider2D.
    export class ChainCollider2D extends Collider2D {
        // Vertices in local pixel space, as {x, y} objects or [x, y] tuples.
        public points: { x: number; y: number }[] | [number, number][];
        // When true, the chain is closed (last point connects to the first);
        // otherwise it's open.
        public loop: boolean;
    }

    // Base class for scripted gameplay logic. Subclass and override the
    // lifecycle hooks to react to engine events; all hooks are optional and
    // only the ones implemented get wired up.
    export abstract class Behaviour extends Component {
        // Called once, the frame after the component is attached.
        onStart?(): void;
        // Called every frame with the variable delta time; for input,
        // animation, anything that should run at display refresh rate.
        onUpdate?(deltaTime: number): void;
        // Called every physics tick at a fixed delta (typically 1/50 s); for
        // physics logic like applying forces or reading velocities.
        onFixedUpdate?(deltaTime: number): void;
        // Called once, immediately before the component or its GameObject is
        // destroyed.
        onDestroy?(): void;
        // Same payload as Collider2D.onCollisionEnter, invoked on this
        // Behaviour for every sibling collider's contacts.
        onCollisionEnter?(other: GameObject, contact: ContactInfo): void;
        // See Collider2D.onCollisionExit.
        onCollisionExit?(other: GameObject | null): void;
        // See Collider2D.onCollisionHit.
        onCollisionHit?(other: GameObject, hit: HitInfo): void;
        // See Collider2D.onSensorEnter.
        onSensorEnter?(other: GameObject | null): void;
        // See Collider2D.onSensorExit.
        onSensorExit?(other: GameObject | null): void;
    }

    // Property shape accepted by addComponent: strips method names from the
    // component's surface so authors set only data fields at construction.
    type ComponentProperties<T> = {
        [K in keyof T as T[K] extends (...args: any[]) => any
        ? never
        : K]?: T[K];
    };

    // Optional properties accepted by the GameObject constructor.
    export interface GameObjectProperties {
        // When true, the GameObject is destroyed automatically once all of its
        // components finish (e.g. a one-shot emitter whose particles have died,
        // an AudioSource2D that finished playing). Default false.
        destroyWhenIdle?: boolean;
    }

    // The fundamental unit of scene composition: a name plus a flat bag of
    // components plus a parent/children tree. Behaviour comes from the
    // components; a GameObject by itself does nothing. Construction uses chained
    // addComponent calls.
    export class GameObject {
        constructor(name?: string, properties?: GameObjectProperties);

        // Display name, used by GameObject.find().
        public name: string;

        // See GameObjectProperties.destroyWhenIdle.
        public destroyWhenIdle: boolean;

        // Attach a component with optional initial property values; returns this
        // for fluent chaining.
        addComponent<T extends Component>(
            componentClass: new () => T,
            properties?: ComponentProperties<T>,
        ): this;

        // The first component of the given type on this GameObject, or undefined.
        getComponent<T extends Component>(
            componentClass: new () => T,
        ): T | undefined;

        // Reparent this GameObject; null detaches it to a top-level child of the
        // scene root. Children follow their parent's transform.
        setParent(parent: GameObject | null): void;

        // A snapshot of this GameObject's direct children.
        getChildren(): GameObject[];

        // Destroy a GameObject and all of its components and children, firing
        // onDestroy on every Behaviour touched. References become invalid
        // afterward and calling methods on them is a no-op.
        static destroy(obj: GameObject): void;

        // The first GameObject with the given name anywhere in the active scene,
        // or undefined if none matches.
        static find(name: string): GameObject | undefined;
    }
}
