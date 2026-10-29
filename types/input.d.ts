declare module "bokken/input" {
    // Button identifier: 0 primary (left), 1 middle (wheel), 2
    // secondary (right). Higher indices are platform-dependent side-buttons.
    enum Button {
        Left = 0,
        Middle = 1,
        Right = 2,
        X1 = 3,
        X2 = 4,
    }

    // Keyboard and mouse polling API. State updates once per frame at the top
    // of the tick: the Pressed/Released queries return true for exactly the
    // one frame the transition was observed, while the Down queries are level
    // triggers that stay true for the whole hold.
    interface Input {
        // True while the key is held. Key names are case-sensitive and accept
        // either web-standard ("KeyW", "ArrowUp", "Space") or SDL short form
        // ("W", "Up", "F1").
        isKeyDown(key: string): boolean;

        // True only on the frame the key transitioned from up to down; use for
        // fire-once actions like jump or dash.
        isKeyPressed(key: string): boolean;

        // True only on the frame the key transitioned from down to up.
        isKeyReleased(key: string): boolean;

        // Current mouse position in OS-logical window coordinates (the space
        // SDL mouse events arrive in). Map to render space with
        // Renderer.windowToRender() before hit-testing scene objects.
        getMousePosition(): Vector2D;

        // True while the mouse button is held. See Button for the index
        // mapping.
        isMouseDown(button: Button): boolean;

        // True only on the frame the button transitioned from up to down; use
        // for click semantics.
        isMousePressed(button: Button): boolean;

        // True only on the frame the button transitioned from down to up.
        isMouseReleased(button: Button): boolean;

        // Scroll-wheel delta accumulated this frame: y is the vertical wheel,
        // x the horizontal wheel on mice/trackpads that have one. No scroll
        // input returns { x: 0, y: 0 }.
        getScrollDelta(): Vector2D;
    }

    const Input: Input;
    export default Input;
}
