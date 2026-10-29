// TODO: Redesign the engine module after the network module is complete.
// The current design is a bit of a mess, and the network module is a good example of how to do it better.

declare module "bokken/engine" {
    // Engine surface: timing primitives, frame stats, and the high-resolution
    // clock. None are JS globals; everything is reached through this module.
    interface Engine {
        // Engine version string, e.g. "1.0.0-alpha".
        readonly version: string;

        // Monotonic frame counter; bumps once per render tick, starting at 0
        // on the first frame after init.
        readonly frameCount: number;

        // Last frame's delta time in seconds, clamped at the engine level to
        // prevent physics blowups after a long pause (Loop's k_maxDeltaTime).
        readonly frameTime: number;

        // Total seconds since engine init; equal to now() / 1000.
        readonly elapsed: number;

        // High-resolution timestamp in milliseconds since engine init. Same
        // clock as the requestAnimationFrame timestamp and as elapsed * 1000.
        now(): number;

        // Run a callback once after at least delay milliseconds; a negative
        // or omitted delay fires on the next tick. Returns a clearTimeout id.
        setTimeout(callback: () => void, delay?: number): number;

        // Run a callback every period milliseconds until cleared; the first
        // fire is after one period, not immediately. Missed fires after a
        // hitch are skipped (browser semantics). Returns a clearInterval id.
        setInterval(callback: () => void, period?: number): number;

        // Cancel a pending setTimeout; no-op if it already fired.
        clearTimeout(id: number): void;

        // Cancel a setInterval; safe to call from inside the callback.
        clearInterval(id: number): void;

        // Run a callback on the next frame with the current timestamp. Calling
        // this from inside a callback schedules the next fire on the following
        // frame, supporting recursive loop(t) { rAF(loop) } patterns. Returns
        // a cancelAnimationFrame id.
        requestAnimationFrame(callback: (timestamp: number) => void): number;

        // Cancel a pending requestAnimationFrame.
        cancelAnimationFrame(id: number): void;

        // Run a callback at the end of the current task, before any other
        // macrotask (WHATWG queueMicrotask). No id and no cancel.
        queueMicrotask(callback: () => void): void;
    }

    const Engine: Engine;
    export default Engine;
}
