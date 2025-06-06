// @ts-nocheck - TypeScript doesn't recognize that devtools and zustand are using the same
// zustand package for this example because devtools is referencing files via alias
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useShallow } from "zustand/react/shallow";
import { devtools } from "@csark0812/zustand-expo-devtools";

// AsyncStorage adapter for Zustand
const asyncStorage = {
	getItem: async (name: string) => {
		const value = await AsyncStorage.getItem(name);
		return value ?? null;
	},
	setItem: async (name: string, value: string) => {
		return AsyncStorage.setItem(name, value);
	},
	removeItem: async (name: string) => {
		return AsyncStorage.removeItem(name);
	},
};

// Define the store state interface
export interface AppState {
	// Counter example
	count: number;
	increment: () => void;
	decrement: () => void;
	reset: () => void;

	// User preferences example
	preferences: {
		theme: "light" | "dark" | "auto";
		notifications: boolean;
		language: string;
	};
	updatePreferences: (preferences: Partial<AppState["preferences"]>) => void;

	// Todo list example
	todos: Array<{
		id: string;
		text: string;
		completed: boolean;
		createdAt: Date;
	}>;
	addTodo: (text: string) => void;
	toggleTodo: (id: string) => void;
	removeTodo: (id: string) => void;
}

// Store factory function
function createAppStore() {
	return create<AppState>()(
		devtools(
			persist(
				immer((set, get) => ({
					// Counter state
					count: 0,
					increment: () =>
						set(
							(state) => {
								state.count += 1;
							},
							undefined,
							"increment",
						),
					decrement: () =>
						set(
							(state) => {
								state.count -= 1;
							},
							undefined,
							"decrement",
						),
					reset: () =>
						set(
							(state) => {
								state.count = 0;
							},
							undefined,
							"reset",
						),

					// User preferences state
					preferences: {
						theme: "auto" as const,
						notifications: true,
						language: "en",
					},
					updatePreferences: (newPreferences) =>
						set(
							(state) => {
								Object.assign(state.preferences, newPreferences);
							},
							undefined,
							"updatePreferences",
						),

					// Todo list state
					todos: [],
					addTodo: (text) =>
						set(
							(state) => {
								state.todos.push({
									id: Date.now().toString(),
									text,
									completed: false,
									createdAt: new Date(),
								});
							},
							undefined,
							"addTodo",
						),
					toggleTodo: (id) =>
						set(
							(state) => {
								const todo = state.todos.find(
									(t: AppState["todos"][0]) => t.id === id,
								);
								if (todo) {
									todo.completed = !todo.completed;
								}
							},
							undefined,
							"toggleTodo",
						),
					removeTodo: (id) =>
						set(
							(state) => {
								const index = state.todos.findIndex(
									(t: AppState["todos"][0]) => t.id === id,
								);
								if (index !== -1) {
									state.todos.splice(index, 1);
								}
							},
							undefined,
							"removeTodo",
						),
				})),
				{
					name: "app-storage", // unique name
					storage: createJSONStorage(() => asyncStorage),
					// Optionally, you can specify which parts of the state to persist
					partialize: (state: AppState) => ({
						count: state.count,
						preferences: state.preferences,
						todos: state.todos,
					}),
				},
			),
			{
				name: "App Store", // Name for the devtools instance
			},
		),
	);
}

// Create the store with automatic devtools initialization
const store = createAppStore();

// Export store hook
export function useAppStore<T>(selector: (state: AppState) => T): T;
export function useAppStore(): AppState;
export function useAppStore<T>(
	selector?: (state: AppState) => T,
): T | AppState {
	if (selector) {
		return store(selector);
	}
	return store();
}

// Selectors for optimized re-renders
export const useCount = () => useAppStore(useShallow((state) => state.count));
export const useCountActions = () =>
	useAppStore(
		useShallow((state) => ({
			increment: state.increment,
			decrement: state.decrement,
			reset: state.reset,
		})),
	);

export const usePreferences = () =>
	useAppStore(useShallow((state) => state.preferences));
export const useUpdatePreferences = () =>
	useAppStore(useShallow((state) => state.updatePreferences));

export const useTodos = () => useAppStore(useShallow((state) => state.todos));
export const useTodoActions = () =>
	useAppStore(
		useShallow((state) => ({
			addTodo: state.addTodo,
			toggleTodo: state.toggleTodo,
			removeTodo: state.removeTodo,
		})),
	);
