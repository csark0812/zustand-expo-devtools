import { middlewares } from "@redux-devtools/app-core";
import localForage from "localforage";
import { createStore, compose, applyMiddleware } from "redux";
import { persistReducer, persistStore, type Persistor } from "redux-persist";
import type { Store } from "redux";
import type { PersistPartial } from "redux-persist/es/persistReducer";

import { api } from "../middlewares/api";
import { rootReducer, type StoreState } from "../reducers";
import type { StoreAction } from "../actions";

const persistConfig = {
	key: "zustand-devtools",
	blacklist: ["instances", "socket"],
	storage: localForage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default function configureStore(): {
	store: Store<StoreState & PersistPartial, StoreAction>;
	persistor: Persistor;
} {
	let composeEnhancers = compose;
	if (process.env.NODE_ENV !== "production") {
		if (
			(
				window as unknown as {
					__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
				}
			).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
		) {
			composeEnhancers = (
				window as unknown as {
					__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose;
				}
			).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
		}
	}

	const store = createStore(
		persistedReducer,
		composeEnhancers(
			applyMiddleware(
				...middlewares,
				api as Parameters<typeof applyMiddleware>[0],
			),
		),
	) as unknown as Store<StoreState & PersistPartial, StoreAction>;
	const persistor = persistStore(store as Parameters<typeof persistStore>[0]);
	return { store, persistor };
}
