export let expoDevtools: typeof import("./withExpoDevtools").expoDevtools;

// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== "production") {
	const devtoolsModule = require("./withExpoDevtools");
	expoDevtools = devtoolsModule.expoDevtools;
} else {
	expoDevtools = ((f) => f) as typeof import("./withExpoDevtools").expoDevtools;
}
