import {Middleware} from "./Middleware.class";
import {Route} from "./Route.class";
import {Context} from "./Context.class";
import {Application} from "./Application.class";
import {pathToRegexp} from 'path-to-regexp';

export namespace Router {
    export class Router {
        protected readonly nestedRouters: boolean = false;

        protected readonly middleware: Set<Middleware.Middleware> = new Set;
        protected readonly routesStack: Map<string, Route.Route> = new Map;
        protected readonly routerStack: Map<string, Router.Router> = new Map;

        protected constructor(protected readonly options: IOptions) {
        }

        protected find(path: string) {
            const regex = pathToRegexp(path);
                const
            result: Route.Route[] = [];

            this.routesStack.forEach((value, routePath) => {
                const full = [this.options.path, routePath].join(PathSeparator).replace(/\/+/g, PathSeparator);
                if (regex.test(full)) {
                    result.push(value);
                }
            });

            if (this.nestedRouters) {
                this.routerStack.forEach((value, routerPath) => {
                    const pathWithRouter = [this.options.path, routerPath];
                    value.getRoutes().forEach((value, routePath) => {
                        const full = pathWithRouter.concat(routePath).join(PathSeparator).replace(/\/+/g, PathSeparator);
                        if (regex.test(full)) {
                            result.push(value);
                        }
                    })
                })
            }

            return result;
        }

        protected add(route: Route.Route | Middleware.Middleware | Router.Router) {
        }

        protected execute(path: string) {
            const ctx: Context.Context = new Context.Context({app: this.options.app});
            const entries = this.middlewaresStack.entries();

            const finded = this.find(path);


        }

        protected remove(route: Route.Route | Middleware.Middleware | Router.Router) {
        }

        public getRoutes() {
            return new Map(this.routesStack);
        }
    }

    export class Global extends Router {
        protected readonly nestedRouters: boolean = true;

        protected constructor(options: IOptions) {
            super(options);
        }

        public static create(options: IOptions): Global {
            return new Global(options);
        }
    }

    export interface IOptions {
        app: Application.Application;
        path: string;
    }

    export const PathSeparator = '/';
    export type Path = string;
}