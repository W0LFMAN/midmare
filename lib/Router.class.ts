import {Layer} from "./Layer.class";
import {Middleware} from "./Middleware.class";
import {Application} from "./Application.class";

export namespace Router {
    export class Router {
        protected stack: Layer.Layer[] = [];
        protected params = {};

        constructor(protected options: IOptions) {}

        use(path: Path | Middleware.Middleware | Middleware.Middleware[] | null, middleware?: Middleware.Middleware | Middleware.Middleware[]) {
            path = typeof path === 'string' ? path : null;
            middleware = !path && typeof path === 'function' ? path : middleware;

            middleware = Array.isArray(middleware) ? middleware : [middleware!];

            if (middleware.some(fn => typeof fn !== "function")) throw new TypeError('Middleware should be function or array of functions.');

            middleware.forEach(mw => {
                if (mw.router) {
                    const cloneRouter: Router = Object.assign(Object.create(Router.prototype), mw.router, {
                        stack: mw.router.stack.slice(0)
                    });

                    for (let j = 0; j < cloneRouter.stack.length; j++) {
                        const nestedLayer = cloneRouter.stack[j];
                        const cloneLayer = Object.assign(
                            Object.create(Layer.Layer.prototype),
                            nestedLayer
                        );

                        if (path) cloneLayer.setPrefix(path);
                        if (this.options.prefix) cloneLayer.setPrefix(this.options.prefix);
                        this.stack.push(cloneLayer);
                        cloneRouter.stack[j] = cloneLayer;
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
                    this.register(path as Path || '(.*)', mw, {end: false, ignoreCaptures: !path} as IOptions);
                }
            });
        }

        register(path: Path, middleware: Middleware.Middleware | Middleware.Middleware[], options: IOptions = {} as IOptions) {
            const stack = this.stack;

            const route = new Layer.Layer(path, middleware, {
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
            const layers = this.stack;
            let layer: Layer.Layer;
            const matched = {
                path: [] as Layer.Layer[],
                route: false
            };

            for (let len = layers.length, i = 0; i < len; i++) {
                layer = layers[i];

                if (layer.match(path)) {
                    matched.path.push(layer);
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
                let layerChain;

                if (ctx.matched) {
                    ctx.matched.push.apply(ctx.matched, matched.path);
                } else {
                    ctx.matched = matched.path;
                }

                ctx.router = router;

                if (!matched.route) return next();

                const matchedLayers = matched.path;
                const mostSpecificLayer = matchedLayers[matchedLayers.length - 1];
                ctx._matchedRoute = mostSpecificLayer.path;
                if (mostSpecificLayer.name) {
                    ctx._matchedRouteName = mostSpecificLayer.name;
                }

                layerChain = matchedLayers.reduce((memo, layer) => {
                    memo.push((ctx, next) => {
                        ctx.captures = layer.captures(path);
                        ctx.params = layer.params(ctx.captures, ctx.params);
                        ctx.routerName = layer.name;
                        return next();
                    });
                    return memo.concat(layer.stack);
                }, [] as Middleware.Middleware[]);

                return Application.Application.createCompose(layerChain)(ctx, next);
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