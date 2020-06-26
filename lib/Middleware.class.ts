import { Context } from "./Context.class";

export namespace Middleware {
    export class Middleware {
        public callback: NextCallback;
        constructor(protected readonly options: IOptions) {}
    }

    export interface NextCallback {
        (err: Error): void;
        param: string;
    }

    export interface IOptions {
        callback: (ctx: Context.Context, next: NextCallback) => void;
    }
}