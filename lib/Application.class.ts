import {Router} from "./Router.class";
import {Context} from "./Context.class";
import {Middleware} from "./Middleware.class";

export namespace Application {
    import Path = Router.Path;

    export class Application {
        protected context: Context.Context;
        protected readonly router: Router.Router;
        protected readonly middleware: Middleware.Middleware[] = [];
        protected readonly handler: (path: Path, data: any) => void;

        constructor(protected readonly options: IOptions) {
            this.handler = this.callback();
        }

        execute(ctx: Context.Context, fnWare) {
            fnWare(ctx).catch(ctx.error);
        }

        createContext(path: Path) {
            this.context = new Context.Context({
                app: this,
                path
            });

            return Object.create(this.context);
        }

        use(fn) {
            if (typeof fn !== 'function') throw new TypeError('middleware must be a function.');
            this.middleware.push(new Middleware.Middleware({ callback: fn }));
            return this;
        }

        callback() {
            const mw = Application.createCompose(this.middleware.map(item => item.callback));

            return (path: Path, data: any) => {
                const ctx = this.createContext(path);
                ctx.set('data', data);
                return this.execute(ctx, mw);
            };
        }

        send(path: Path, data) {
            this.handler(path, data);
        }

        public static createCompose(arrFn) {
            if (!Array.isArray(arrFn)) throw new TypeError('Argument should be an array');
            for (const fn of arrFn) {
                if (typeof fn !== 'function') throw new TypeError('Collection should be an array of functions.');
            }

            return function (context, next) {
                let index = -1;
                return exec(0);

                function exec(i) {
                    if (i <= index) return Promise.reject(new Error('next() called multiple times'))
                    index = i;
                    let fn = arrFn[i];
                    if (i === arrFn.length) fn = next;
                    if (!fn) return Promise.resolve();
                    try {
                        return Promise.resolve(fn(context, exec.bind(null, i + 1)));
                    } catch (err) {
                        return Promise.reject(err);
                    }
                }
            }
        }
    }

    export interface IOptions {

    }
}