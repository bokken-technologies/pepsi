import { useEffect, useState } from "bokken/canvas";

type Listener<T> = (state: T) => void;

export class Store<T> {
    private state: T;
    private listeners = new Set<Listener<T>>();

    constructor(initialState: T) {
        this.state = initialState;
    }

    getState(): T {
        return this.state;
    }

    setState(patch: Partial<T> | ((prev: T) => Partial<T>)): void {
        const resolved = typeof patch === "function" ? patch(this.state) : patch;
        this.state = { ...this.state, ...resolved };
        for (const listener of this.listeners) listener(this.state);
    }

    subscribe(listener: Listener<T>): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export function useStore<T>(store: Store<T>): T {
    const [state, setState] = useState(store.getState());

    useEffect(() => {
        // subscribe on mount, unsubscribe on unmount — matches the
        // documented useEffect cleanup semantics for a [] deps array.
        return store.subscribe(setState);
    }, []);

    return state;
}