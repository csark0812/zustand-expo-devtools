const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../'); // wherever `plugin` lives

const config = getDefaultConfig(projectRoot);

// Allow importing from the workspace root
config.watchFolders = [workspaceRoot];

// Let Metro resolve the plugin package
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
