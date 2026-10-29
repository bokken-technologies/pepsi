import { GameObject, Text2D, Transform2D } from "bokken/gameObject";

import { RemotePlayerController } from "../RemotePlayerController.ts";

/**
 * Builds the GameObject used to represent a REMOTE player. Pass your own
 * factory (reusing whatever sprite/animation setup your local player uses)
 * to get matching visuals for other players; see `defaultRemoteVisualFactory`
 * for the bare-bones fallback.
 */
export type RemoteVisualFactory = (name: string) => GameObject;

export function defaultRemoteVisualFactory(name: string): GameObject {
    const go = new GameObject(name);
    go.addComponent(Transform2D, { positionX: 0, positionY: 0 });
    return go;
}

/** Owns the spawn/despawn lifecycle and per-frame updates for remote players. */
export class RemoteRegistry {
    private remotes = new Map<number, GameObject>();

    constructor(private readonly createVisual: RemoteVisualFactory) {}

    get ids(): number[] {
        return [...this.remotes.keys()];
    }

    has(id: number): boolean {
        return this.remotes.has(id);
    }

    spawn(id: number): void {
        if (this.remotes.has(id)) return;

        const gameObject = this.createVisual(`RemotePlayer_${id}`);
        gameObject.addComponent(Text2D, {
            text: "Player",
            fontSize: 24,
            offsetY: 60,
            color: 0x00000077,
            worldSpace: true,
        });

        this.remotes.set(id, gameObject);
    }

    despawn(id: number): void {
        const gameObject = this.remotes.get(id);
        if (!gameObject) return;

        this.remotes.delete(id);
        GameObject.destroy(gameObject);
    }

    despawnAll(): void {
        for (const id of this.ids) this.despawn(id);
    }

    /** Updates a remote's target position, spawning it first if we haven't seen it yet. */
    updatePosition(id: number, x: number, y: number): void {
        if (!this.has(id)) this.spawn(id);
        this.withController(id, (controller) => {
            controller.targetX = x;
            controller.targetY = y;
        });
    }

    setFlipX(id: number, flipX: boolean): void {
        this.withController(id, (controller) => controller.setFlipX(flipX));
    }

    playAnimation(id: number, clipName: string): void {
        this.withController(id, (controller) => controller.playAnimation(clipName));
    }

    triggerAttack(id: number): void {
        this.withController(id, (controller) => controller.triggerAttack());
    }

    private withController(id: number, fn: (controller: RemotePlayerController) => void): void {
        const gameObject = this.remotes.get(id);
        if (!gameObject) return;

        const controller = gameObject.getComponent(RemotePlayerController);
        if (controller) fn(controller);
    }
}