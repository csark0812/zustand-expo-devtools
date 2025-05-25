// Utility function for handling non-Redux dispatch actions
// This is adapted from the redux-devtools-expo-dev-plugin implementation
import type { DispatchAction, InstancesState } from "@redux-devtools/app-core";
import type { Dispatch, MiddlewareAPI } from "redux";
import type { StoreAction } from "../actions";
import type { StoreState } from "../reducers";

export function nonReduxDispatch(
	store: MiddlewareAPI<Dispatch<StoreAction>, StoreState>,
	message: string,
	instanceId: string | number,
	action: DispatchAction,
	state: unknown,
	instances?: InstancesState,
): unknown {
	// For Zustand stores, we typically just return the state as-is
	// since the dispatching is handled by the Zustand store itself
	// Handle JUMP_TO_ACTION to retrieve state from action history

	let nextState = state;

	if (message === "DISPATCH") {
		const nextStoreState = instances?.states?.[instanceId];
		if (nextStoreState) {
			const nextStateIndex =
				action?.type === "ROLLBACK" ? 0 : nextStoreState.currentStateIndex;
			const computedState =
				nextStoreState.computedStates[nextStateIndex]?.state;
			// Try to access .state if it exists, otherwise fallback to computedState itself
			nextState =
				computedState &&
				typeof computedState === "object" &&
				"state" in computedState
					? (computedState as { state: unknown }).state
					: computedState;
		}
	}

	console.log("[DevTools] Non-Redux dispatch:", {
		message,
		instanceId,
		action,
		state: nextState,
		test: instances?.states?.[instanceId],
	});
	return JSON.stringify(nextState);
}
