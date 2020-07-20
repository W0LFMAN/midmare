import {Route} from "./Route.class";
import {Middleware} from "./Middleware.class";
import {Application} from "./Application.class";

export namespace Router {

    export class Router {
        protected stack: Route.Route[] = [];
        protected params = {};

        constructor(protected readonly options: IOptions = {}) {}

        public use(path: Path | Middleware.Middleware | Middleware.Middleware[] | null, middleware?: Middleware.Middleware | Middleware.Middleware[]): Router {
            middleware = typeof path === 'function' ? path : middleware;
            const hasPath = typeof path === 'string';

            middleware = Array.isArray(middleware) ? middleware as Middleware.Middleware[] : [middleware] as Middleware.Middleware[];

            if (middleware.some(fn => typeof fn !== "function")) throw new TypeError('Middleware should be function or array of functions.');

            middleware.forEach(mw => {
                if (mw.router) {
                    const cloneRouter: Router = Object.assign(Object.create(Router.prototype), mw.router, {
                        stack: mw.router.stack.slice(0)
                    });

                    for (let j = 0; j < cloneRouter.stack.length; j++) {
                        const nestedRoute = cloneRouter.stack[j];
                        const cloneRoute = Object.assign(
                            Object.create(Route.Route.prototype),
                            nestedRoute
                        );

                        if (hasPath) cloneRoute.setPrefix(path as string);
                        if (this.options.prefix) cloneRoute.setPrefix(this.options.prefix);
                        this.stack.push(cloneRoute);
                        cloneRouter.stack[j] = cloneRoute;
                    }

                    if (Object.keys(this.params).length) {
                        const setRouterParams = (paramArr) => {
                            const routerParams = paramArr;
                            for (let j = 0; j < routerParams.length; j++) {
                                const key = routerParams[j];
                                cloneRouter.param(key, this.params[key]);
                            }
                        };

                        setRouterParams(Object.keys(this.params));
                    }
                } else {
                    this.register(hasPath ? path as Path : '(.*)', mw, {
                        end: false,
                        ignoreCaptures: !hasPath
                    } as IOptions);
                }
            });
            return this;
        }

        public register(path: Path, middleware: Middleware.Middleware | Middleware.Middleware[], options: IOptions): Route.Route {
            const stack = this.stack;
            options = Object.assign({}, options);

            const route = new Route.Route(path, middleware, {
                end: options.end === false ? options.end : true,
                name: options.name,
                sensitive: options.sensitive || this.options.sensitive || false,
                strict: options.strict || this.options.strict || false,
                prefix: options.prefix || this.options.prefix || "",
                ignoreCaptures: options.ignoreCaptures
            });

            if (this.options.prefix) {
                route.setPrefix(this.options.prefix);
            }


            for (let i = 0; i < Object.keys(this.params).length; i++) {
                const param = Object.keys(this.params)[i];
                route.param(param, this.params[param]);
            }

            stack.push(route);

            return route;
        }

        public route(name: string): Route.Route | false {
            const routes = this.stack;

            for (let len = routes.length, i = 0; i < len; i++) {
                if (routes[i].name && routes[i].name === name) return routes[i];
            }

            return false;
        }

        public match(path: string): { path: Route.Route[], route: boolean } {
            const routes = this.stack;
            let route: Route.Route;
            const matched = {
                path: [] as Route.Route[],
                route: false
            };

            for (let len = routes.length, i = 0; i < len; i++) {
                route = routes[i];

                if (route.match(path)) {
                    matched.path.push(route);
                    matched.route = true;
                }
            }

            return matched;
        }

        public param(param: string, middleware: (...args: any[]) => any): Router {
            this.params[param] = middleware;
            for (let i = 0; i < this.stack.length; i++) {
                const route = this.stack[i];
                route.param(param, middleware);
            }

            return this;
        }

        public routes(): Middleware.Middleware {
            const dispatch: Middleware.Middleware = (ctx, next) => {
                const path = this.options.routerPath || ctx.routerPath || ctx.path;

                const matched = this.match(path);

                if (ctx.matched) {
                    ctx.matched.push(...matched.path);
                } else {
                    ctx.matched = matched.path;
                }

                ctx.router = this;

                if (!matched.route) return next();

                const matchedRoutes = matched.path;
                const mostSpecificRoute = matchedRoutes[matchedRoutes.length - 1];
                ctx._matchedRoute = mostSpecificRoute.path;
                if (mostSpecificRoute.name) {
                    ctx._matchedRouteName = mostSpecificRoute.name;
                }

                const routeChain = matchedRoutes.reduce((memo, route) => {
                    memo.push((ctx, next) => {
                        ctx.captures = route.captures(path);
                        ctx.params = route.params(ctx.captures, ctx.params);
                        ctx.routerName = route.name;
                        return next();
                    });
                    return memo.concat(route.stack);
                }, [] as Middleware.Middleware[]);

                return Application.Application.createCompose(routeChain)(ctx, next).catch(ctx.error);
            };

            dispatch.router = this;

            return dispatch;
        }

        public process(name?: string, path?: Path, middleware?: Middleware.Middleware | Middleware.Middleware[]): Router {
            if (typeof path === "string") {
                middleware = Array.prototype.slice.call(arguments, 2);
            } else {
                middleware = Array.prototype.slice.call(arguments, 1);
                path = name;
                name = '';
            }

            this.register(path as Path, middleware as Middleware.Middleware, {
                name: name
            } as IOptions);

            return this;
        }
    }

    export interface IOptions {
        prefix?: string;
        strict?: boolean;
        sensitive?: boolean;
        ignoreCaptures?: boolean;
        end?: boolean;
        name?: string;
        routerPath?: string;
    }

    export type Path = string;
}