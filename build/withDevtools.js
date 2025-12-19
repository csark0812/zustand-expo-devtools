import { getDevToolsPluginClientAsync } from "expo/devtools";
// Singleton client shared across all stores
let sharedClient = null;
let clientInitializationPromise = null;
let clientInitialized = false;
// Initialize the shared Expo devtools client (singleton)
const getOrCreateClient = async () => {
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
        }
        catch (error) {
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
const expoDevtoolsImpl = (fn, devtoolsOptions = {}) => (set, get, api) => {
    const { enabled, anonymousActionType, store, serialize, ...options } = devtoolsOptions;
    // Check if devtools should be enabled (default to true)
    const isEnabled = enabled ?? true;
    if (!isEnabled) {
        return fn(set, get, api);
    }
    // State management
    let isRecording = true;
    let client = null;
    let isInitializing = true;
    // Extract serialization options
    const replacer = typeof serialize === "object" ? serialize.replacer : undefined;
    const reviver = typeof serialize === "object" ? serialize.reviver : undefined;
    // Helper function to serialize state
    const serializeState = (state) => {
        if (!serialize) {
            return state;
        }
        // If serialize is true or an object, we need to serialize
        // For now, we'll use JSON.stringify with replacer if provided
        // In a full implementation, you might want to use a library like jsan
        if (replacer) {
            try {
                return JSON.parse(JSON.stringify(state, replacer));
            }
            catch (e) {
                console.error("[zustand devtools] Serialization error:", e);
                return state;
            }
        }
        return state;
    };
    // Helper function to safely parse JSON strings with reviver support
    const safeJsonParse = (jsonString, errorContext) => {
        try {
            return JSON.parse(jsonString, reviver);
        }
        catch (e) {
            console.error(`[zustand devtools] Could not parse ${errorContext}`, e);
            return null;
        }
    };
    // Handle ACTION type messages from devtools
    const handleActionMessage = (message) => {
        if (typeof message.action !== "string")
            return;
        const action = safeJsonParse(message.action, "action");
        if (!action)
            return;
        if (action.type === "__setState") {
            setStateFromDevtools(action.state);
            return;
        }
        const extendedApi = api;
        if (extendedApi.dispatchFromDevtools &&
            typeof extendedApi.dispatch === "function") {
            extendedApi.dispatch(action);
        }
    };
    // Handle DISPATCH type messages from devtools
    const handleDispatchMessage = (message) => {
        if (typeof message.action !== "object" || !message.action?.type)
            return;
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
        client.addMessageListener("dispatch", (message) => {
            if (!message.type &&
                message.instanceId !== (options.name || "zustand-store"))
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
    const sendInit = (state) => {
        client?.sendMessage("init", {
            name: options.name,
            state: serializeState(state),
        });
    };
    // Send state update to webui
    const sendStateUpdate = (action, state) => {
        if (!isRecording)
            return;
        const actionObj = typeof action === "string" ? { type: action } : action;
        client?.sendMessage("state", {
            name: options.name,
            type: actionObj.type,
            state: serializeState(state),
        });
    };
    // Set state from devtools without triggering recording
    const setStateFromDevtools = (state) => {
        const originalIsRecording = isRecording;
        isRecording = false;
        set(state);
        isRecording = originalIsRecording;
    };
    // Create action object from nameOrAction parameter
    const createAction = (nameOrAction, replace) => {
        if (nameOrAction === undefined) {
            // If setState is called without an action name during store initialization,
            // it's likely from persist middleware rehydrating state
            if (isInitializing) {
                return { type: "@@REHYDRATE" };
            }
            // Persist middleware calls setState with replace=true when rehydrating
            // This is a strong signal that it's a rehydration action
            if (replace === true) {
                return { type: "@@REHYDRATE" };
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
    api.setState = (state, replace, nameOrAction) => {
        const result = replace === true
            ? originalSetState(state, true)
            : originalSetState(state);
        if (!isRecording)
            return result;
        const action = createAction(nameOrAction, replace);
        sendStateUpdate(action, get());
        return result;
    };
    // Add devtools cleanup method
    api.devtools = {
        cleanup: () => {
            // Cleanup logic here
        },
    };
    // Initialize the store and client
    const initialState = fn(api.setState, get, api);
    // Mark initialization as complete
    // Any setState calls after this point are not from persist rehydration
    isInitializing = false;
    // Initialize client asynchronously
    initializeClient().then(() => {
        if (client) {
            sendInit(initialState);
        }
    });
    return initialState;
};
export const devtools = expoDevtoolsImpl;
//# sourceMappingURL=withDevtools.js.map