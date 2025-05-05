import { useDevToolsPluginClient } from 'expo/devtools';
import { useEffect } from 'react';
export function useZustandDevtools() {
    const client = useDevToolsPluginClient('zustand-expo-devtools');
    useEffect(() => {
        const subscriptions = [];
        subscriptions.push(client?.addMessageListener('ping', data => {
            alert(`Received ping from ${data.from}`);
        }));
        client?.sendMessage('ping', { from: 'app' });
        return () => {
            for (const subscription of subscriptions) {
                subscription?.remove();
            }
        };
    }, [client]);
}
//# sourceMappingURL=useZustandDevtools.js.map