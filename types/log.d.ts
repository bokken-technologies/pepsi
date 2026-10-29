declare module "bokken/log" {
    // Variadic logging API. Each severity accepts any number of arguments of
    // any type: primitives are stringified, objects and arrays via
    // JSON.stringify, errors via toString. Arguments are joined with spaces
    // and routed to the C++ SDL logger.
    interface Log {
        // Detailed diagnostic info; routed to SDL_LogDebug.
        debug(...args: unknown[]): void;

        // Normal application flow; routed to SDL_LogInfo.
        info(...args: unknown[]): void;

        // Non-critical issues; routed to SDL_LogWarn.
        warning(...args: unknown[]): void;

        // Critical failures; routed to SDL_LogError.
        error(...args: unknown[]): void;
    }

    const Log: Log;
    export default Log;
}
