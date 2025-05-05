export let useZustandDevtools: typeof import('./useZustandDevtools').useZustandDevtools;

export let middleware: any;
// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== 'production') {
  useZustandDevtools = require('./useZustandDevtools').useZustandDevtools;
  middleware = require('./devtools').debuggerMiddleWare;
} else {
  useZustandDevtools = () => {};
  middleware = () => {};
}
