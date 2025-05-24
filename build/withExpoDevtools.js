import { getDevToolsPluginClientAsync } from 'expo/devtools';
const expoDevtoolsImpl = (fn, devtoolsOptions = {}) => (set, get, api) => {
    const { enabled, anonymousActionType, store, ...options } = devtoolsOptions;
    // Check if devtools should be enabled (default to true)
    const isEnabled = enabled ?? true;
    if (!isEnabled) {
        return fn(set, get, api);
    }
    // State management
    let isRecording = true;
    let client = null;
    // Helper function to safely parse JSON strings
    const safeJsonParse = (jsonString, errorContext) => {
        try {
            return JSON.parse(jsonString);
        }
        catch (e) {
            console.error(`[zustand devtools] Could not parse ${errorContext}`, e);
            return null;
        }
    };
    // Handle ACTION type messages from devtools
    const handleActionMessage = (message) => {
        if (typeof message.payload !== 'string')
            return;
        const action = safeJsonParse(message.payload, 'action');
        if (!action)
            return;
        if (action.type === '__setState') {
            setStateFromDevtools(action.state);
            return;
        }
        const extendedApi = api;
        if (extendedApi.dispatchFromDevtools && typeof extendedApi.dispatch === 'function') {
            extendedApi.dispatch(action);
        }
    };
    // Handle DISPATCH type messages from devtools
    const handleDispatchMessage = (message) => {
        if (typeof message.payload !== 'object' || !message.payload?.type)
            return;
        switch (message.payload.type) {
            case 'RESET':
                setStateFromDevtools(initialState);
                sendInit(api.getState());
                break;
            case 'COMMIT':
                sendInit(api.getState());
                break;
            case 'ROLLBACK':
                if (typeof message.state === 'string') {
                    const state = safeJsonParse(message.state, 'rollback state');
                    if (state) {
                        setStateFromDevtools(state);
                        sendInit(api.getState());
                    }
                }
                break;
            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
                if (typeof message.state === 'string') {
                    const state = safeJsonParse(message.state, 'jump state');
                    if (state) {
                        setStateFromDevtools(state);
                    }
                }
                break;
            case 'PAUSE_RECORDING':
                isRecording = !isRecording;
                break;
        }
    };
    // Initialize the Expo devtools client
    const initializeClient = async () => {
        try {
            client = await getDevToolsPluginClientAsync('zustand-expo-devtools');
            // Set up message listener for devtools actions
            client.addMessageListener('dispatch', (message) => {
                switch (message.type) {
                    case 'ACTION':
                        handleActionMessage(message);
                        break;
                    case 'DISPATCH':
                        handleDispatchMessage(message);
                        break;
                }
            });
            console.log('[Zustand DevTools] Client initialized');
        }
        catch (error) {
            console.error('[Zustand DevTools] Failed to initialize client:', error);
        }
    };
    // Send init message to webui
    const sendInit = (state) => {
        client?.sendMessage('init', {
            name: options.name || 'Zustand Store',
            state,
        });
    };
    // Send state update to webui
    const sendStateUpdate = (action, state) => {
        if (!isRecording)
            return;
        const actionObj = typeof action === 'string' ? { type: action } : action;
        client?.sendMessage('state', {
            type: actionObj.type,
            state,
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
    const createAction = (nameOrAction) => {
        if (nameOrAction === undefined) {
            return { type: anonymousActionType || 'anonymous' };
        }
        if (typeof nameOrAction === 'string') {
            return { type: nameOrAction };
        }
        return nameOrAction;
    };
    // Override setState to capture actions and send to devtools
    const originalSetState = api.setState;
    api.setState = (state, replace, nameOrAction) => {
        const result = replace === true ? originalSetState(state, true) : originalSetState(state);
        if (!isRecording)
            return result;
        const action = createAction(nameOrAction);
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
    // Initialize client asynchronously
    initializeClient().then(() => {
        if (client) {
            sendInit(initialState);
        }
    });
    return initialState;
};
export const expoDevtools = expoDevtoolsImpl;
//# sourceMappingURL=withExpoDevtools.js.map