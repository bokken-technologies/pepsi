import Canvas, { Label, View } from "bokken/canvas";
import { FramesPerSecond } from "./FramesPerSecond.tsx";
import { PauseMenu } from "./PauseMenu.tsx";
import { MainMenu } from "./MainMenu.tsx";

import { defaultStore, Screen } from "../../store.ts";
import { useStore } from "../store.ts";

export function Game() {
    const store = useStore(defaultStore);

    switch(store.screen)
    {
        case Screen.MainMenu:
            return <MainMenu />;
        
        case Screen.Paused:
            return <PauseMenu></PauseMenu>;

        case Screen.Settings:
            return <></>;

        case Screen.Credits:
            return <></>;

        case Screen.Playing:
            break;
    }

    return (
        <View style={{ width: '100%', height: '100%' }}>
            <FramesPerSecond />

            <Label style={{ position: 'Absolute', top: 16, left: 16, color: 0x000000FF, fontSize: 20, fontBold: true }}>
                X: {store.positionX.toFixed(2)}  Y: {store.positionY.toFixed(2)}
            </Label>

            <Label style={{ position: 'Absolute', bottom: 16, left: 16, color: 0x000000FF, fontSize: 20, fontBold: true }}>
                WASD / Arrow Keys to move
            </Label>
        </View>
    );
}