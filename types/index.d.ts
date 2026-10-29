// Ambient module manifest for the bokken/* engine API. Each sibling file
// declares module "bokken/<name>" to type the engine-provided modules that
// scripts import at runtime. The triple-slash references pull every module
// declaration into the program so all are visible without importing this
// file. Scripts import directly from the ambient specifiers, e.g.
// `import Canvas from "bokken/canvas"`; the tsconfig path mapping
// ("bokken/*": ["./types/*.d.ts"]) resolves them at type-check time.

interface Vector2D {
    readonly x: number;
    readonly y: number;
}

/// <reference path="./audio.d.ts" />
/// <reference path="./canvas.d.ts" />
/// <reference path="./engine.d.ts" />
/// <reference path="./gameObject.d.ts" />
/// <reference path="./input.d.ts" />
/// <reference path="./log.d.ts" />
/// <reference path="./network.d.ts" />
/// <reference path="./physics.d.ts" />
/// <reference path="./renderer.d.ts" />
/// <reference path="./window.d.ts" />
