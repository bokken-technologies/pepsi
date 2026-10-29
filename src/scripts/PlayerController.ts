import { Behaviour, Transform2D, Sprite2D, Animation2D } from "bokken/gameObject";
import Input from "bokken/input";
import { defaultStore, Screen } from "../store.ts";

type Controls = {
    up: string;
    down: string;
    left: string;
    right: string;
    attack: string;
};

export class PlayerController extends Behaviour {
    public speed: number = 200;
    public isAttacking: boolean = false;
    public isMoving: boolean = false;
    public flipX: boolean = false;

    public controls: Controls = { up: "W", down: "S", left: "A", right: "D", attack: "Space" };

    private transform: Transform2D | undefined;
    private animation: Animation2D | undefined;

    onStart(): void {
        this.transform = this.gameObject.getComponent(Transform2D);
        this.animation = this.gameObject.getComponent(Animation2D);
    }

    onUpdate(deltaTime: number): void {
        if (!this.transform) return;
        if (defaultStore.getState().screen !== Screen.Playing) return;

        // Release the lock once the engine reports the one-shot clip has
        // actually stopped, instead of guessing a duration.
        if (this.isAttacking && this.animation?.activeClip === "attack" && !this.animation?.isPlaying) {
            this.isAttacking = false;
        }

        if (Input.isKeyPressed(this.controls.attack) && !this.isAttacking) {
            this.isAttacking = true;
            this.animation?.play("attack");
        }

        let moveX = 0;
        let moveY = 0;

        if (Input.isKeyDown(this.controls.up)) moveY += 1;
        if (Input.isKeyDown(this.controls.down)) moveY -= 1;
        if (Input.isKeyDown(this.controls.left)) moveX -= 1;
        if (Input.isKeyDown(this.controls.right)) moveX += 1;

        this.isMoving = moveX !== 0 || moveY !== 0;

        if (!this.isAttacking && this.isMoving) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
            this.transform.translate(moveX * this.speed * deltaTime, moveY * this.speed * deltaTime);
        }

        const sprite = this.gameObject.getComponent(Sprite2D);
        if (sprite && moveX !== 0) {
            this.flipX = moveX > 0;
            sprite.flipX = moveX > 0;
        }

        if (!this.isAttacking) {
            if (this.isMoving && this.animation?.activeClip !== "run") {
                this.animation?.play("run");
            } else if (!this.isMoving && this.animation?.activeClip !== "idle") {
                this.animation?.play("idle");
            }
        }
    }
}