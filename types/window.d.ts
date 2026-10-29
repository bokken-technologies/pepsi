declare module "bokken/window" {
    // Window dimensions in pixels.
    interface WindowSize {
        width: number;
        height: number;
    }

    // The window module: physical/logical size queries and the title bar.
    // Render resolution, resize notifications, and coordinate mapping live on
    // the renderer module, not here.
    interface Window {
        // Physical window framebuffer size in pixels: the raw output surface.
        // Under the "fixed" render policy this is typically larger than the
        // render size, since the composite letter/pillar-boxes the render
        // output into it. For placing sprites and game objects, use
        // Renderer.getRenderSize() instead.
        getSize(): WindowSize;

        // OS-reported logical size in pixels (pre-DPI). Mouse events arrive in
        // this space.
        getLogicalSize(): WindowSize;

        // Set the text shown in the window's title bar.
        setTitle(title: string): void;
    }

    const Window: Window;
    export default Window;
}
