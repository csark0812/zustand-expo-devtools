declare module 'jsan' {
	export function stringify(value: any, replacer?: any, space?: number | string, _options?: any): string;
	export function parse(text: string, reviver?: any): any;
}
