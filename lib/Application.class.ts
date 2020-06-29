import {Router} from "./Router.class";
import {Context} from "./Context.class";
import {Middleware} from "./Middleware.class";

export namespace Application {
    import Path = Router.Path;

    export class Application {
        protected __initialized: boolean = false;
        protected context: Context.Context;
        protected readonly router: Router.Router;
        protected readonly middleware: Middleware.Middleware[] = [];
        protected handler: (path: Path, data: any, ctx?: Context.Context) => void;
        protected appTimeout: NodeJS.Timeout;
        public readonly listen: Function;

        constructor(public readonly options: IOptions = {}) {
            this.router = new Router.Router({} as Router.IOptions);
            if(options.withListen) {
                this.listen = this.init;
            }
        }

        public init() {
            if(this.__initialized) return;
            if(!this.handler) this.reload();
            this.use(this.router.routes());
            this.__initialized = true;

            if(this.listen) {
                this.appTimeout = setTimeout(this.__timeout,1000000000);
            }

            return this;
        }

        public stop() {
            clearTimeout(this.appTimeout);
        }

        protected __timeout = () => {
            this.appTimeout = setTimeout(this.__timeout,1000000000);
        };

        protected execute(ctx: Context.Context, fnWare) {
            fnWare(ctx).catch(ctx.error);
        }

        protected createContext(path: Path) {
            this.context = new Context.Context({
                app: this,
                path
            });

            return Object.create(this.context);
        }

        protected callback() {
            let mw = Application.createCompose(this.middleware);

            return (path: Path, data: any, context?: Context.Context) => {
                const newCtx = this.createContext(path);

                if(context) {
                    mw = Application.createCompose(this.middleware.filter(m => !!m.router));
                    newCtx.restore(context.store());
                }

                newCtx.set('data', data);
                this.execute(newCtx, mw);
            };
        }

        public process(...args) {
            this.router.process(...args);
            return this;
        }

        public use(fn) {
            if (typeof fn !== 'function') throw new TypeError('middleware must be a function.');
            this.middleware.push(fn);
            return this;
        }

        public reload() {
            this.handler = this.callback();
        }

        public send(path: Path, data, ctx?: Context.Context) {
            if (!this.handler || !this.__initialized) throw new Error('Application is not initialised.');
            this.handler(path, data, ctx);
        }

        public static createCompose(arrFn) {
            let cyclicIgnore: Set<string> = new Set;
            if (!Array.isArray(arrFn)) throw new TypeError('Argument should be an array');
            if (arrFn.some(item => typeof item !== 'function'))
                throw new TypeError('Collection should be an array of functions.');

            return function (context, next) {
                let index = -1;
                return exec(0);

                function exec(i) {
                    if (i <= index) return Promise.reject(new Error('Function next() called multiple times'));
                    index = i;
                    let fn = arrFn[i];
                    if (i === arrFn.length) fn = next;
                    if (!fn) {
                        cyclicIgnore = new Set;
                        return Promise.resolve();
                    }
                    try {
                        if(fn.router && !context.app.options.ignoreCyclicError && cyclicIgnore.has(context.path))
                            throw new Error('Cyclic calling with same `path`: `'.concat(context.path, '`, be careful'));
                        if(fn.router) cyclicIgnore.add(context.path);
                        return Promise.resolve(fn(context, exec.bind(null, i + 1)));
                    } catch (err) {
                        cyclicIgnore = new Set;
                        return Promise.reject(err);
                    }
                }
            }
        }
    }

    export interface IOptions {
        withListen?: boolean;
        ignoreCyclicError?: boolean;
    }
}