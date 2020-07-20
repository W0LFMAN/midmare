import {Application} from "./Application.class";
import {Middleware} from "./Middleware.class";
import { Router } from "./Router.class";
import { Route } from "./Route.class";
import { EventEmitter } from "events";

export namespace Context {
    import NextCallback = Middleware.NextCallback;
    import Dict = NodeJS.Dict;

    export class Context extends EventEmitter implements IContext {
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
        public __pathStory: Set<string>;
        [key: string]: any;

        constructor(public readonly options: IOptions) {
            super();
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
            this.app.emit('error', err);
        }

        public send<T>(path: Router.Path, data: T): Context {
            this.app.send(path, data, this);
            return this;
        }

        public static clone(ctx: Context): Context {
            const context = Object.create(new Context(ctx.options));

            for(const key in ctx) {
                if(ctx.hasOwnProperty(key)) {
                    context[key] = ctx[key];
                }
            }

            return context;
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