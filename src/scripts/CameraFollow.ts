import { Behaviour, Transform2D, GameObject } from "bokken/gameObject";

export class CameraFollow extends Behaviour {
    public target: Transform2D | null = null;

    public offsetX: number = 0;
    public offsetY: number = 0;

    public smoothing: number = 10;

    private transform: Transform2D | undefined;

    onStart(): void {
        this.transform = this.gameObject.getComponent(Transform2D);
    }

    onUpdate(deltaTime: number): void {
        if (!this.target || !this.transform) return;

        const targetX = this.target.positionX + this.offsetX;
        const targetY = this.target.positionY + this.offsetY;

        if (this.smoothing <= 0) {
            this.transform.positionX = targetX;
            this.transform.positionY = targetY;

            return;
        }

        const t = 1 - Math.exp(-this.smoothing * deltaTime);
        
        this.transform.positionX += (targetX - this.transform.positionX) * t;
        this.transform.positionY += (targetY - this.transform.positionY) * t;
    }
}