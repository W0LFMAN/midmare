"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const Router_class_1 = require("./Router.class");
const Context_class_1 = require("./Context.class");
var Application;
(function (Application_1) {
    class Application {
        constructor(options = {}) {
            this.options = options;
            this.__initialized = false;
            this.middleware = [];
            this.__timeout = () => {
                this.appTimeout = setTimeout(this.__timeout, 1000000000);
            };
            this.router = new Router_class_1.Router.Router({});
            if (options.withListen) {
                this.listen = this.init;
            }
        }
        init() {
            if (this.__initialized)
                return;
            if (!this.handler)
                this.reload();
            this.use(this.router.routes());
            this.__initialized = true;
            if (this.listen) {
                this.appTimeout = setTimeout(this.__timeout, 1000000000);
            }
            return this;
        }
        stop() {
            clearTimeout(this.appTimeout);
        }
        execute(ctx, fnWare) {
            fnWare(ctx).catch(ctx.error);
        }
        createContext(path) {
            this.context = new Context_class_1.Context.Context({
                app: this,
                path
            });
            return Object.create(this.context);
        }
        callback() {
            let mw = Application.createCompose(this.middleware);
            return (path, data, context) => {
                const newCtx = this.createContext(path);
                if (context) {
                    mw = Application.createCompose(this.middleware.filter(m => !!m.router));
                    newCtx.restore(context.store());
                }
                newCtx.set('data', data);
                this.execute(newCtx, mw);
            };
        }
        process(...args) {
            this.router.process(...args);
            return this;
        }
        use(fn) {
            if (typeof fn !== 'function')
                throw new TypeError('middleware must be a function.');
            this.middleware.push(fn);
            return this;
        }
        reload() {
            this.handler = this.callback();
        }
        send(path, data, ctx) {
            if (!this.handler || !this.__initialized)
                throw new Error('Application is not initialised.');
            this.handler(path, data, ctx);
        }
        static createCompose(arrFn) {
            let cyclicIgnore = new Set;
            if (!Array.isArray(arrFn))
                throw new TypeError('Argument should be an array');
            if (arrFn.some(item => typeof item !== 'function'))
                throw new TypeError('Collection should be an array of functions.');
            return function (context, next) {
                let index = -1;
                return exec(0);
                function exec(i) {
                    if (i <= index)
                        return Promise.reject(new Error('Function next() called multiple times'));
                    index = i;
                    let fn = arrFn[i];
                    if (i === arrFn.length)
                        fn = next;
                    if (!fn) {
                        cyclicIgnore = new Set;
                        return Promise.resolve();
                    }
                    try {
                        if (fn.router && !context.app.options.ignoreCyclicError && cyclicIgnore.has(context.path))
                            throw new Error('Cyclic calling with same `path`: `'.concat(context.path, '`, be careful'));
                        if (fn.router)
                            cyclicIgnore.add(context.path);
                        return Promise.resolve(fn(context, exec.bind(null, i + 1)));
                    }
                    catch (err) {
                        cyclicIgnore = new Set;
                        return Promise.reject(err);
                    }
                }
            };
        }
    }
    Application_1.Application = Application;
})(Application = exports.Application || (exports.Application = {}));
//# sourceMappingURL=Application.class.js.map