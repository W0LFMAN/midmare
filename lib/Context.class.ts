import {Application} from "./Application.class";
import {Middleware} from "./Middleware.class";
import { Router } from "./Router.class";
import { Route } from "./Route.class";

export namespace Context {
    import NextCallback = Middleware.NextCallback;
    import Dict = NodeJS.Dict;

    export class Context implements IContext {
        private __store: Map<string, any> = new Map;
        public params: Dict<string>;
        public captures: string;
        public matched: Route.Route[] = [];
        public routerPath: string;
        public path: string;
        public router: Router.Router;
        public routerName: string;
        public _matchedRoute: string;
        public _matchedRouteName: string;
        public app: Application.Application;
        public __pathStory: Set<string> = new Set;

        constructor(protected readonly options: IOptions) {
            this.path = this.options.path;
            this.app = this.options.app;
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

        send(path: Router.Path, data: any) {
            this.options.app.send(path, data, this);
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