import {
	type DispatchAction,
	getActiveInstance,
	LIFTED_ACTION,
	type LiftedActionAction,
	REMOVE_INSTANCE,
	type Request,
	showNotification,
	UPDATE_STATE,
} from "@redux-devtools/app-core";
import type { DevToolsPluginClient } from "expo/devtools";
import { stringify } from "jsan";
import type { Dispatch, MiddlewareAPI } from "redux";

import type { EmitAction, StoreAction } from "../actions";
import * as actions from "../constants/socketActionTypes";
import type { StoreState } from "../reducers";
import { nonReduxDispatch } from "../utils/monitorActions";

declare global {
	interface Window {
		__connectDevToolsClient?: (client: DevToolsPluginClient) => void;
	}
}

let devToolsPluginClient: DevToolsPluginClient | undefined;
let store: MiddlewareAPI<Dispatch<StoreAction>, StoreState>;

function emit({ message: type, instanceId, action, state }: EmitAction) {
	console.log("[DevTools] Emitting message:", {
		type,
		instanceId,
		action,
		state,
	});

	// For Zustand, we'll send messages directly to the app on the "dispatch" channel
	devToolsPluginClient?.sendMessage("dispatch", {
		type,
		action,
		state,
		instanceId,
	});
}

function dispatchRemoteAction({
	message,
	action,
	state,
	toAll,
}: LiftedActionAction) {
	console.log("[DevTools] Dispatching remote action:", {
		message,
		action,
		state,
		toAll,
	});
	const instances = store.getState().instances;
	const instanceId = getActiveInstance(instances);
	const id = !toAll && instances.options[instanceId].connectionId;
	store.dispatch({
		type: actions.EMIT,
		message,
		action,
		state: nonReduxDispatch(
			store,
			message,
			instanceId,
			action as DispatchAction,
			state,
			instances,
		),
		instanceId,
		id,
	});
}

interface RequestBase {
	id?: string;
	instanceId?: string;
}
interface DisconnectedAction extends RequestBase {
	type: "DISCONNECTED";
	id: string;
}
interface StartAction extends RequestBase {
	type: "START";
	id: string;
}
interface ErrorAction extends RequestBase {
	type: "ERROR";
	payload: string;
}
interface RequestWithData extends RequestBase {
	data: Request;
}
type MonitoringRequest =
	| DisconnectedAction
	| StartAction
	| ErrorAction
	| Request;

function monitoring(request: MonitoringRequest) {
	console.log("[DevTools] Processing monitoring request:", request);

	if (request.type === "DISCONNECTED") {
		store.dispatch({
			type: REMOVE_INSTANCE,
			id: request.id,
		});
		return;
	}
	if (request.type === "START") {
		store.dispatch({ type: actions.EMIT, message: "START", id: request.id });
		return;
	}

	if (request.type === "ERROR") {
		store.dispatch(showNotification(request.payload));
		return;
	}

	store.dispatch({
		type: UPDATE_STATE,
		request: (request as unknown as RequestWithData).data
			? { ...(request as unknown as RequestWithData).data, id: request.id }
			: request,
	});

	const instances = store.getState().instances;
	const instanceId = request.instanceId || request.id;
	if (
		instances.sync &&
		instanceId === instances.selected &&
		(request.type === "ACTION" || request.type === "STATE")
	) {
		devToolsPluginClient?.sendMessage("dispatch", {
			type: "SYNC",
			state: stringify(instances.states[instanceId]),
			id: request.id,
			instanceId,
		});
	}
}

function connect(client: DevToolsPluginClient) {
	devToolsPluginClient = client;
	console.log("[DevTools] Connected to Expo DevTools client");

	// Listen for Zustand store initialization
	client.addMessageListener("init", (data) => {
		console.log("[DevTools] Received init message:", data);
		monitoring({
			type: "INIT",
			payload: data.state,
			nextActionId: Date.now(), // Use timestamp as action ID
			maxAge: 50, // Keep last 50 actions
			id: data.name || "zustand-store",
			instanceId: data.name || "zustand-store",
		} as MonitoringRequest);
	});

	// Listen for state updates from Zustand
	client.addMessageListener("state", (data) => {
		console.log("[DevTools] Received state update:", data);
		monitoring({
			type: "ACTION",
			action: JSON.stringify({
				type: data.type || "State Update",
			}),
			payload: JSON.stringify({
				state: data.state,
			}),
			nextActionId: Date.now(), // Use timestamp as action ID
			maxAge: 50, // Keep last 50 actions
			id: data.name || "zustand-store",
			instanceId: data.name || "zustand-store",
		} as MonitoringRequest);
	});

	// Handle ping messages for testing
	client.addMessageListener("ping", (data) => {
		console.log("[DevTools] Received ping:", data);
		client.sendMessage("ping", { from: "devtools-ui" });
	});

	store.dispatch({ type: actions.EMIT, message: "START" });
}

export function api(inStore: MiddlewareAPI<Dispatch<StoreAction>, StoreState>) {
	store = inStore;
	// We'll connect when the client is available
	// This will be called from the main App component
	window.__connectDevToolsClient = connect;

	return (next: Dispatch<StoreAction>) => (action: StoreAction) => {
		const result = next(action);
		switch (action.type) {
			case actions.EMIT:
				if (devToolsPluginClient) emit(action);
				break;
			case LIFTED_ACTION:
				dispatchRemoteAction(action);
				break;
		}
		return result;
	};
}
