import { Behaviour, GameObject, Transform2D } from "bokken/gameObject";
import { Message, TCPClient, TCPServer } from "bokken/network";
import Log from "bokken/log";

import { FrameDecoder, frame } from "./network/Framing.ts";
import {
    HOST_PLAYER_ID,
    MessageType,
    encodeAnimation,
    encodeAssignId,
    encodeAttack,
    encodeFlipX,
    encodePlayerJoined,
    encodePlayerLeft,
    encodePosition,
    errorText,
} from "./network/NetworkProtocol.ts";
import { RemoteRegistry, defaultRemoteVisualFactory } from "./network/RemoteRegistry.ts";
import { PlayerController } from "./PlayerController.ts";

export class NetworkManager extends Behaviour {
    /** true = start a TCPServer and accept connections; false = connect as a client. */
    public isHost: boolean = false;

    /** Interface to bind when hosting. "*" binds all interfaces. */
    public bindHost: string = "*";

    /** Host to connect to when not hosting. */
    public connectHost: string = "127.0.0.1";

    public port: number = 7777;

    /** How often (per second) to broadcast/send the local position. */
    public sendRateHz: number = 20;

    public localPlayerController: PlayerController | null = null;
    public localPlayerTransform: Transform2D | null = null;

    /**
     * Wrapped in a one-key object rather than being a bare function field:
     * ComponentProperties<T> excludes any field whose type is itself a
     * function (that's how it keeps Behaviour methods like onStart out of
     * the props object), so a bare `(name: string) => GameObject` field
     * can't be set via addComponent's props - wrapping it in
     * { create: ... } makes the field's own type an object again, which
     * IS settable inline. See RemoteRegistry for what the factory is used
     * for and its default.
     */
    public remoteVisualFactory: { create: (name: string) => GameObject } = {
        create: defaultRemoteVisualFactory,
    };

    private server: TCPServer | null = null;
    private client: TCPClient | null = null;

    private myId: number | null = null;
    private nextClientId = 1; // host-only; 0 is reserved for the host

    // host-only bookkeeping: one decoder + id per connected socket.
    private clientToId = new Map<TCPClient, number>();
    private idToClient = new Map<number, TCPClient>();
    private clientDecoders = new Map<TCPClient, FrameDecoder>();

    // client-only: single decoder for the one connection to the host.
    private hostDecoder = new FrameDecoder();

    private remotes!: RemoteRegistry;

    private sendAccumulator = 0;

    private lastIsMoving: boolean = false;
    private lastIsAttacking: boolean = false;
    private lastFlipX: boolean = false;

    onStart(): void {
        this.remotes = new RemoteRegistry((name) => this.remoteVisualFactory.create(name));

        if (this.isHost) {
            this.startHost();
        } else {
            this.startClient();
        }
    }

    onUpdate(deltaTime: number): void {
        if (!this.localPlayerController || !this.localPlayerTransform) return;

        this.syncLocalPlayerState();

        this.sendAccumulator += deltaTime;
        const sendInterval = 1 / Math.max(1, this.sendRateHz);
        if (this.sendAccumulator < sendInterval) return;
        this.sendAccumulator = 0;

        const { positionX: x, positionY: y } = this.localPlayerTransform;
        this.sendToAll((id) => encodePosition(id, x, y));
    }

    /**
     * Closes sockets and drops every remote player. Behaviour didn't show
     * an onDestroy hook in the files you shared - if one exists, call this
     * from it; otherwise call it manually before tearing down the scene
     * (e.g. from a scene-transition or quit handler).
     */
    shutdown(): void {
        this.server?.close();
        this.client?.close();
        this.remotes.despawnAll();
    }

    public sendAnimation(clipName: string): void {
        this.sendToAll((id) => encodeAnimation(id, clipName));
    }

    public sendFlipX(flipX: boolean): void {
        this.sendToAll((id) => encodeFlipX(id, flipX));
    }

    public sendAttack(): void {
        this.sendToAll((id) => encodeAttack(id));
    }

    /** Diffs the local player's animation/attack/flip state and broadcasts anything that changed. */
    private syncLocalPlayerState(): void {
        const controller = this.localPlayerController!;

        const isMoving = controller.isMoving;
        if (isMoving !== this.lastIsMoving) {
            this.lastIsMoving = isMoving;
            this.sendAnimation(isMoving ? "run" : "idle");
        }

        const isAttacking = controller.isAttacking;
        if (isAttacking && !this.lastIsAttacking) {
            this.sendAttack();
        }
        this.lastIsAttacking = isAttacking;

        const flipX = controller.flipX;
        if (flipX !== this.lastFlipX) {
            this.lastFlipX = flipX;
            this.sendFlipX(flipX);
        }
    }

