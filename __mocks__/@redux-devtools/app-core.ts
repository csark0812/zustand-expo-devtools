// Mock for @redux-devtools/app-core module
export const LIFTED_ACTION = '@@DEVTOOLS/LIFTED_ACTION';
export const UPDATE_STATE = '@@DEVTOOLS/UPDATE_STATE';
export const REMOVE_INSTANCE = '@@DEVTOOLS/REMOVE_INSTANCE';

export interface LiftedActionAction {
	type: typeof LIFTED_ACTION;
	message: 'DISPATCH' | 'ACTION' | 'EXPORT' | 'IMPORT';
	action?: any;
	state?: any;
	toAll?: boolean;
}

export interface UpdateStateAction {
	type: typeof UPDATE_STATE;
	request: any;
}

export interface DispatchAction {
	type: string;
	[key: string]: any;
}

export interface InstancesState {
	selected: string;
	current: string;
	sync: boolean;
	connections: Record<string, any>;
	options: Record<string, any>;
	states: Record<string, {
		actionsById: Record<string, any>;
		computedStates: Array<{ state: any; error?: string }>;
		currentStateIndex: number;
		nextActionId: number;
		stagedActionIds: number[];
		skippedActionIds: number[];
		committedState: any;
	}>;
}

export interface CoreStoreState {
	instances: InstancesState;
	monitor: any;
	notification: any;
	section: any;
	theme: any;
}

export const getActiveInstance = (instances: InstancesState): string => {
	return instances.selected || instances.current;
};

export const showNotification = (message: string) => ({
	type: '@@NOTIFICATION/SHOW',
	message,
});

// Mock core reducers
export const coreReducers = {
	instances: (state = {
		selected: '',
		current: '',
		sync: false,
		connections: {},
		options: {},
		states: {},
	}, action: any) => state,
	monitor: (state = {}, action: any) => state,
	notification: (state = {}, action: any) => state,
	section: (state = 'log', action: any) => state,
	theme: (state = 'default', action: any) => state,
};
