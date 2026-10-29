import { Behaviour, Transform2D, Sprite2D, Animation2D } from "bokken/gameObject";

export class RemotePlayerController extends Behaviour {
    public targetX: number = 0;
    public targetY: number = 0;
    public smoothing: number = 12;

    private transform: Transform2D | undefined;
    private sprite: Sprite2D | undefined;
    private animation: Animation2D | undefined;
    private isAttacking: boolean = false;

    onStart(): void {
        this.transform = this.gameObject.getComponent(Transform2D);
        this.sprite = this.gameObject.getComponent(Sprite2D);
        this.animation = this.gameObject.getComponent(Animation2D);
        
        if (this.transform) {
            this.targetX = this.transform.positionX;
            this.targetY = this.transform.positionY;
        }
    }

    public playAnimation(clipName: string): void {
        if (this.isAttacking) return;
        this.animation?.play(clipName);
    }

    public triggerAttack(): void {
        this.isAttacking = true;
        this.animation?.play("attack");
    }

    public setFlipX(flipX: boolean): void {
        if (this.sprite) {
            this.sprite.flipX = flipX;
        }
    }

    onUpdate(deltaTime: number): void {
        if (!this.transform) return;

        // Auto-release attack lock when the animation clip finishes playing
        if (this.isAttacking && this.animation?.activeClip === "attack" && !this.animation?.isPlaying) {
            this.isAttacking = false;
            this.animation?.play("idle");
        }

        if (this.smoothing <= 0) {
            this.transform.positionX = this.targetX;
            this.transform.positionY = this.targetY;
            return;
        }

        const t = 1 - Math.exp(-this.smoothing * deltaTime);
        this.transform.positionX += (this.targetX - this.transform.positionX) * t;
        this.transform.positionY += (this.targetY - this.transform.positionY) * t;
    }
}