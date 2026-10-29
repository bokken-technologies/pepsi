declare module "bokken/audio" {
    // Common surface shared by every effect, built-in and custom. Effects are
    // mutable: assigning to a parameter takes effect on the next audio block.
    // enabled is the bypass toggle; when false the effect's process step is
    // skipped while the rest of the chain runs.
    interface Effect {
        // When false, the effect is skipped during processing. bypass() and
        // enable() are shorthand for setting this to false / true.
        enabled: boolean;

        // Set enabled = false.
        bypass(): void;

        // Set enabled = true.
        enable(): void;
    }

    // Linear master-gain stage. Values outside [0, ~10] clip on most output
    // paths but are not clamped by the engine.
    interface Gain extends Effect {
        gain: number;
    }

    // 2-pole resonant high-pass filter; thins a channel or removes sub-bass
    // rumble.
    interface HighPass extends Effect {
        // Corner frequency in Hz.
        cutoff: number;
        // Q factor; higher is a sharper resonant peak.
        resonance: number;
    }

    // 2-pole resonant low-pass filter; the "muffled" effect for occlusion or
    // underwater scenes.
    interface LowPass extends Effect {
        // Corner frequency in Hz.
        cutoff: number;
        // Q factor; higher is a sharper resonant peak.
        resonance: number;
    }

    // Single-band dynamic-range compressor. Squashes signal above threshold by
    // ratio:1; attack/release in milliseconds shape the reaction and recovery.
    interface Compressor extends Effect {
        // Threshold in dBFS, typically [-30, 0].
        threshold: number;
        // Compression ratio; 4 means 4:1 above threshold.
        ratio: number;
        // Attack time in milliseconds.
        attack: number;
        // Release time in milliseconds.
        release: number;
    }

    // Single-tap feedback delay. Small time with high feedback gives a
    // flange/slapback feel; larger time (>200 ms) gives a classic echo.
    interface Delay extends Effect {
        // Delay time in seconds.
        time: number;
        // Feedback in [0, 1]; values near 1 self-oscillate.
        feedback: number;
        // Wet mix in [0, 1]; 0 dry only, 1 wet only.
        wet: number;
    }

    // Soft-clip distortion / saturator. drive boosts the input before
    // clipping; tone shapes the post-clip brightness.
    interface Distortion extends Effect {
        // Pre-clip gain; 1 is unity, up to ~10 is typical.
        drive: number;
        // Post-clip tone in [0, 1].
        tone: number;
    }

    // Schroeder-style reverb suitable for rooms and small halls.
    interface Reverb extends Effect {
        // Decay time in seconds.
        decay: number;
        // Wet mix in [0, 1].
        wet: number;
    }

    // A custom effect registered from C++. Its parameters are determined at
    // registration time, so cast to a per-effect interface for type safety,
    // e.g. `Audio.createEffect("Wah", { rate: 7 }) as Wah | null`.
    interface CustomEffect extends Effect {
        [parameterName: string]: unknown;
    }

    // A named bus carrying summed voice output through an effect chain.
    // Channels are created with Audio.createChannel() and fetched with
    // Audio.channel(). Setters return the channel for fluent chaining.
    interface Channel {
        // The channel's name, set at createChannel(); immutable.
        readonly name: string;

        // Linear volume in [0, 1], updated via setVolume(). Values above 1 are
        // allowed but clip on the master output.
        readonly volume: number;

        // True if the channel is currently silenced.
        readonly muted: boolean;

        // Set linear volume; values outside [0, 1] are accepted but may clip.
        setVolume(volume: number): Channel;

        // Mute or unmute without altering volume.
        setMuted(muted: boolean): Channel;

        // Append an effect to the chain; the channel takes ownership, so no JS
        // reference is needed to keep it alive.
        addEffect(effect: Effect): Channel;

        // Remove a previously-added effect; no-op if not on this chain.
        removeEffect(effect: Effect): Channel;

        // Snapshot of the current chain in process order. Mutating the array
        // does not modify the channel; use addEffect / removeEffect.
        getEffects(): Effect[];
    }

    // Top-level audio module. Playback itself is component-driven via
    // AudioSource2D / AudioListener2D from bokken/gameObject; this module
    // covers busses, the built-in effect catalogue, and C++-registered custom
    // effects. The built-in effect constructors are named exports of this
    // module (e.g. `import { Reverb } from "bokken/audio"`), not properties of
    // the default export.
    interface Audio {
        // Get the master bus; always exists.
        master(): Channel;

        // Create a named bus (volume default 1.0, muted default false).
        // Subsequent channel(name) lookups return the same instance.
        createChannel(name: string, volume?: number, muted?: boolean): Channel;

        // Look up a channel by name; null if absent.
        channel(name: string): Channel | null;

        // Spawn an instance of a C++-registered custom effect by its
        // registration name, optionally overriding registered defaults. Null
        // if name isn't registered.
        createEffect(
            name: string,
            initialParameters?: Record<string, number>,
        ): CustomEffect | null;

        // Names of every C++-registered custom effect.
        listEffects(): string[];
    }

    const Audio: Audio;
    export default Audio;

    // The canonical name of the master bus.
    export const Master: "Master";

    // Built-in effect constructors. Each accepts optional initial parameters;
    // omitted values take engine defaults.
    export function Gain(gain?: number): Gain;
    export function HighPass(cutoff?: number, resonance?: number): HighPass;
    export function LowPass(cutoff?: number, resonance?: number): LowPass;
    export function Compressor(
        threshold?: number,
        ratio?: number,
        attack?: number,
        release?: number,
    ): Compressor;
    export function Delay(time?: number, feedback?: number, wet?: number): Delay;
    export function Distortion(drive?: number, tone?: number): Distortion;
    export function Reverb(decay?: number, wet?: number): Reverb;
}
