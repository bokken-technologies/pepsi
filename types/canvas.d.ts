declare module "bokken/canvas" {
    // Cross-axis alignment values shared by alignItems and alignSelf.
    export enum Align {
        Start = "Start",
        Center = "Center",
        End = "End",
    }

    // Cross-axis alignment of all children of a flex container. Stretch grows
    // each child to fill the container's cross axis.
    export enum AlignItems {
        Start = "Start",
        Center = "Center",
        End = "End",
        Stretch = "Stretch",
    }

    // Per-child override of the parent's alignItems. Inherit (the default)
    // means use the parent's alignItems.
    export enum AlignSelf {
        Inherit = "Inherit",
        Start = "Start",
        Center = "Center",
        End = "End",
        Stretch = "Stretch",
    }

    // Main-axis distribution of children inside a flex container. The space
    // modes follow standard CSS semantics: SpaceBetween puts equal gaps
    // between items with no leading/trailing, SpaceAround uses half-size
    // leading/trailing margins, SpaceEvenly uses equal leading/trailing
    // margins matching the inter-item gaps.
    export enum Justify {
        Start = "Start",
        Center = "Center",
        End = "End",
        SpaceBetween = "SpaceBetween",
        SpaceAround = "SpaceAround",
        SpaceEvenly = "SpaceEvenly",
    }

    // Easing curves for transition animations.
    export enum Timing {
        Linear = "Linear",
        EaseIn = "EaseIn",
        EaseOut = "EaseOut",
        EaseInOut = "EaseInOut",
        Bounce = "Bounce",
        Back = "Back",
        Step = "Step",
    }

    // Direction in which child elements are placed in a container.
    export enum FlexDirection {
        Row = "Row",
        Column = "Column",
    }

    // Positioning strategy for calculating element coordinates.
    export enum Position {
        Relative = "Relative",
        Absolute = "Absolute",
    }

    // How an element handles content that exceeds its boundaries.
    export enum Overflow {
        Visible = "Visible",
        Hidden = "Hidden",
    }

    // Horizontal alignment of text inside a Label's content box.
    export enum TextAlign {
        Left = "Left",
        Center = "Center",
        Right = "Right",
        Justify = "Justify",
    }

    // Pointer style shown when the cursor is over a node. Canvas lazily
    // allocates SDL system cursors and swaps them when the deepest hovered
    // node's cursor differs from the previous frame's.
    export enum Cursor {
        Default = "Default",
        Pointer = "Pointer",
        Text = "Text",
        Move = "Move",
        NotAllowed = "NotAllowed",
        Wait = "Wait",
        ResizeNS = "ResizeNS",
        ResizeEW = "ResizeEW",
        Crosshair = "Crosshair",
    }

    // Internal element shape produced by createElement (JSX factory output).
    // Scripts rarely touch this directly; they author trees as JSX and pass
    // them to Canvas.render.
    export interface CanvasElement {
        type: string | ((properties: Record<string, unknown>) => CanvasNode);
        properties: Record<string, unknown>;
        key?: string | number | null;
    }

    // Values accepted as children and as the root of Canvas.render. Strings
    // and numbers render as text; null/boolean render nothing (handy for
    // conditional rendering); arrays render their members in order.
    export type CanvasNode =
        | string
        | number
        | boolean
        | null
        | undefined
        | CanvasElement
        | readonly CanvasNode[];

    // A pixel value or a percentage string like "50%", accepted by the sizing
    // properties. Position fields (top/bottom/left/right) do NOT accept
    // percentages, since the native parser routes those through a plain-float
    // path; compute pixel offsets in JS for percent-relative positioning.
    export type Dimension = number | `${number}%`;

    // Simple Style Sheet (SSS) properties passed to the native layout engine.
    // Colours use the 0xRRGGBBAA hex format. Sizing fields accept a number
    // (pixels) or a percentage string; every other numeric field is plain
    // pixels. A colour field whose alpha byte is 0 is treated as "not set" and
    // falls through to the base colour, which is how hover overrides work
    // without forcing a base colour to be specified.
    export interface SSSProperties {
        // Layout and flexbox.
        flexDirection?: FlexDirection;
        // Grow factor along the main axis; 0 is no grow.
        flex?: number;
        // Shrink factor under tight space; 0 is no shrink.
        flexShrink?: number;
        // Starting size before flex distribution.
        flexBasis?: number;
        // When true, children break onto new main-axis lines.
        flexWrap?: boolean;
        // gap sets both axes; rowGap/columnGap override the wrap and main axis
        // separately, matching CSS.
        gap?: number;
        rowGap?: number;
        columnGap?: number;

        padding?: number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;

        margin?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;

        // Positioning.
        position?: Position;
        // Distances from the parent's edges, in pixels. Position fields don't
        // accept percent strings; compute pixel offsets in JS if needed.
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        zIndex?: number;

        // Sizing. width/height and the clamps accept pixels or percent.
        width?: Dimension;
        height?: Dimension;
        minimumWidth?: Dimension;
        maximumWidth?: Dimension;
        minimumHeight?: Dimension;
        maximumHeight?: Dimension;

        // Text.
        font?: string;
        fontSize?: number;
        // Line-height multiplier (1.4 = 140% of the font's natural height).
        lineHeight?: number;
        // Extra advance between glyphs, in pixels.
        letterSpacing?: number;
        // When true and width is fixed, text wraps on whitespace.
        wordWrap?: boolean;
        // Use the bold/italic variant of the active font.
        fontBold?: boolean;
        fontItalic?: boolean;
        // Horizontal alignment of text inside a Label.
        textAlign?: TextAlign;

        // Visuals.
        backgroundColor?: number;
        color?: number;
        opacity?: number;

        // Uniform corner radius; per-corner values override it.
        borderRadius?: number;
        borderTopLeftRadius?: number;
        borderTopRightRadius?: number;
        borderBottomLeftRadius?: number;
        borderBottomRightRadius?: number;

        // Uniform border width/colour; per-side values override these.
        borderWidth?: number;
        borderColor?: number;
        borderTopWidth?: number;
        borderBottomWidth?: number;
        borderLeftWidth?: number;
        borderRightWidth?: number;
        borderTopColor?: number;
        borderBottomColor?: number;
        borderLeftColor?: number;
        borderRightColor?: number;

        // Two-stop linear gradient background fill. When either stop has
        // non-zero alpha the gradient takes precedence over backgroundColor.
        // The angle is in degrees and snaps to the nearest cardinal
        // (0/90/180/270) for batch efficiency; diagonals are unsupported.
        gradientStart?: number;
        gradientEnd?: number;
        gradientAngle?: number;

        // Asset-pack path to a background image, drawn under backgroundColor.
        // For Image components use the source prop instead; this is for View
        // backgrounds.
        backgroundImage?: string;

        // Drop shadow, rendered when alpha is non-zero and any of blur/offset
        // is non-zero. The blur uses a soft 9-slice LUT baked at 32px radius;
        // larger blurs clip rather than scale.
        shadowColor?: number;
        shadowOffsetX?: number;
        shadowOffsetY?: number;
        shadowBlur?: number;

        overflow?: Overflow;

        // Transform. translate is in pixels, applied after layout.
        translateX?: number;
        translateY?: number;
        // Rotation in radians around the centre, honoured only on solid-rect
        // views with no border radius.
        rotation?: number;
        // Scale around the centre; composes with hover/active animation.
        scaleX?: number;
        scaleY?: number;

        // Cross-axis alignment of children. AlignItems adds Stretch; the Align
        // enum still works since the underlying string values match.
        alignItems?: AlignItems | Align;
        // Per-child override of the parent's alignItems.
        alignSelf?: AlignSelf;
        // Main-axis distribution. Justify adds the space modes; the Align enum
        // still works for Start/Center/End.
        justifyContent?: Justify | Align;

        // Animation and interaction.
        transitionDuration?: number;
        transitionTiming?: Timing;
        hoverScale?: number;
        activeScale?: number;
        // Foreground colour when hovered; alpha 0 falls through to color.
        hoverColor?: number;
        // Background colour when hovered.
        hoverBackgroundColor?: number;
        // Background colour while pressed.
        activeBackgroundColor?: number;

        // Pointer style shown over this node.
        cursor?: Cursor;
        // Tab order: -1 not focusable; 0 (the default for Button and TextInput)
        // joins traversal in document order; positive values are visited first
        // in ascending order, then the 0s, as on the web.
        tabIndex?: number;
        // When true the node renders at half opacity, doesn't fire onClick, and
        // skips focus traversal.
        disabled?: boolean;
        // TextInput-only: enable the bottom-right drag grip for runtime resize.
        resize?: boolean;
    }

    // Shared properties for all visual Canvas components.
    export interface BaseProperties {
        style?: SSSProperties;
        children?: CanvasNode;
        // Stable identity for keyed list reconciliation.
        key?: string | number;

        // Fires once when the cursor first enters this node.
        onMouseEnter?: () => void;
        // Fires once when the cursor leaves this node.
        onMouseLeave?: () => void;
        // Fires when this node gains focus (via click or Tab).
        onFocus?: () => void;
        // Fires when this node loses focus.
        onBlur?: () => void;
        // Fires for raw key events while this node is focused.
        onKey?: (scancode: number, pressed: boolean) => void;
    }

    // Properties for the Label (text display) component.
    export interface LabelProperties extends BaseProperties {
        children?: string | number | (string | number)[];
    }

    // Properties for the View (container) component.
    export interface ViewProperties extends BaseProperties {
        onClick?: () => void;
    }

    // Image component properties. source is an asset-pack path resolved through
    // the TextureCache. Sizing: both width and height set stretches to fill;
    // one set derives the other from the intrinsic aspect ratio; neither set
    // renders at native pixel size. Rounded images need an overflow: Hidden
    // parent with matching borderRadius for pixel-perfect clipping.
    export interface ImageProperties extends BaseProperties {
        source: string;
    }

    // Button component properties. Button is a semantic alias for View with
    // interaction defaults applied at parse time (cursor Pointer, tabIndex 0,
    // hoverScale 1.02, activeScale 0.96, a 0.12s EaseOut transition), each
    // overridable via style.
    export interface ButtonProperties extends BaseProperties {
        onClick?: () => void;
    }

    // ScrollView component properties. The container forces overflow: Hidden
    // and clips out-of-rect children via the SpriteBatcher scissor stack;
    // wheel events route to the deepest ScrollView under the cursor. onScroll
    // fires on every wheel-induced change with the post-clamp offsets.
    export interface ScrollViewProperties extends BaseProperties {
        onScroll?: (scrollX: number, scrollY: number) => void;
    }

    // TextInput component properties. Caret movement is UTF-8 codepoint-safe;
    // SDL text input starts on focus and stops on blur, so IME/dead-key
    // handling works out of the box. onChange fires on every value-mutating
    // keystroke (including Backspace/Delete) and once more on Enter as a submit
    // signal. Selection is not implemented (caret plus insert/delete only), and
    // long values truncate at the right padding edge rather than scrolling.
    export interface TextInputProperties extends BaseProperties {
        // Current value; treated as the React-style controlled prop.
        value?: string;
        // Text shown at half opacity when value is empty.
        placeholder?: string;
        // Fires on every keystroke and on Enter.
        onChange?: (value: string) => void;
    }

    // String tags used by createElement to identify built-in components.
    export const View: string;
    export const Label: string;
    export const Image: string;
    export const Button: string;
    export const ScrollView: string;
    export const TextInput: string;

    // Manage local state within a functional component; calling the setter
    // triggers a re-render of the Canvas tree.
    export function useState<T>(
        initialValue: T,
    ): [T, (newValue: T | ((prev: T) => T)) => void];

    // Run a side effect within a functional component. The effect runs after
    // mount; if it returns a function, that cleanup runs on unmount and before
    // each re-run. The dependencies array controls re-runs: omitted runs after
    // every render; [] runs once on mount with cleanup on unmount; a non-empty
    // array re-runs whenever any element differs from the previous render.
    export function useEffect(
        effect: () => void | (() => void),
        dependencies?: ReadonlyArray<unknown>,
    ): void;

    // The Canvas module: JSX factory and render entry point.
    interface Canvas {
        // JSX factory. Transforms JSX into internal element trees; set as the
        // jsxFactory in tsconfig.json.
        createElement(
            type: string | ((properties: Record<string, unknown>) => CanvasNode),
            properties: Record<string, unknown> | null,
            ...children: CanvasNode[]
        ): CanvasElement;

        // Mount the root element and start reconciliation with the native UI
        // layer. Calling render again replaces the previous tree; the diff
        // preserves component state where keys match.
        render(element: CanvasNode): void;
    }

    const Canvas: Canvas;
    export default Canvas;

    global {
        namespace JSX {
            interface IntrinsicElements {
                view: ViewProperties;
                label: LabelProperties;
                image: ImageProperties;
                button: ButtonProperties;
                scrollview: ScrollViewProperties;
                textinput: TextInputProperties;
            }
        }
    }
}
