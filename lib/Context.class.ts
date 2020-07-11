import {Application} from "./Application.class";
import {Middleware} from "./Middleware.class";
import { Router } from "./Router.class";
import { Route } from "./Route.class";

export namespace Context {
    import NextCallback = Middleware.NextCallback;
    import Dict = NodeJS.Dict;

    export class Context implements IContext {
        public params: Dict<string>;
        public captures: RegExpMatchArray;
        public matched: Route.Route[];
        public routerPath: string;
        public path: string;
        public router: Router.Router;
        public routerName: string;
        public _matchedRoute: string;
        public _matchedRouteName: string;
        public app: Application.Application;
        public __pathStory: Set<string> = new Set;
        [key: string]: any;

        constructor(protected readonly options: IOptions) {
            this.path = this.options.path;
            this.app = this.options.app;
        }

        public set<T extends any>(key: string, val: T): T {
            this[key] = val;
            return val;
        }

        public get(key: string): any {
            return this[key];
        }

        public error(err: Error): void {
            throw err;
        }

        public send<T>(path: Router.Path, data: T): Context {
            this.options.app.send(path, data, this);
            return this;
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