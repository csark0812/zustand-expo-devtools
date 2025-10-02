// Mock for expo/devtools module
export interface DevToolsPluginClient {
	sendMessage: jest.Mock;
	addMessageListener: jest.Mock;
}

export const getDevToolsPluginClientAsync = jest.fn(
	async (): Promise<DevToolsPluginClient> => {
		return {
			sendMessage: jest.fn(),
			addMessageListener: jest.fn(() => ({ remove: jest.fn() })),
		};
	}
);
