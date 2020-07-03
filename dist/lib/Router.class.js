"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const Route_class_1 = require("./Route.class");
const Application_class_1 = require("./Application.class");
const url = require("url");
const Context_class_1 = require("./Context.class");
const stream_1 = require("stream");
var Router;
(function (Router_1) {
    class Router {
        constructor(options) {
            this.options = options;
            this.stack = [];
            this.params = {};
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
                    this.register(hasPath ? path : '(.*)', mw, {
                        end: false,
                        ignoreCaptures: !hasPath
                    });
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
        routes(http = false) {
            const router = this;
            let dispatch = (ctx, next) => {
                const method = ctx.method.toLowerCase();
                if (method && http)
                    router.use(ctx => {
                        ctx.res.status = 404;
                        ctx.json({ json: 404 });
                    });
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
                    return memo.concat(method && http ?
                        route.stack.filter(mw => mw.method === method || !mw.method) :
                        route.stack);
                }, []);
                const composed = Application_class_1.Application.Application.createCompose(routeChain)(ctx, next);
                return http ? composed.then(() => ctx.__handleEnd()).catch(ctx.error) : composed;
            };
            dispatch.router = router;
            return dispatch;
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
    class HttpRouter extends Router {
        constructor(options) {
            super(options);
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
        extendContext(ctx, request, response) {
            Object.defineProperties(ctx, {
                originRequest: {
                    value: request,
                    configurable: false
                },
                originResponse: {
                    value: response,
                    configurable: false
                },
                req: {
                    value: request,
                    configurable: false
                },
                res: {
                    value: response,
                    configurable: false
                },
                request: {
                    value: request,
                    configurable: false
                },
                response: {
                    value: response,
                    configurable: false
                },
                method: {
                    get() {
                        return request.method;
                    },
                    configurable: false,
                },
                url: {
                    get() {
                        return request.url;
                    },
                    configurable: false,
                },
                path: {
                    get() {
                        return url.parse(request.url).pathname;
                    },
                    configurable: false,
                },
                headerSent: {
                    get() {
                        return response.headersSent;
                    },
                    configurable: false,
                },
                status: {
                    get() {
                        return response.statusCode;
                    },
                    set(code) {
                        ctx.assert(code >= 100 && code <= 999 &&
                            Number.isInteger(code) &&
                            Number.isFinite(code), new Error(`Invalid status code: ${code}, must be a number & in range 100 ~ 999.`));
                        response.statusCode = code;
                    },
                    configurable: false,
                },
                message: {
                    get() {
                        return response.statusMessage;
                    },
                    configurable: false,
                },
                body: {
                    get() {
                        return this._body;
                    },
                    set(value) {
                        const body = this._body = value;
                        if (value === null) {
                            this.status = 204;
                            this.remove('Content-Type');
                            this.remove('Content-Length');
                            this.remove('Transfer-Encoding');
                            return;
                        }
                        const hasContentType = !this.has('Content-Type');
                        if (Buffer.isBuffer(value)) {
                            if (hasContentType)
                                this.type = 'bin';
                            this.length = value.length;
                            return;
                        }
                        if (value instanceof stream_1.Stream) {
                            response.socket.once('finish', () => {
                                this.__responseEnded = true;
                                response.destroy();
                            });
                            if (body != value) {
                                value.once('error', err => this.ctx.onerror(err));
                                // overwriting
                                if (body !== null)
                                    this.remove('Content-Length');
                            }
                            if (hasContentType)
                                this.type = 'bin';
                            return;
                        }
                        if (typeof value === 'string') {
                            if (hasContentType)
                                this.type = /^\s*</.test(value) ? 'html' : 'text';
                            this.length = Buffer.byteLength(value);
                            return;
                        }
                        this.remove('Content-Length');
                        this.type = 'json';
                    },
                    configurable: false,
                },
                remove: {
                    value: function (field) {
                        if (this.headerSent)
                            return;
                        response.removeHeader(field);
                    },
                    configurable: false
                },
                set: {
                    value: function set(field, val) {
                        if (this.headerSent)
                            return;
                        if (arguments.length === 2) {
                            if (Array.isArray(val))
                                val = val.map(v => typeof v === 'string' ? v : String(v));
                            else if (typeof val !== 'string')
                                val = String(val);
                            response.setHeader(field, val);
                        }
                        else {
                            for (const key in field) {
                                this.set(key, field[key]);
                            }
                        }
                    },
                    configurable: false
                },
                get: {
                    value: function (field) {
                        const headers = typeof response.getHeaders === 'function'
                            ? response.getHeaders()
                            : response._headers || {};
                        if (!field)
                            return headers;
                        return headers[field.toLowerCase()] || '';
                    },
                    configurable: false
                },
                has: {
                    value: function (field) {
                        return typeof response.hasHeader === 'function'
                            ? response.hasHeader(field)
                            : field.toLowerCase() in this.headers;
                    },
                    configurable: false
                },
                type: {
                    get() {
                        const contentType = this.get('Content-Type');
                        if (!contentType)
                            return '';
                        return contentType.split(';', 1)[0];
                    },
                    set(contentType) {
                        if (contentType) {
                            this.set('Content-Type', contentType);
                        }
                        else {
                            this.remove('Content-Type');
                        }
                    },
                    configurable: false,
                },
                length: {
                    set(len) {
                        this.set('Content-Length', len);
                    },
                    configurable: false,
                },
                send: {
                    value(data) {
                        response.end(data);
                    },
                    configurable: false
                },
                end: {
                    value(data) {
                        response.end(data);
                    },
                    configurable: false
                },
                json: {
                    value(data) {
                        response.end(JSON.stringify(data));
                    },
                    configurable: false
                },
                __responseEnded: {
                    set(val) {
                        this._responseEnded = val;
                    },
                    get() {
                        return this._responseEnded;
                    },
                    configurable: false,
                    enumerable: false
                },
                __handleEnd: {
                    value() {
                        if (!this._responseEnded) {
                            if (this._body instanceof stream_1.Stream)
                                return this._body.pipe(response);
                            if (Buffer.isBuffer(this._body))
                                return response.end(this._body);
                            if (typeof this._body === 'string')
                                return response.end(this._body);
                            this.body = JSON.stringify(this._body);
                            if (!response.headersSent) {
                                ctx.length = Buffer.byteLength(this._body);
                            }
                            response.end(this._body);
                        }
                    },
                    enumerable: false,
                    configurable: false
                }
            });
            return ctx;
        }
        // Simple http routes handling.
        routes() {
            return (request, response) => {
                const ctx = Object.create(new Context_class_1.Context.Context({
                    path: url.parse(request.url).pathname,
                    app: { options: {} }
                }));
                this.extendContext(ctx, request, response);
                super.routes(true)(ctx, (err) => {
                    ctx.next && ctx.next(err);
                });
            };
        }
    }
    Router_1.HttpRouter = HttpRouter;
    Router_1.PathSeparator = '/';
})(Router = exports.Router || (exports.Router = {}));
//# sourceMappingURL=Router.class.js.map