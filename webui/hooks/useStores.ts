import { type EventSubscription, useDevToolsPluginClient } from 'expo/devtools';
import { useEffect, useRef, useState } from 'react';

const useStores = () => {
  const client = useDevToolsPluginClient('zustand-expo-devtools');
  const storeRefs = useRef<any>({});
  const [stores, setStores] = useState<any>({});

  useEffect(() => {
    const extension = (window as any)?.__REDUX_DEVTOOLS_EXTENSION__;
    console.log('extension', extension);
    if (extension) {
      const subscriptions: EventSubscription[] = [];

      subscriptions.push(
        client?.addMessageListener('ping', data => {
          console.log('ping', data);
          if (data.type === 'INIT') {
            storeRefs.current[data.name]?.init(data.data);
            // Create a new key in stores and initiate an array for that key
            setStores((prevStores: any) => ({
              ...prevStores,
              [data.name]: [{ action: 'INIT', store: {}, actionData: data.data }],
            }));
          }

          if (data.type === 'UPDATE') {
            storeRefs.current[data.name]?.send('UPDATE', data.data);
            // Update stores with the new data
            setStores((prevStores: any) => {
              const storeArray = prevStores[data.name] || [];
              const lastItem =
                storeArray.length > 0 ? storeArray[storeArray.length - 1] : { actionData: {} };
              return {
                ...prevStores,
                [data.name]: [
                  ...storeArray,
                  {
                    action: 'UPDATE',
                    store: lastItem.actionData,
                    actionData: data.data,
                  },
                ],
              };
            });
          }
        }),
      );

      return () => {
        for (const subscription of subscriptions) {
          subscription?.remove();
        }
      };
    }
  }, [client]);

  const storeNames = Object.keys(stores);
  return { stores, storeNames };
};

export default useStores;
