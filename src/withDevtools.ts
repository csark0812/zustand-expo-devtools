import { getDevToolsPluginClientAsync } from "expo/devtools";
import type {
	StateCreator,
	StoreApi,
	StoreMutatorIdentifier,
} from "zustand/vanilla";

// Type definitions for DevTools client and messages
interface DevToolsClient {
	sendMessage: (type: string, data: unknown) => void;
	addMessageListener: (
		type: string,
		handler: (message: DevToolsMessage) => void,
	) => { remove: () => void };
}

interface DevToolsMessage {
	type: "ACTION" | "DISPATCH";
	action?: string | { type: string; [key: string]: unknown };
	state?: string;
	instanceId?: string | number;
}

// Type definitions for Expo DevTools
type Cast<T, U> = T extends U ? T : U;
type Write<T, U> = Omit<T, keyof U> & U;

type TakeTwo<T> = T extends {
	length: 0;
}
	? [undefined, undefined]
	: T extends {
				length: 1;
			}
		? [...args0: Cast<T, unknown[]>, arg1: undefined]
		: T extends {
					length: 0 | 1;
				}
			? [...args0: Cast<T, unknown[]>, arg1: undefined]
			: T extends {
						length: 2;
					}
				? T
				: T extends {
							length: 1 | 2;
						}
					? T
					: T extends {
								length: 0 | 1 | 2;
							}
						? T
						: T extends [infer A0, infer A1, ...unknown[]]
							? [A0, A1]
							: T extends [infer A0, (infer A1)?, ...unknown[]]
								? [A0, A1?]
								: T extends [(infer A0)?, (infer A1)?, ...unknown[]]
									? [A0?, A1?]
									: never;

type WithExpoDevtools<S> = Write<S, StoreExpoDevtools<S>>;

type Action =
	| string
	| {
			type: string;
			[x: string | number | symbol]: unknown;
	  };

type StoreExpoDevtools<S> = S extends {
	setState: {
		(...args: infer Sa1): infer Sr1;
		(...args: infer Sa2): infer Sr2;
	};
}
	? {
			setState(...args: [...args: TakeTwo<Sa1>, action?: Action]): Sr1;
			setState(...args: [...args: TakeTwo<Sa2>, action?: Action]): Sr2;
			devtools: {
				cleanup: () => void;
			};
		}
	: never;

export interface ExpoDevtoolsOptions {
	name?: string;
	enabled?: boolean;
	anonymousActionType?: string;
	store?: string;
}

type ExpoDevtools = <
	T,
	Mps extends [StoreMutatorIdentifier, unknown][] = [],
	Mcs extends [StoreMutatorIdentifier, unknown][] = [],
	U = T,
>(
	initializer: StateCreator<
		T,
		[...Mps, ["zustand/expo-devtools", never]],
		Mcs,
		U
	>,
	devtoolsOptions?: ExpoDevtoolsOptions,
) => StateCreator<T, Mps, [["zustand/expo-devtools", never], ...Mcs]>;

declare module "zustand/vanilla" {
	interface StoreMutators<S, A> {
		"zustand/expo-devtools": WithExpoDevtools<S>;
	}
}

type ExpoDevtoolsImpl = <T>(
	storeInitializer: StateCreator<T, [], []>,
	devtoolsOptions?: ExpoDevtoolsOptions,
) => StateCreator<T, [], []>;

export type NamedSet<T> = WithExpoDevtools<StoreApi<T>>["setState"];

// Singleton client shared across all stores
let sharedClient: DevToolsClient | null = null;
let clientInitializationPromise: Promise<DevToolsClient | null> | null = null;
let clientInitialized = false;

// Initialize the shared Expo devtools client (singleton)
const getOrCreateClient = async (): Promise<DevToolsClient | null> => {
	// If client is already initialized, return it
	if (sharedClient) {
		return sharedClient;
	}

	// If initialization is in progress, wait for it
	if (clientInitializationPromise) {
		return clientInitializationPromise;
	}

	// Start initialization
	clientInitializationPromise = (async () => {
		try {
			sharedClient = await getDevToolsPluginClientAsync("zustand-expo-devtools");
			if (!clientInitialized) {
				console.log("[Zustand DevTools] Client initialized");
				clientInitialized = true;
			}
			return sharedClient;
		} catch (error) {
			console.error("[Zustand DevTools] Failed to initialize client:", error);
			return null;
		}
	})();

	return clientInitializationPromise;
};

// Internal function to reset client state (for testing purposes)
export const __resetDevToolsClient = () => {
	sharedClient = null;
	clientInitializationPromise = null;
	clientInitialized = false;
};

