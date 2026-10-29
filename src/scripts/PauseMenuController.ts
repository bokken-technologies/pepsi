import { Behaviour } from "bokken/gameObject";
import Input from "bokken/input";
import { defaultStore, Screen } from "../store.ts";

export class PauseMenuController extends Behaviour {
    onUpdate(deltaTime: number): void {
        if (!Input.isKeyPressed("Escape")) return;

        const screen = defaultStore.getState().screen;
        
        if (screen === Screen.Playing) {
            defaultStore.setState({ screen: Screen.Paused });
        } else if (screen === Screen.Paused) {
            defaultStore.setState({ screen: Screen.Playing });
        }
    }
}