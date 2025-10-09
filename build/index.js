export let devtools;
// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== "production") {
    const devtoolsModule = require("./withDevtools");
    devtools = devtoolsModule.devtools;
}
else {
    devtools = ((f) => f);
}
//# sourceMappingURL=index.js.map