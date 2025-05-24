import { useDevToolsPluginClient, type EventSubscription } from 'expo/devtools';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (config?: { name?: string }) => {
        init: (state: unknown) => void;
        send: (action: string | { type: string }, state: unknown) => void;
        subscribe: (listener: (message: unknown) => void) => () => void;
        unsubscribe: () => void;
        error: (message: string) => void;
      };
    };
  }
}

export default function App() {
  const client = useDevToolsPluginClient('zustand-expo-devtools');
  const connectionRef = useRef<ReturnType<
    NonNullable<Window['__REDUX_DEVTOOLS_EXTENSION__']>['connect']
  > | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  console.log('[WebUI] App component mounted, client:', !!client);

  useEffect(() => {
    console.log('[WebUI] useEffect running, client:', !!client);
    const subscriptions: (EventSubscription | undefined)[] = [];

    // Listen for Zustand store initialization
    subscriptions.push(
      client?.addMessageListener('init', data => {
        console.log('[WebUI] Received init message:', data);

        // Connect to Redux DevTools if available
        if (window.__REDUX_DEVTOOLS_EXTENSION__ && !connectionRef.current) {
          console.log('[WebUI] Redux DevTools Extension found, connecting...');
          const connection = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
            name: data.name || 'Zustand Store',
          });

          connectionRef.current = connection;
          console.log('[WebUI] Calling connection.init with state:', data.state);
          connection.init(data.state);

          // Subscribe to devtools actions and forward them to the app
          const unsubscribe = connection.subscribe((message: unknown) => {
            console.log('[WebUI] Received message from Redux DevTools:', message);

            // Forward devtools commands back to the app
            if (client) {
              client.sendMessage('dispatch', message);
            }
          });

          unsubscribeRef.current = unsubscribe;
        } else if (!window.__REDUX_DEVTOOLS_EXTENSION__) {
          console.log('[WebUI] Redux DevTools Extension not found');
        }
      }),
    );

    // Listen for state updates
    subscriptions.push(
      client?.addMessageListener('state', data => {
        console.log('[WebUI] Received state message:', data);

        // Forward to Redux DevTools if available and connected
        if (window.__REDUX_DEVTOOLS_EXTENSION__ && connectionRef.current) {
          console.log('[WebUI] Sending state update to Redux DevTools');
          const action = data.type ? { type: data.type } : { type: 'State Update' };
          connectionRef.current.send(action, data.state);
        } else {
          console.log('[WebUI] Redux DevTools Extension not available or not connected');
        }
      }),
    );

    // Keep the original ping listener for testing
    subscriptions.push(
      client?.addMessageListener('ping', data => {
        console.log('[WebUI] Received ping message:', data);
        alert(`Received ping from ${data.from}`);
        console.log('[WebUI] Sending ping response to:', data.from);
        client?.sendMessage('ping', { from: 'web' });
      }),
    );

    console.log('[WebUI] Setting up', subscriptions.length, 'message listeners');

    return () => {
      console.log('[WebUI] Cleanup: removing', subscriptions.length, 'subscriptions');

      // Cleanup Redux DevTools connection
      if (unsubscribeRef.current) {
        console.log('[WebUI] Unsubscribing from Redux DevTools');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (connectionRef.current) {
        console.log('[WebUI] Cleaning up Redux DevTools connection');
        connectionRef.current.unsubscribe();
        connectionRef.current = null;
      }

      // Cleanup message listeners
      for (const subscription of subscriptions) {
        subscription?.remove();
      }
    };
  }, [client]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Zustand Expo DevTools Plugin</Text>
      <Text style={[styles.text, styles.description]}>
        This plugin bridges Zustand stores with Redux DevTools through Expo DevTools.
      </Text>
      <Text style={[styles.text, styles.status]}>
        Status: {client ? 'Connected' : 'Disconnected'}
      </Text>
      <Text style={[styles.text, styles.status]}>
        Redux DevTools: {window.__REDUX_DEVTOOLS_EXTENSION__ ? 'Available' : 'Not Available'}
      </Text>
      <Text style={[styles.text, styles.devHint]}>
        For development, you can also add `devServer` query string to specify the WebSocket target
        to the app's dev server.
      </Text>
      <Text style={[styles.text, styles.devHint]}>For example:</Text>
      <Pressable
        onPress={() => {
          window.location.href = `${window.location.href}?devServer=localhost:8080`;
        }}
      >
        <Text style={[styles.text, styles.textLink]}>
          {`${window.location.href}?devServer=localhost:8080`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 400,
  },
  status: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  devHint: {
    color: '#666',
  },
  textLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
