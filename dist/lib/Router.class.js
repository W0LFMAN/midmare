"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const Route_class_1 = require("./Route.class");
const Application_class_1 = require("./Application.class");
const url = require("url");
const Context_class_1 = require("./Context.class");
var Router;
(function (Router_1) {
    class Router {
        constructor(options) {
            this.options = options;
            this.stack = [];
            this.params = {};
            if (options.httpHandler === true) {
                this.use(async (ctx, next) => {
                    try {
                        await next();
                    }
                    catch (err) {
                        ctx.json({
                            status: 500,
                            error: {
                                name: err.name,
                                message: err.message,
                                stack: err.stack
                            },
                        });
                    }
                });
            }
        }
        use(path, middleware) {
            middleware = typeof path === 'function' ? path : middleware;
            const hasPath = typeof path === 'string';
            middleware = Array.isArray(middleware) ? middleware : [middleware];
            if (middleware.some(fn => typeof fn !== "function"))
                throw new TypeError('Middleware should be function or array of functions.');
            middleware.forEach(mw => {
                if (mw.router) {
                    const cloneRouter = Object.assign(Object.create(Router.prototype), mw.router, {
                        stack: mw.router.stack.slice(0)
                    });
                    for (let j = 0; j < cloneRouter.stack.length; j++) {
                        const nestedRoute = cloneRouter.stack[j];
                        const cloneRoute = Object.assign(Object.create(Route_class_1.Route.Route.prototype), nestedRoute);
                        if (hasPath)
                            cloneRoute.setPrefix(path);
                        if (this.options.prefix)
                            cloneRoute.setPrefix(this.options.prefix);
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
                }
                else {
                    this.register(hasPath ? path : '(.*)', mw, { end: false, ignoreCaptures: !hasPath });
                }
            });
            return this;
        }
        register(path, middleware, options = {}) {
            const stack = this.stack;
            const route = new Route_class_1.Route.Route(path, middleware, {
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
                if (routes[i].name && routes[i].name === name)
                    return routes[i];
            }
            return false;
        }
        match(path) {
            const routes = this.stack;
            let route;
            const matched = {
                path: [],
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
            let dispatch = (ctx, next) => {
                const method = ctx.method.toLowerCase();
                if (method && router.options.httpHandler)
                    router.use(ctx => { ctx.res.status = 404; ctx.json({ json: 404 }); });
                const path = router.options.routerPath || ctx.routerPath || ctx.path;
                const matched = router.match(path);
                let routeChain;
                if (ctx.matched) {
                    ctx.matched.push.apply(ctx.matched, matched.path);
                }
                else {
                    ctx.matched = matched.path;
                }
                ctx.router = router;
                if (!matched.route)
                    return next();
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
                    return memo.concat(method && router.options.httpHandler ?
                        route.stack.filter(mw => mw.method === method || !mw.method) :
                        route.stack);
                }, []);
                return Application_class_1.Application.Application.createCompose(routeChain)(ctx, next);
            };
            dispatch.router = router;
            return dispatch;
        }
        // Simple http routes handling.
        httpRoutes() {
            if (!this.options.httpHandler)
                throw new Error('Router should be with option `httpHandler: true`');
            return (request, response) => {
                const ctx = Object.create(new Context_class_1.Context.Context({ path: url.parse(request.url).pathname, app: { options: {} } }));
                const req = {
                    req: request,
                    res: response,
                    get method() { return this.req.method; },
                    get url() { return this.req.url; },
                    get path() { return url.parse(this.url).pathname; },
                };
                const res = {
                    ctx,
                    req: request,
                    res: response,
                    app: ctx.app,
                    get headersSent() {
                        return this.res.headersSent;
                    },
                    get status() {
                        return this.res.statusCode;
                    },
                    set status(code) {
                        ctx.assert(code >= 100 && code <= 999 &&
                            Number.isInteger(code) &&
                            Number.isFinite(code), new Error(`Invalid status code: ${code}, must be a number & not out of range 100 ~ 999.`));
                        this.res.statusCode = code;
                    },
                    get message() {
                        return this.res.statusMessage;
                    },
                    set message(message) {
                        this.res.statusMessage = message;
                    },
                    send(...args) {
                        this.end(...args);
                    },
                    end(...args) {
                        this.res.end(...args);
                    },
                    json(obj) {
                        this.status = 200;
                        this.res.setHeader('Content-Type', 'application/json');
                        this.res.end(JSON.stringify(obj));
                    },
                    redirect(url) {
                        this.res.setHeader('Location', url);
                        this.res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                        this.status = 302;
                        this.end('Redirecting...');
                    }
                };
                ctx.request = request;
                ctx.req = req;
                ctx.response = response;
                ctx.res = res;
                ctx.url = req.url;
                ctx.method = req.method;
                ctx.send = res.send.bind(res);
                ctx.end = res.end.bind(res);
                ctx.json = res.json.bind(res);
                ctx.redirect = res.redirect.bind(res);
                this.routes()(ctx, (err) => { ctx.next && ctx.next(err); });
            };
        }
        process(name, path, middleware) {
            if (typeof path === "string" || path instanceof RegExp) {
                middleware = Array.prototype.slice.call(arguments, 2);
            }
            else {
                middleware = Array.prototype.slice.call(arguments, 1);
                path = name;
                name = null;
            }
            this.register(path, middleware, {
                name: name
            });
            return this;
        }
    }
    Router_1.Router = Router;
    Router_1.PathSeparator = '/';
})(Router = exports.Router || (exports.Router = {}));
//# sourceMappingURL=Router.class.js.map