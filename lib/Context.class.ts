import {Application} from "./Application.class";
import {Middleware} from "./Middleware.class";
import { Router } from "./Router.class";
import { Layer } from "./Layer.class";

export namespace Context {
    import NextCallback = Middleware.NextCallback;
    import Dict = NodeJS.Dict;

    export class Context implements IContext {
        private __store: Map<string, any> = new Map;
        public next: NextCallback;
        public params: Dict<string>;
        public captures: string;
        public matched: Layer.Layer[] = [];
        public routerPath: string;
        public path: string;
        public router: Router.Router;
        public routerName: string;
        public _matchedRoute: string;
        public _matchedRouteName: string;

        constructor(protected readonly options: IOptions) {
            this.path = this.options.path;
        }

        set(key: string, val: any): any {
            this.__store.set(key, val);
            return val;
        }

        get(key: string): any {
            return this.__store.get(key);
        }

        store() {
            return new Map(this.__store);
        }

        restore(newStore: Map<string, any>) {
            return this.__store = newStore;
        }

        error(err: Error) {
            throw err;
        }

        send(path: Router.Path, data: any, saveCtxStore?: Context.Context) {
            this.options.app.send(path, data, saveCtxStore);
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