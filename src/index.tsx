import Canvas, { Align } from "bokken/canvas";
import {
    Animation2D,
    GameObject,
    Camera2D,
    Sprite2D,
    Transform2D,
    AnimationLoopMode,
    Text2D
} from "bokken/gameObject";

import { Game } from "./userInterface/components/Game.tsx";

import { CameraFollow } from "./scripts/CameraFollow.ts";
import { PlayerController } from "./scripts/PlayerController.ts";
import { PauseMenuController } from "./scripts/PauseMenuController.ts";
import { NetworkManager } from "./scripts/NetworkManager.ts";
import { RemotePlayerController } from "./scripts/RemotePlayerController.ts";

import { defaultStore, Screen } from "./store.ts";

const NETWORK_IS_HOST = true;
const NETWORK_BIND_HOST = "*";
const NETWORK_CONNECT_HOST = "127.0.0.1";
const NETWORK_PORT = 7777;

let player: GameObject | null = null;
let camera: GameObject | null = null;
let network: GameObject | null = null;

let spawned = false;

// Called once when the game starts, before the first frame. Nothing
// gameplay-related is created here anymore — just the UI. Player/
// camera/network are deferred to spawnPlayer(), triggered from
// onUpdate the moment the store transitions into Screen.Playing.
export function onStart() {
    Canvas.render(<Game />);
}

function spawnPlayer() {
    player = new GameObject("Player");
    camera = new GameObject("Camera");
    network = new GameObject("Network");

    player
        .addComponent(Transform2D, { positionX: 0, positionY: 0, scaleX: 2.5, scaleY: 2.5 })
        .addComponent(Sprite2D, {})
        .addComponent(Animation2D, {})
        .addComponent(Text2D, {
            text: "You",
            fontSize: 20,
            offsetY: 55,
            color: 0x000000FFA,
            worldSpace: true,
        })
        .addComponent(PlayerController, {});

    const animation = player.getComponent(Animation2D);

    animation?.addClip({
        name: "run",
        frames: { source: "sprites/cat_run.png", frameWidth: 80, frameHeight: 64, count: 8 },
        framesPerSecond: 16,
        loop: AnimationLoopMode.Loop,
    });

    animation?.addClip({
        name: "attack",
        frames: { source: "sprites/cat_attack.png", frameWidth: 80, frameHeight: 64, count: 8 },
        framesPerSecond: 60,
        loop: AnimationLoopMode.None,
    });

    animation?.addClip({
        name: "idle",
        frames: { source: "sprites/cat_idle.png", frameWidth: 80, frameHeight: 64, count: 8 },
        framesPerSecond: 8,
        loop: AnimationLoopMode.Loop,
    });

    animation?.play("idle");

    camera
        .addComponent(Transform2D, { positionX: 0, positionY: 0 })
        .addComponent(Camera2D, { isActive: true, zoom: 1 })
        .addComponent(CameraFollow, {
            target: player.getComponent(Transform2D),
            offsetX: 0,
            offsetY: 0,
            smoothing: 2.5,
        })
        .addComponent(PauseMenuController, {});

    network.addComponent(NetworkManager, {
        isHost: NETWORK_IS_HOST,
        bindHost: NETWORK_BIND_HOST,
        connectHost: NETWORK_CONNECT_HOST,
        port: NETWORK_PORT,
        localPlayerTransform: player.getComponent(Transform2D),
        localPlayerController: player.getComponent(PlayerController),
        remoteVisualFactory: {
            create: (name: string) => {
                const remote = new GameObject(name);
                remote
                    .addComponent(Transform2D, { positionX: 0, positionY: 0, scaleX: 2.5, scaleY: 2.5 })
                    .addComponent(Sprite2D, {})
                    .addComponent(Animation2D, {})
                    .addComponent(RemotePlayerController, {});

                const remoteAnimation = remote.getComponent(Animation2D);

                remoteAnimation?.addClip({
                    name: "run",
                    frames: { source: "sprites/cat_run.png", frameWidth: 80, frameHeight: 64, count: 8 },
                    framesPerSecond: 16,
                    loop: AnimationLoopMode.Loop,
                });

                remoteAnimation?.addClip({
                    name: "attack",
                    frames: { source: "sprites/cat_attack.png", frameWidth: 80, frameHeight: 64, count: 8 },
                    framesPerSecond: 60,
                    loop: AnimationLoopMode.None,
                });

                remoteAnimation?.addClip({
                    name: "idle",
                    frames: { source: "sprites/cat_idle.png", frameWidth: 80, frameHeight: 64, count: 8 },
                    framesPerSecond: 8,
                    loop: AnimationLoopMode.Loop,
                });

                remoteAnimation?.play("idle");

                return remote;
            },
        },
    });

    spawned = true;
}

// Called every frame. deltaTime is the seconds elapsed since the last frame.
export function onUpdate(deltaTime: number) {
    const state = defaultStore.getState();

    if (state.screen === Screen.Playing && !spawned) {
        spawnPlayer();
    }

    if (!player) return;

    const transform = player.getComponent(Transform2D);
    if (!transform) return;

    defaultStore.setState({
        positionX: transform.positionX,
        positionY: transform.positionY,
    });
}

export function onFixedUpdate(deltaTime: number) { }