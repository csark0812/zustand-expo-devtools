import { getDevToolsPluginClientAsync } from 'expo/devtools';
export const debuggerMiddleWare = async (store, storeName = new Date().toISOString()) => {
    const client = await getDevToolsPluginClientAsync('zustand-expo-devtools');
    client?.sendMessage('ping', { type: 'CONNECT', name: storeName });
    client?.sendMessage('ping', { type: 'INIT', name: storeName, data: store?.getState() });
    store?.subscribe(newState => {
        client?.sendMessage('ping', { type: 'UPDATE', name: storeName, data: newState });
    });
};
//# sourceMappingURL=devtools.js.map