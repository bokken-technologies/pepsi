import { Store } from "./userInterface/store.ts";

export enum Screen {
    MainMenu = 'mainMenu',
    Playing = 'playing',
    Paused = 'paused',
    Settings = 'settings',
    Credits = 'credits',
}

export type DefaultStore = {
    positionX: number;
    positionY: number;
    screen: Screen;
};

export const defaultStore = new Store<DefaultStore>({
    positionX: 0,
    positionY: 0,
    screen: Screen.MainMenu,
});