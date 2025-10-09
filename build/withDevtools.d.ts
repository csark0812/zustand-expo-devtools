import type { StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand/vanilla";
type Cast<T, U> = T extends U ? T : U;
type Write<T, U> = Omit<T, keyof U> & U;
type TakeTwo<T> = T extends {
    length: 0;
} ? [undefined, undefined] : T extends {
    length: 1;
} ? [...args0: Cast<T, unknown[]>, arg1: undefined] : T extends {
    length: 0 | 1;
} ? [...args0: Cast<T, unknown[]>, arg1: undefined] : T extends {
    length: 2;
} ? T : T extends {
    length: 1 | 2;
} ? T : T extends {
    length: 0 | 1 | 2;
} ? T : T extends [infer A0, infer A1, ...unknown[]] ? [A0, A1] : T extends [infer A0, (infer A1)?, ...unknown[]] ? [A0, A1?] : T extends [(infer A0)?, (infer A1)?, ...unknown[]] ? [A0?, A1?] : never;
type WithExpoDevtools<S> = Write<S, StoreExpoDevtools<S>>;
type Action = string | {
    type: string;
    [x: string | number | symbol]: unknown;
};
type StoreExpoDevtools<S> = S extends {
    setState: {
        (...args: infer Sa1): infer Sr1;
        (...args: infer Sa2): infer Sr2;
    };
} ? {
    setState(...args: [...args: TakeTwo<Sa1>, action?: Action]): Sr1;
    setState(...args: [...args: TakeTwo<Sa2>, action?: Action]): Sr2;
    devtools: {
        cleanup: () => void;
    };
} : never;
export interface ExpoDevtoolsOptions {
    name?: string;
    enabled?: boolean;
    anonymousActionType?: string;
    store?: string;
}
type ExpoDevtools = <T, Mps extends [StoreMutatorIdentifier, unknown][] = [], Mcs extends [StoreMutatorIdentifier, unknown][] = [], U = T>(initializer: StateCreator<T, [
    ...Mps,
    ["zustand/expo-devtools", never]
], Mcs, U>, devtoolsOptions?: ExpoDevtoolsOptions) => StateCreator<T, Mps, [["zustand/expo-devtools", never], ...Mcs]>;
declare module "zustand/vanilla" {
    interface StoreMutators<S, A> {
        "zustand/expo-devtools": WithExpoDevtools<S>;
    }
}
export type NamedSet<T> = WithExpoDevtools<StoreApi<T>>["setState"];
export declare const __resetDevToolsClient: () => void;
export declare const devtools: ExpoDevtools;
export {};
//# sourceMappingURL=withDevtools.d.ts.map