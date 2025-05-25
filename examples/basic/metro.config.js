const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

// Add the root directory to the resolver to properly handle the local plugin
config.resolver.nodeModulesPaths = [
	path.resolve(__dirname, "node_modules"),
	path.resolve(__dirname, "../../node_modules"),
];

// Add the root directory to watchFolders so Metro watches for changes in the plugin
config.watchFolders = [path.resolve(__dirname, "../../")];

// Ensure proper resolution of the local plugin
config.resolver.alias = {
	"@csark0812/zustand-expo-devtools": path.resolve(__dirname, "../../"),
};

module.exports = config;
