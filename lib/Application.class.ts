import {EventEmitter} from "events";
import {Router} from "./Router.class";
import {Context} from "./Context.class";
import {Middleware} from "./Middleware.class";

export namespace Application {
    import Path = Router.Path;
    import Dict = NodeJS.Dict;

    export type Callback = (...args: any[]) => any;

    export interface Helper extends Callback {
        name: string;
    }

    export class Application extends EventEmitter {
        protected __initialized: boolean = false;
        protected context: Context.Context;
        protected readonly router: Router.Router;
        protected readonly middleware: Middleware.Middleware[] = [];
        protected helpers: NodeJS.Dict<Helper> = {};
        public handler: <T extends any>(path: Path, data?: T, ctx?: Context.Context) => void;

        constructor(public readonly options: IOptions = {}) {
            super();
            this.router = new Router.Router({} as Router.IOptions);
            this.context = Object.create(new Context.Context({ app: this }));
        }

        public init(): Application {
            if (this.__initialized) {
                return this;
            }

            if(!this.handler) this.reload();
            this.use(this.router.routes());
            Object.assign(this.context, this.helpers);
            this.__initialized = true;
            this.emit('initialized');
            return this;
        }

        public stop(): Application {
            this.__initialized = false;
            this.emit('stop');
            return this;
        }

        protected execute(ctx: Context.Context, fnWare: Callback): void {
            fnWare(ctx)
                .then(() => this.emit('end', ctx))
                .catch((err) => this.emit('error', err));
        }

        protected createContext(path: Path): Context.Context {
            return Object.assign(
                Object.create(this.context),
                {
                    path,
                    app: this,
                    __pathStory: new Set
                }
            );
        }

        protected callback(): Callback {
            let mw = Application.createCompose(this.middleware);

            return (path: Path, data: any, context?: Context.Context | Dict<any>) => {
                const newCtx = this.createContext(path);
                this.emit(path, Context.Context.clone(newCtx));

                if (context) {
                    context.__pathStory.add(context.path);

                    for(const key in context) {
                        if (context.hasOwnProperty(key) &&  key !== 'path') {
                            newCtx[key] = context[key];
                        }
                    }

                    newCtx.path = path;
                    mw = Application.createCompose(this.middleware.filter(m => !!m.router));
                }

                newCtx.data = data;
                this.execute(newCtx, mw);
            };
        }

        public process(...args: any[]): Application {
            this.router.process(...args);
            return this;
        }

        public use(fn: Callback): Application {
            if (typeof fn !== 'function') throw new TypeError('Middleware must be a function.');
            this.middleware.push(fn);
            return this;
        }

        public reload(): Application {
            this.handler = this.callback();
            return this;
        }

        public send<T extends any>(path: Path, data: T, ctx?: Context.Context): Application {
            if (!this.handler || !this.__initialized) throw new Error('Application is not initialized.');

            this.handler(path, data, ctx);
            return this;
        }

        public helper<Context extends any>(name?: string,callback?: Helper, context?: Context): Application {
            callback = typeof name === 'function' ? name : callback;
            name = typeof name === 'string' ? name : callback ? callback.name : undefined;

            if(!name) throw new Error('Helper must be named FunctionDeclaration or first argument should be not empty string.');
            if(!callback) throw new Error('Helper must be function or Function Declaration.');
            if(typeof this.helpers[name] === 'function') throw new Error('Helper with this named already declared.');
            this.helpers[name] = !context ? callback : callback.bind(context);
            return this;
        }

        public static createCompose(arrFn: Callback[]): Callback {
            if (!Array.isArray(arrFn)) throw new TypeError('Argument should be an array');
            if (arrFn.some(item => typeof item !== 'function'))
                throw new TypeError('Collection should be an array of functions.');

            return function (context, next) {
                let index = -1;
                return exec(0);

                function exec(i, err?: Error) {
                    if (i <= index) return Promise.reject(new Error('Function next() called multiple times'));
                    if(err instanceof Error) {
                        if(arrFn[i - 1] && arrFn[i - 1].constructor.name === 'AsyncFunction') {
                            return Promise.reject(err);
                        } else {
                            throw err;
                        }
                    }
                    index = i;
                    let fn = arrFn[i];
                    if (i === arrFn.length) fn = next;
                    if (!fn) {
                        context.__pathStory.clear();
                        return Promise.resolve();
                    }
                    try {
                        if(!context.app.options.ignoreCyclicError && context.__pathStory.has(context.path))
                            return Promise.reject(new Error('Cyclic calling with same `path`: `'.concat(context.path, '`, be careful')));
                        const next = exec.bind(null, i + 1);
                        context.next = next;
                        return Promise.resolve(fn(context, next));
                    } catch (err) {
                        context.__pathStory.clear();
                        if(arrFn[i - 1] && arrFn[i - 1].constructor.name === 'AsyncFunction') {
                            return Promise.reject(err);
                        } else {
                            throw err;
                        }
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