    /** Broadcasts (host) or sends to the host (client) a payload encoded with the local player's id. */
    private sendToAll(encode: (id: number) => Uint8Array): void {
        if (this.isHost) {
            if (this.server?.isListening) {
                this.server.broadcast(frame(encode(HOST_PLAYER_ID)));
            }
        } else if (this.myId !== null && this.client?.isConnected) {
            this.client.send(frame(encode(this.myId)));
        }
    }

    private startHost(): void {
        this.server = new TCPServer(`${this.bindHost}:${this.port}`, {
            onConnect: (client) => this.onClientConnected(client),
            onDisconnect: (client) => this.onClientDisconnected(client),
            onError: (client, message) => {
                Log.error(`[Network] server error from a client: ${errorText(message)}`);
            },
            onMessage: (client, message) => this.onHostSocketData(client, message),
        });
    }

    private onClientConnected(client: TCPClient): void {
        const id = this.nextClientId++;
        this.clientToId.set(client, id);
        this.idToClient.set(id, client);
        this.clientDecoders.set(client, new FrameDecoder());

        // Tell the new client who it is, then who else (including the
        // host) is already in the game so it can spawn placeholders
        // before the first position update for each of them arrives.
        client.send(frame(encodeAssignId(id)));
        client.send(frame(encodePlayerJoined(HOST_PLAYER_ID)));
        for (const existingId of this.idToClient.keys()) {
            if (existingId !== id) client.send(frame(encodePlayerJoined(existingId)));
        }

        // Tell everyone else about the new arrival.
        this.server?.broadcastExcept(frame(encodePlayerJoined(id)), client);

        // The host needs to see this player too.
        this.remotes.spawn(id);
    }

    private onClientDisconnected(client: TCPClient): void {
        const id = this.clientToId.get(client);
        this.clientDecoders.delete(client);
        if (id === undefined) return;

        this.clientToId.delete(client);
        this.idToClient.delete(id);

        this.remotes.despawn(id);
        this.server?.broadcast(frame(encodePlayerLeft(id)));
    }

    private onHostSocketData(client: TCPClient, chunk: Message): void {
        const decoder = this.clientDecoders.get(client);
        if (!decoder) return;
        decoder.push(chunk.asBytes());

        for (const raw of decoder.drain()) {
            this.handleIncomingMessage(raw);
            // Relay every message on to everyone but the sender.
            this.server?.broadcastExcept(frame(raw), client);
        }
    }


    private startClient(): void {
        this.client = new TCPClient(`${this.connectHost}:${this.port}`, {
            autoReconnect: true,
            reconnectDelay: 1000,
            onConnect: () => {
                Log.info("[Network] connected to host");
            },
            onDisconnect: () => {
                Log.info("[Network] disconnected from host");
                // A reconnect gets a fresh id and a fresh round of
                // PlayerJoined messages from the host, so drop everything
                // we currently know rather than risk stale remotes.
                this.myId = null;
                this.hostDecoder = new FrameDecoder();
                this.remotes.despawnAll();
            },
            onError: (message) => {
                Log.error(`[Network] client error: ${errorText(message)}`);
            },
            onMessage: (chunk) => this.onClientSocketData(chunk),
        });
    }

    private onClientSocketData(chunk: Message): void {
        this.hostDecoder.push(chunk.asBytes());

        for (const raw of this.hostDecoder.drain()) {
            this.handleIncomingMessage(raw);
        }
    }


    /**
     * Applies one decoded message to local state (spawning/updating/despawning
     * remotes, or - client-side only - recording our assigned id). Used by
     * both the host (which also relays messages on) and the client.
     */
    private handleIncomingMessage(raw: Uint8Array): void {
        const message = new Message(raw);
        const type = message.readUint8();

        switch (type) {
            case MessageType.AssignId: {
                this.myId = message.readUint32();
                break;
            }

            case MessageType.PlayerJoined: {
                const id = message.readUint32();
                if (id !== this.myId) this.remotes.spawn(id);
                break;
            }

            case MessageType.PlayerLeft: {
                const id = message.readUint32();
                this.remotes.despawn(id);
                break;
            }

            case MessageType.Position: {
                const id = message.readUint32();
                const x = message.readFloat32();
                const y = message.readFloat32();
                if (id !== this.myId) this.remotes.updatePosition(id, x, y);
                break;
            }

            case MessageType.Animation: {
                const id = message.readUint32();
                const clipName = message.readString(message.bytesRemaining);
                if (id !== this.myId) this.remotes.playAnimation(id, clipName);
                break;
            }

            case MessageType.Attack: {
                const id = message.readUint32();
                if (id !== this.myId) this.remotes.triggerAttack(id);
                break;
            }

            case MessageType.FlipX: {
                const id = message.readUint32();
                const flipX = message.readUint8() === 1;
                if (id !== this.myId) this.remotes.setFlipX(id, flipX);
                break;
            }
        }
    }
}