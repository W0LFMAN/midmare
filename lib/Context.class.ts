import {Application} from "./Application.class";
import {Middleware} from "./Middleware.class";

export namespace Context {
    import NextCallback = Middleware.NextCallback;
    import Dict = NodeJS.Dict;

    export class Context implements IContext {
        public next: NextCallback;
        public params: Dict<string>;

        constructor(protected readonly options: IOptions) {}

        set(key: string, val: any): any {
            this[key] = val;
            return val;
        }

        get(key: string): any {
            return this[key];
        }

        error(err: Error) {
            throw err;
        }
    }

    export interface IContext {
        next?: NextCallback;
        [key: string]: any;
    }

    export interface IOptions {
        app: Application.Application;
        [key: string]: any;
    }
}