import {pathToRegexp, Key} from 'path-to-regexp';
import {Middleware} from "./Middleware.class";
import {Router} from "./Router.class";
import {Context} from "./Context.class";

export namespace Layer {
    import Dict = NodeJS.Dict;
    import Path = Router.Path;
    import NextCallback = Middleware.NextCallback;

    export type AnyDict = { [key: string]: any };

    export class Layer {
        public name: string = '';
        public stack: Middleware.Middleware[] = [];
        protected regexp: RegExp;
        protected paramNames: Key[] = [];

        constructor(public path: string, middleware: Middleware.Middleware[] | Middleware.Middleware, protected readonly options: Dict<any> = {} as AnyDict) {
            this.regexp = pathToRegexp(this.path, this.paramNames, options);
            this.stack = Array.isArray(middleware) ?
                middleware :
                [middleware];

            if(this.stack.some(mw => typeof mw !== 'function')) throw TypeError('All middleware should have callback function.');
        }

        match(path: Path) {
            return this.regexp.test(path);
        }

        params(captures, existingParams) {
            const params = existingParams || {};
            for (let len = captures.length, i=0; i<len; i++) {
                if (this.paramNames[i]) {
                    params[this.paramNames[i].name] = captures[i];
                }
            }

            return params;
        }

        param (param, fn) {
            const stack = this.stack;
            const params = this.paramNames;
            const middleware = function (ctx: Context.Context, next: NextCallback) {
                return fn.call(this, ctx.params[param], ctx, next);
            } as Middleware.Middleware;

            middleware.param = param;

            const names = params.map(function (p) {
                return p.name;
            });

            const x = names.indexOf(param);
            if (x > -1) {
                stack.some((mw, i) => {
                    if (!mw.param || names.indexOf(fn.param) > x) {
                        stack.splice(i, 0, middleware);
                        return true;
                    }

                    return false;
                });
            }

            return this;
        };

        captures (path) {
            return this.options.ignoreCaptures ? [] : path.match(this.regexp).slice(1);
        };

        setPrefix (prefix) {
            if (this.path) {
                this.path = (this.path !== '/' || this.options.strict === true) ? `${prefix}${this.path}` : prefix;
                this.paramNames = [];
                this.regexp = pathToRegexp(this.path, this.paramNames, this.options);
            }

            return this;
        };
    }
}