const expoDevtoolsImpl: ExpoDevtoolsImpl =
	(fn, devtoolsOptions = {}) =>
	(set, get, api) => {
		const { enabled, anonymousActionType, store, ...options } =
			devtoolsOptions as ExpoDevtoolsOptions;

		// Check if devtools should be enabled (default to true)
		const isEnabled = enabled ?? true;
		if (!isEnabled) {
			return fn(set, get, api);
		}

		// State management
		let isRecording = true;
		let client: DevToolsClient | null = null;
		let isInitialized = false;

		// Helper function to safely parse JSON strings
		const safeJsonParse = (jsonString: string, errorContext: string) => {
			try {
				return JSON.parse(jsonString);
			} catch (e) {
				console.error(`[zustand devtools] Could not parse ${errorContext}`, e);
				return null;
			}
		};

		// Handle ACTION type messages from devtools
		const handleActionMessage = (message: DevToolsMessage) => {
			if (typeof message.action !== "string") return;

			const action = safeJsonParse(message.action, "action");
			if (!action) return;

			if (action.type === "__setState") {
				setStateFromDevtools(action.state);
				return;
			}

			const extendedApi = api as StoreApi<unknown> & {
				dispatchFromDevtools?: boolean;
				dispatch?: (action: Action) => void;
			};

			if (
				extendedApi.dispatchFromDevtools &&
				typeof extendedApi.dispatch === "function"
			) {
				extendedApi.dispatch(action);
			}
		};

		// Handle DISPATCH type messages from devtools
		const handleDispatchMessage = (message: DevToolsMessage) => {
			if (typeof message.action !== "object" || !message.action?.type) return;

			switch (message.action.type) {
				case "RESET":
					setStateFromDevtools(initialState);
					sendInit(api.getState());
					break;

				case "COMMIT":
					if (typeof message.state === "string") {
						const state = safeJsonParse(message.state, "commit state");
						if (state) {
							sendInit(state);
						}
					}
					break;

				case "ROLLBACK":
					if (typeof message.state === "string") {
						const state = safeJsonParse(message.state, "rollback state");
						if (state) {
							setStateFromDevtools(state);
							sendInit(api.getState());
						}
					}
					break;

				case "JUMP_TO_STATE":
				case "JUMP_TO_ACTION":
					if (typeof message.state === "string") {
						const state = safeJsonParse(message.state, "jump state");
						if (state) {
							setStateFromDevtools(state);
						}
					}
					break;

				case "PAUSE_RECORDING":
					isRecording = !isRecording;
					break;
			}
		};

	// Initialize the Expo devtools client
	const initializeClient = async () => {
		// Get or create the shared client
		client = await getOrCreateClient();
		
		if (!client) {
			return;
		}

		// Set up message listener for devtools actions
		client.addMessageListener("dispatch", (message: DevToolsMessage) => {
			if (
				!message.type &&
				message.instanceId !== (options.name || "zustand-store")
			)
				return;

			switch (message.type) {
				case "ACTION":
					handleActionMessage(message);
					break;
				case "DISPATCH":
					handleDispatchMessage(message);
					break;
			}
		});
	};

		// Send init message to webui
		const sendInit = (state: unknown) => {
			client?.sendMessage("init", {
				name: options.name,
				state,
			});
		};

		// Send state update to webui
		const sendStateUpdate = (action: Action, state: unknown) => {
			if (!isRecording) return;

			const actionObj = typeof action === "string" ? { type: action } : action;

			client?.sendMessage("state", {
				name: options.name,
				type: actionObj.type,
				state,
			});
		};

		// Set state from devtools without triggering recording
		const setStateFromDevtools = (state: unknown) => {
			const originalIsRecording = isRecording;
			isRecording = false;
			set(state as Parameters<typeof set>[0]);
			isRecording = originalIsRecording;
		};

		// Create action object from nameOrAction parameter
		const createAction = (nameOrAction?: Action): { type: string } => {
			if (nameOrAction === undefined) {
				// If no action is provided and we're not yet initialized,
				// this is likely a persist rehydration
				if (!isInitialized) {
					return { type: "@@HYDRATE" };
				}
				return { type: anonymousActionType || "anonymous" };
			}

			if (typeof nameOrAction === "string") {
				return { type: nameOrAction };
			}

			return nameOrAction;
		};

		// Override setState to capture actions and send to devtools
		const originalSetState = api.setState;
		api.setState = (
			state: Parameters<typeof originalSetState>[0],
			replace?: boolean,
			nameOrAction?: Action,
		) => {
			const result =
				replace === true
					? originalSetState(state, true)
					: originalSetState(state);

			if (!isRecording) return result;

			const action = createAction(nameOrAction);
			sendStateUpdate(action, get());

			return result;
		};

		// Add devtools cleanup method
		(api as typeof api & { devtools: { cleanup: () => void } }).devtools = {
			cleanup: () => {
				// Cleanup logic here
			},
		};

		// Initialize the store and client
		const initialState = fn(api.setState, get, api);

		// Initialize client asynchronously
		initializeClient().then(() => {
			if (client) {
				sendInit(initialState);
			}
			isInitialized = true;
		});

		return initialState;
	};

export const devtools = expoDevtoolsImpl as unknown as ExpoDevtools;
