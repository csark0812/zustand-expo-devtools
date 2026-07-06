import { App } from "@redux-devtools/app-core";
import {
  useDevToolsPluginClient,
  type DevToolsPluginClient,
} from "expo/devtools";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import configureStore from "./store/configureStore";
import { StyleSheet, View } from "react-native";
import { AllActionsDrawer } from "./components/AllActionsDrawer";

declare global {
  interface Window {
    __connectDevToolsClient?: (client: DevToolsPluginClient) => void;
  }
}

const { store, persistor } = configureStore();

export const DevToolsApp = () => {
  const client = useDevToolsPluginClient("zustand-expo-devtools");

  useEffect(() => {
    if (client && window.__connectDevToolsClient) {
      console.log("[DevTools] Connecting client to Redux DevTools");
      window.__connectDevToolsClient(client);
    }
  }, [client]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <View style={styles.row}>
          <AllActionsDrawer />
          <View style={styles.flex1}>
            <App />
          </View>
        </View>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", flex: 1 },
  flex1: { flex: 1 },
});
