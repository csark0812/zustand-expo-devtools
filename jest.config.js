module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/webui/src'],
	testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'webui/src/**/*.ts',
		'!src/**/*.d.ts',
		'!webui/src/**/*.d.ts',
		'!**/node_modules/**',
		'!**/build/**',
		'!**/dist/**',
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: {
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
				jsx: 'react',
				types: ['node', 'jest'],
				skipLibCheck: true,
			},
		}],
	},
	moduleNameMapper: {
		'^expo/devtools$': '<rootDir>/__mocks__/expo-devtools.ts',
		'^@redux-devtools/app-core$': '<rootDir>/__mocks__/@redux-devtools/app-core.ts',
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	globals: {
		'process.env.NODE_ENV': 'test',
	},
};
