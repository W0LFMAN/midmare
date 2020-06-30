import {Route} from "./Route.class";
import {Middleware} from "./Middleware.class";
import {Application} from "./Application.class";

export namespace Router {
    export class Router {
        protected stack: Route.Route[] = [];
        protected params = {};

        constructor(protected options: IOptions) {}

        use(path: Path | Middleware.Middleware | Middleware.Middleware[] | null, middleware?: Middleware.Middleware | Middleware.Middleware[]) {
            middleware = typeof path === 'function' ? path : middleware;
            const hasPath = typeof path === 'string';

            middleware = Array.isArray(middleware) ? middleware : [middleware!];

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

                        if (hasPath) cloneRoute.setPrefix(path);
                        if (this.options.prefix) cloneRoute.setPrefix(this.options.prefix);
                        this.stack.push(cloneRoute);
                        cloneRouter.stack[j] = cloneRoute;
                    }

                    if (this.params) {
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
                    this.register(hasPath ? path as Path : '(.*)', mw, {end: false, ignoreCaptures: !hasPath} as IOptions);
                }
            });
        }

        register(path: Path, middleware: Middleware.Middleware | Middleware.Middleware[], options: IOptions = {} as IOptions) {
            const stack = this.stack;

            const route = new Route.Route(path, middleware, {
                end: !options.end ? options.end : true,
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

        route(name) {
            const routes = this.stack;
            for (let len = routes.length, i = 0; i < len; i++) {
                if (routes[i].name && routes[i].name === name) return routes[i];
            }
            return false;
        }

        match(path) {
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

        param(param, middleware) {
            this.params[param] = middleware;
            for (let i = 0; i < this.stack.length; i++) {
                const route = this.stack[i];
                route.param(param, middleware);
            }

            return this;
        }

        routes() {
            const router = this;

            let dispatch: Middleware.Middleware = (ctx, next) => {
                const path = router.options.routerPath || ctx.routerPath || ctx.path;
                const matched = router.match(path);
                let routeChain;

                if (ctx.matched) {
                    ctx.matched.push.apply(ctx.matched, matched.path);
                } else {
                    ctx.matched = matched.path;
                }

                ctx.router = router;

                if (!matched.route) return next();

                const matchedRoutes = matched.path;
                const mostSpecificRoute = matchedRoutes[matchedRoutes.length - 1];
                ctx._matchedRoute = mostSpecificRoute.path;
                if (mostSpecificRoute.name) {
                    ctx._matchedRouteName = mostSpecificRoute.name;
                }

                routeChain = matchedRoutes.reduce((memo, route) => {
                    memo.push((ctx, next) => {
                        ctx.captures = route.captures(path);
                        ctx.params = route.params(ctx.captures, ctx.params);
                        ctx.routerName = route.name;
                        return next();
                    });
                    return memo.concat(route.stack);
                }, [] as Middleware.Middleware[]);

                return Application.Application.createCompose(routeChain)(ctx, next);
            };

            dispatch.router = router;

            return dispatch;
        }

        process(name?: any, path?: any, middleware?: Middleware.Middleware | Middleware.Middleware[]) {
            if (typeof path === "string" || path instanceof RegExp) {
                middleware = Array.prototype.slice.call(arguments, 2);
            } else {
                middleware = Array.prototype.slice.call(arguments, 1);
                path = name;
                name = null;
            }

            this.register(path, middleware!, {
                name: name
            } as IOptions);

            return this;
        }
    }

    export interface IOptions {
        prefix: string;
        strict: string;
        sensitive: string;
        ignoreCaptures: boolean;
        end: boolean;
        name: string;
        routerPath: string;
    }

    export const PathSeparator = '/';
    export type Path = string;
}