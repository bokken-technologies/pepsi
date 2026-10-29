declare module "bokken/renderer" {
    // Render size in pixels, returned by getRenderSize and passed to onResize
    // listeners.
    interface RenderSize {
        width: number;
        height: number;
    }

    // How the internal render resolution relates to the window size.
    //   "follow"      render at the window's physical pixel size; the scene
    //                 reveals more or less content as the window resizes.
    //   "fixed"       render into an offscreen target of a fixed design
    //                 resolution, then letter/pillar-box the composite into
    //                 the window; the visible scene is identical at any size.
    //   "fixedHeight" pin the vertical resolution and let the horizontal
    //                 resolution track the window aspect ratio.
    type RenderMode = "follow" | "fixed" | "fixedHeight";

    // Listener invoked when the render size changes, with the new size.
    type ResizeListener = (size: RenderSize) => void;

    // Built-in pipeline stage kinds accepted by pipeline.addStage(). Typical
    // install order: sprite, shadow, lighting, bloom, color-grade, composite.
    //   "sprite"      scene stage; clears and flushes the SpriteBatcher,
    //                 writing albedo/normal/emissive to the deferred targets.
    //   "shadow"      rasterises shadow-caster outlines into the per-light
    //                 shadow atlas; install after "sprite", before "lighting".
    //   "lighting"    accumulates Light2D contributions (tiled forward+, PCF
    //                 shadows, cookie sampling).
    //   "bloom"       bright-pass, Gaussian blur, additive composite.
    //   "color-grade" filmic tonemap, exposure, saturation, gamma.
    //   "distortion"  screen-space UV displacement (shockwaves, heat haze).
    //   "composite"   final passthrough to the default framebuffer.
    export type StageKind =
        | "sprite"
        | "shadow"
        | "lighting"
        | "bloom"
        | "color-grade"
        | "distortion"
        | "composite";

    // Texture filtering for loadTexture(). "nearest" preserves pixel art at
    // non-integer scales; "linear" smooths between texels (default for hi-res
    // art and atlases).
    export type TextureFilter = "linear" | "nearest";

    // Properties for the "sprite" (scene) stage.
    export interface SpriteStageProperties {
        // When false, the stage is skipped this frame.
        enabled?: boolean;
        // Scene-clear colour components in [0, 1].
        clearR?: number;
        clearG?: number;
        clearB?: number;
        clearA?: number;
    }

    // Properties for the "shadow" stage.
    export interface ShadowStageProperties {
        enabled?: boolean;
    }

    // Properties for the "lighting" stage. Ambient may be authored as a packed
    // 0xRRGGBBAA value (alpha ignored, LDR only) or as flat ambientR/G/B
    // scalars (required for HDR ambient > 1.0). When both are given, the
    // packed form applies first and the scalars override per channel.
    export interface LightingStageProperties {
        enabled?: boolean;
        // Global multiplier on every light's intensity. Default 1.0.
        intensityScale?: number;
        // Wrap-around in [0, 1]: 0 pure Lambertian N·L, 0.5 half-cosine wrap
        // (the atmospheric-2D default), 1.0 omnidirectional. Default 0.5.
        wrapAmount?: number;
        // Packed 0xRRGGBBAA ambient colour; alpha ignored. Use ambientR/G/B
        // for HDR ambient above 1.0 per channel.
        ambient?: number;
        // Per-channel ambient overrides. Defaults 0.05 / 0.05 / 0.06.
        ambientR?: number;
        ambientG?: number;
        ambientB?: number;
    }

    // Properties for the "bloom" stage.
    export interface BloomStageProperties {
        enabled?: boolean;
        // Brightness threshold; pixels above this contribute to bloom.
        threshold?: number;
        // Additive composite intensity at the final mix.
        intensity?: number;
        // Blur radius in pixels at the renderer's reference resolution.
        radius?: number;
    }

    // Properties for the "color-grade" stage.
    export interface ColorGradeStageProperties {
        enabled?: boolean;
        // Exposure compensation in stops; 1.0 is no change.
        exposure?: number;
        // Saturation multiplier; 0 greyscale, 1 identity.
        saturation?: number;
        // Output gamma; 2.2 approximates sRGB.
        gamma?: number;
    }

    // Properties for the "distortion" stage.
    export interface DistortionStageProperties {
        enabled?: boolean;
        // Master displacement multiplier.
        intensity?: number;
        // When true, a continuous heat-haze field layers on top of shockwaves.
        heatHaze?: boolean;
        // Heat-haze noise scroll speed.
        heatHazeSpeed?: number;
        // Heat-haze noise spatial frequency.
        heatHazeFrequency?: number;
        // Heat-haze peak displacement.
        heatHazeAmplitude?: number;
    }

    // Properties for the "composite" stage.
    export interface CompositeStageProperties {
        enabled?: boolean;
    }

    export type StageProperties =
        | SpriteStageProperties
        | ShadowStageProperties
        | LightingStageProperties
        | BloomStageProperties
        | ColorGradeStageProperties
        | DistortionStageProperties
        | CompositeStageProperties;

    // Parameters for a shockwave fired via Renderer.addShockwave().
    export interface ShockwaveParams {
        // Expansion rate of the ring in UV/sec.
        speed?: number;
        // Width of the distortion band.
        thickness?: number;
        // Peak displacement strength.
        amplitude?: number;
        // Auto-remove threshold; the wave is discarded past this radius.
        maxRadius?: number;
    }

    // Parameters for Renderer.defineGrid() sprite-sheet slicing.
    export interface DefineGridParams {
        // Frames to extract; 0 or omitted fills the available space.
        count?: number;
        // Pixel offset from the texture's top-left.
        offsetX?: number;
        offsetY?: number;
        // Gap between frames in pixels.
        paddingX?: number;
        paddingY?: number;
    }

    // The render pipeline: an ordered list of stages with methods to add,
    // remove, reorder, toggle, and reconfigure them at runtime. Stages are
    // identified by name (not kind), so multiple stages of the same kind can
    // coexist under different names.
    export interface Pipeline {
        // Add a built-in stage. kind is the stage type, name is a unique
        // instance name used by every other Pipeline method, props are
        // optional initial values. Returns false if name is taken or kind is
        // unknown.
        addStage(kind: StageKind, name: string, props?: StageProperties): boolean;

        // Remove a stage by name; false if no such stage.
        removeStage(name: string): boolean;

        // Move a stage to a new 0-based position; out-of-range indices clamp.
        // False if no such stage.
        moveStage(name: string, index: number): boolean;

        // Toggle a stage's enabled flag in place, keeping its render targets
        // and parameter state. False if no such stage.
        setEnabled(name: string, enabled: boolean): boolean;

        // Apply property updates to a stage; only present fields are written.
        // False if no such stage or props don't match the stage kind.
        configure(name: string, props: StageProperties): boolean;

        // Names of every installed stage in pipeline order.
        list(): string[];
    }

    // The renderer module: render-size policy, resize notifications, pipeline
    // configuration, and a thin texture/grid asset surface.
    interface RendererModule {
        // The render pipeline; see Pipeline for the per-stage API.
        readonly pipeline: Pipeline;

        // The resolution the pipeline draws into: the coordinate space sprites,
        // meshes, lights, and particles live in. Under "follow" it matches the
        // window; under "fixed"/"fixedHeight" it stays stable as the window
        // resizes.
        getRenderSize(): RenderSize;

        // Current render-size policy; see RenderMode.
        getRenderMode(): RenderMode;

        // Switch the render-size policy. width/height pin the design resolution
        // ("fixed") or the vertical resolution ("fixedHeight"), and are ignored
        // for "follow"; mode defaults to "fixed". Returns false for invalid
        // (non-positive) dimensions. The change is staged immediately and
        // committed at the next frame, when onResize listeners fire.
        setRenderSize(width: number, height: number, mode?: RenderMode): boolean;

        // Subscribe to render-size changes (not raw window resizes). Callbacks
        // receive the new render size and fire from inside the render step, so
        // layout changes made in the handler land on the same frame's draw but
        // are not visible to that frame's onUpdate. A handler registered before
        // the first frame fires once during warm-up with the initial size.
        // Returns an id for offResize; the same function registered twice gets
        // two distinct ids.
        onResize(callback: ResizeListener): number;

        // Unregister a listener by id; true if one was removed.
        offResize(id: number): boolean;

        // Eagerly load a texture from the asset pack into the GPU texture
        // cache. Textures load lazily on first draw anyway; this pre-warms at
        // level load to avoid mid-frame hitches. False if the path doesn't
        // resolve or the image fails to decode.
        loadTexture(path: string, filter?: TextureFilter): boolean;

        // Define a named sub-region of a texture, referenced by Sprite2D's
        // regionName. False if the texture path can't be resolved.
        defineRegion(
            name: string,
            texPath: string,
            x: number,
            y: number,
            w: number,
            h: number,
        ): boolean;

        // Carve a grid of equal regions out of a texture, each registered as
        // <prefix>_<index> counting left-to-right, top-to-bottom from zero.
        // Returns the number of regions defined, which may be fewer than
        // params.count if the grid exceeds the texture bounds.
        defineGrid(
            prefix: string,
            texPath: string,
            frameW: number,
            frameH: number,
            params?: DefineGridParams,
        ): number;

        // Fire a shockwave into the distortion stage at world pixel (x, y). The
        // distortion stage must be installed for any visible effect. False if
        // no distortion stage is present.
        addShockwave(x: number, y: number, params?: ShockwaveParams): boolean;

        // Remove every active shockwave from the distortion stage.
        clearShockwaves(): void;
    }

    const Renderer: RendererModule;
    export default Renderer;
}
